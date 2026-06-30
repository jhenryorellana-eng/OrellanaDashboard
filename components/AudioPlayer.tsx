"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const BARS = 48;
const SPEEDS = [1, 1.5, 2] as const;

function mmss(s: number) {
  const sec = Math.max(0, Math.floor(s));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Reproductor con waveform decodificado, scrubber y control de velocidad. */
export default function AudioPlayer({
  blob,
  durationSec,
  accent = "#f5b642",
}: {
  blob: Blob;
  durationSec: number;
  accent?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<number[]>(Array(BARS).fill(0.25));
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  // URL para el <audio>
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  // Decodifica el audio una vez para extraer los picos de la onda
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
        const data = buf.getChannelData(0);
        const block = Math.floor(data.length / BARS) || 1;
        const next: number[] = [];
        let max = 0.0001;
        for (let i = 0; i < BARS; i++) {
          let peak = 0;
          for (let j = 0; j < block; j++) {
            const v = Math.abs(data[i * block + j] || 0);
            if (v > peak) peak = v;
          }
          next.push(peak);
          if (peak > max) max = peak;
        }
        if (!cancelled) setPeaks(next.map((p) => Math.max(0.08, p / max)));
        ctx.close().catch(() => {});
      } catch {
        /* formato no decodificable: dejamos las barras planas */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  const total = durationSec || 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.playbackRate = SPEEDS[speedIdx];
      void a.play();
    }
  }

  function seekFromEvent(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || total <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = frac * total;
    setCurrent(frac * total);
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }

  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/40 p-2.5">
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Reproducir"}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-950 transition active:scale-90"
        style={{ background: accent }}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

      <div
        onClick={seekFromEvent}
        className="flex h-9 flex-1 cursor-pointer items-center gap-[2px]"
      >
        {peaks.map((p, i) => {
          const filled = i / BARS <= progress;
          return (
            <span
              key={i}
              className="flex-1 rounded-full transition-colors"
              style={{
                height: `${Math.max(10, p * 100)}%`,
                background: filled ? accent : "rgba(255,255,255,0.16)",
              }}
            />
          );
        })}
      </div>

      <span className="tnum w-9 shrink-0 text-right text-xs text-slate-400">
        {mmss(playing || current > 0 ? current : total)}
      </span>

      <button
        onClick={cycleSpeed}
        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold tnum text-slate-300 transition active:scale-90"
      >
        {SPEEDS[speedIdx]}×
      </button>

      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onEnded={() => {
            setPlaying(false);
            setCurrent(0);
          }}
          className="hidden"
        />
      )}
    </div>
  );
}
