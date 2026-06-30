"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pin, PinOff, Trash2, AudioLines } from "lucide-react";
import { useStore } from "@/lib/store";
import type { VoiceNote } from "@/lib/types";
import { timeAgo, cn } from "@/lib/utils";
import VoiceRecorder from "../VoiceRecorder";

export default function NotesView() {
  const notes = useStore((s) => s.notes);

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
      <header>
        <h1 className="font-display text-3xl font-semibold">Notas de voz</h1>
        <p className="text-sm text-slate-400">
          Captura ideas al instante con tu voz.
        </p>
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
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!note.audio) return;
    const objUrl = URL.createObjectURL(note.audio);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [note.audio]);

  const mmss = `${Math.floor(note.durationSec / 60)}:${String(note.durationSec % 60).padStart(2, "0")}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        "glass-soft p-4",
        note.pinned && "ring-1 ring-gold/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AudioLines size={14} className="text-gold" />
          <span className="tnum">{mmss}</span>
          <span>·</span>
          <span>{timeAgo(note.createdAt)}</span>
        </div>
        <div className="flex gap-1">
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

      {url && (
        <audio
          controls
          src={url}
          className="mt-3 h-9 w-full"
          style={{ colorScheme: "dark" }}
        />
      )}
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
