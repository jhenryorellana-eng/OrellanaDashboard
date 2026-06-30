"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  PinOff,
  Trash2,
  AudioLines,
  Share2,
  Copy,
  Check,
  CalendarPlus,
  Link2,
  Settings,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { VoiceNote } from "@/lib/types";
import {
  timeAgo,
  cn,
  deriveTitle,
  relativeDayLabel,
  formatHour,
} from "@/lib/utils";
import { parseSpanishDateTime } from "@/lib/parseDateTime";
import VoiceRecorder from "../VoiceRecorder";
import AudioPlayer from "../AudioPlayer";

export default function NotesView() {
  const notes = useStore((s) => s.notes);
  const setTab = useStore((s) => s.setTab);

  const sorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) || b.createdAt - a.createdAt,
      ),
    [notes],
  );

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notas de voz</h1>
          <p className="text-sm text-slate-400">
            Captura ideas al instante con tu voz.
          </p>
        </div>
        <button
          onClick={() => setTab("settings")}
          aria-label="Ajustes"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
        >
          <Settings size={18} />
        </button>
      </header>

      <VoiceRecorder />

      <section>
        <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          {sorted.length > 0 ? `${sorted.length} guardadas` : "Historial"}
        </h2>
        <div className="mt-3 space-y-2.5">
          <AnimatePresence initial={false}>
            {sorted.length === 0 ? (
              <p className="glass-soft px-4 py-8 text-center text-sm text-slate-500">
                Aún no tienes notas. Graba la primera arriba 👆
              </p>
            ) : (
              sorted.map((n) => <NoteCard key={n.id} note={n} />)
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function NoteCard({ note }: { note: VoiceNote }) {
  const removeNote = useStore((s) => s.removeNote);
  const togglePin = useStore((s) => s.togglePinNote);
  const openEditorDraft = useStore((s) => s.openEditorDraft);
  const linkNoteToDate = useStore((s) => s.linkNoteToDate);
  const [copied, setCopied] = useState(false);

  const detected = useMemo(() => parseSpanishDateTime(note.text), [note.text]);

  function createEvent() {
    openEditorDraft({
      title: deriveTitle(note.text),
      notes: note.text || undefined,
      date: detected?.date,
      time: detected?.time ?? undefined,
      category: "other",
      reminderMinutes: 15,
    });
    if (detected?.date) linkNoteToDate(note.id, detected.date);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(note.text || "Nota de voz");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false); // clipboard no disponible (contexto no seguro)
    }
  }

  async function share() {
    const text = note.text || "Nota de voz";
    const navAny = navigator as Navigator & {
      canShare?: (d?: ShareData) => boolean;
    };
    try {
      const file = note.audio
        ? new File([note.audio], "nota-de-voz.webm", {
            type: note.audio.type || "audio/webm",
          })
        : null;
      if (file && navAny.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: "Nota de voz", text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: "Nota de voz", text });
      } else {
        await copy();
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") await copy();
    }
  }

  const mmss = `${Math.floor(note.durationSec / 60)}:${String(
    note.durationSec % 60,
  ).padStart(2, "0")}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn("glass-soft p-4", note.pinned && "ring-1 ring-gold/40")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <AudioLines size={14} className="text-gold" />
            <span className="tnum">{mmss}</span>
          </span>
          <span>·</span>
          <span>{timeAgo(note.createdAt)}</span>
          {note.linkedDate && (
            <span className="inline-flex items-center gap-1 text-azure/80">
              <Link2 size={12} />
              {relativeDayLabel(note.linkedDate)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <IconBtn onClick={share}>
            <Share2 size={15} />
          </IconBtn>
          <IconBtn onClick={() => togglePin(note.id)} active={note.pinned}>
            {note.pinned ? <PinOff size={15} /> : <Pin size={15} />}
          </IconBtn>
          <IconBtn onClick={() => removeNote(note.id)} danger>
            <Trash2 size={15} />
          </IconBtn>
        </div>
      </div>

      {note.text ? (
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
          {note.text}
        </p>
      ) : (
        <p className="mt-2 text-sm italic text-slate-500">Nota de audio sin texto</p>
      )}

      {note.audio && (
        <AudioPlayer blob={note.audio} durationSec={note.durationSec} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={createEvent}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
            detected
              ? "border border-gold/30 bg-gold/15 text-gold"
              : "border border-white/10 text-slate-300",
          )}
        >
          <CalendarPlus size={14} />
          {detected
            ? `Crear evento · ${relativeDayLabel(detected.date)}${
                detected.time ? ` ${formatHour(detected.time)}` : ""
              }`
            : "Crear evento"}
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition active:scale-95"
        >
          {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 transition active:scale-90",
        active && "text-gold",
        danger && "hover:text-coral",
        !active && !danger && "text-slate-300",
      )}
    >
      {children}
    </button>
  );
}
