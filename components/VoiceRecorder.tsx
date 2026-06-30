"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Trash2, Check, Loader2, Pause, Play } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  createSpeechController,
  speechSupported,
  type SpeechController,
} from "@/lib/speech";
import { cn } from "@/lib/utils";
import Waveform from "./Waveform";

const BARS = 28;
type Status = "idle" | "recording" | "review";
type Lang = "es-ES" | "en-US";

export default function VoiceRecorder() {
  const addNote = useStore((s) => s.addNote);
  const [status, setStatus] = useState<Status>("idle");
  const [paused, setPaused] = useState(false);
  const [lang, setLang] = useState<Lang>("es-ES");
  const [finalText, setFinalText] = useState("");
  const [partial, setPartial] = useState("");
  const [levels, setLevels] = useState<number[]>(Array(BARS).fill(0));
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => () => cleanup(), []);

  function startMeter() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevels(
        Array.from({ length: BARS }, (_, i) =>
          Math.min(1, (data[i % data.length] / 255) * 1.4),
        ),
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function startTimer() {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function startSpeech() {
    if (!speechSupported()) return;
    speechRef.current = createSpeechController(
      {
        onFinal: (t) => setFinalText((prev) => (prev ? `${prev} ${t}` : t)),
        onPartial: (t) => setPartial(t),
      },
      lang,
    );
    speechRef.current?.start();
  }

  function stopSpeech() {
    speechRef.current?.stop();
  }

  function cleanup() {
    stopMeter();
    stopTimer();
    stopSpeech();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  async function startRecording() {
    setError(null);
    setFinalText("");
    setPartial("");
    setSeconds(0);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        blobRef.current = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setStatus("review");
      };
      recorder.start();

      setupAnalyser(stream);
      startMeter();
      startTimer();
      startSpeech();
      setPaused(false);
      setStatus("recording");
    } catch {
      setError("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  function setupAnalyser(stream: MediaStream) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;
  }

  function pauseRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.pause();
    stopMeter();
    stopTimer();
    stopSpeech();
    setPartial("");
    setLevels(Array(BARS).fill(0));
    setPaused(true);
  }

  function resumeRecording() {
    if (recorderRef.current?.state === "paused") recorderRef.current.resume();
    startMeter();
    startTimer();
    startSpeech();
    setPaused(false);
  }

  function stopRecording() {
    stopMeter();
    stopTimer();
    stopSpeech();
    setPartial("");
    setLevels(Array(BARS).fill(0));
    setPaused(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  async function save() {
    setSaving(true);
    await addNote({
      text: finalText.trim(),
      audio: blobRef.current,
      durationSec: seconds,
      pinned: false,
    });
    setSaving(false);
    discard();
  }

  function discard() {
    blobRef.current = null;
    setFinalText("");
    setPartial("");
    setSeconds(0);
    setPaused(false);
    setStatus("idle");
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

  return (
    <div className="glass p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold">Nota de voz</h3>
          <p className="text-xs text-slate-400">
            {speechSupported()
              ? "Habla y la transcribimos en tiempo real."
              : "Tu navegador grabará el audio (sin transcripción)."}
          </p>
        </div>
        {status === "idle" && speechSupported() ? (
          <div className="flex overflow-hidden rounded-full border border-white/10">
            {(["es-ES", "en-US"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold transition",
                  lang === l ? "bg-gold text-ink-950" : "text-slate-400",
                )}
              >
                {l === "es-ES" ? "ES" : "EN"}
              </button>
            ))}
          </div>
        ) : (
          status !== "idle" && (
            <span
              className={cn(
                "tnum rounded-full px-3 py-1 text-sm font-semibold",
                paused ? "bg-white/5 text-slate-400" : "bg-white/5 text-gold",
              )}
            >
              {paused ? "⏸ " : ""}
              {mmss}
            </span>
          )
        )}
      </div>

      {status !== "idle" && (
        <div className="mt-4">
          <Waveform levels={levels} active={status === "recording" && !paused} />
        </div>
      )}

      {status !== "idle" && (
        <div className="mt-3 min-h-[64px] rounded-2xl border border-white/10 bg-ink-950/40 p-3 text-sm leading-relaxed">
          {status === "review" ? (
            <textarea
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              placeholder="Sin transcripción. Puedes escribir aquí…"
              className="h-24 w-full resize-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
            />
          ) : (
            <p className="text-slate-200">
              {finalText} <span className="text-slate-400">{partial}</span>
              {!finalText && !partial && (
                <span className="text-slate-500">
                  {paused ? "En pausa…" : "Escuchando…"}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-coral">{error}</p>}

      <div className="mt-5 flex items-center justify-center gap-3">
        {status === "idle" && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={startRecording}
            className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-glow"
          >
            <Mic size={28} />
          </motion.button>
        )}

        {status === "recording" && (
          <>
            <button
              onClick={paused ? resumeRecording : pauseRecording}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full border transition active:scale-90",
                paused
                  ? "border-transparent bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950"
                  : "border-white/10 bg-white/5 text-slate-200",
              )}
              aria-label={paused ? "Reanudar" : "Pausar"}
            >
              {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} />}
            </button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={stopRecording}
              className="relative grid h-16 w-16 place-items-center rounded-full bg-coral text-white shadow-[0_0_0_8px_rgba(255,111,111,0.15)]"
              aria-label="Detener"
            >
              {!paused && (
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-coral/50" />
              )}
              <Square size={24} fill="currentColor" />
            </motion.button>
          </>
        )}

        {status === "review" && (
          <>
            <button
              onClick={discard}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition active:scale-95"
            >
              <Trash2 size={20} />
            </button>
            <button
              disabled={saving}
              onClick={save}
              className="flex h-12 items-center gap-2 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-6 font-semibold text-ink-950 transition active:scale-95 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Guardar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
