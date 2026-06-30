"use client";

import { motion } from "framer-motion";
import {
  ExternalLink,
  CalendarPlus,
  Trash2,
  Newspaper,
  CalendarClock,
  MapPin,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { TechItem, RsvpStatus } from "@/lib/types";
import { RSVP_META } from "@/lib/tech";
import { relativeDayLabel, formatHour, cn } from "@/lib/utils";

const RSVPS: RsvpStatus[] = ["going", "maybe", "skip"];

export default function TechCard({ item }: { item: TechItem }) {
  const setTechRsvp = useStore((s) => s.setTechRsvp);
  const removeTech = useStore((s) => s.removeTech);
  const openEditorDraft = useStore((s) => s.openEditorDraft);

  const isEvent = item.kind === "event";
  const accent = isEvent ? "#6aa8ff" : "#b794f6";

  function agendar() {
    openEditorDraft({
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      notes: [item.summary, item.url].filter(Boolean).join("\n\n"),
      category: "meeting",
      reminderMinutes: 60,
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-soft p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ background: `${accent}1f` }}
        >
          {isEvent ? (
            <CalendarClock size={17} style={{ color: accent }} />
          ) : (
            <Newspaper size={17} style={{ color: accent }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="pill px-2 py-0.5 text-[10px]"
              style={{ background: `${accent}1f`, color: accent }}
            >
              {isEvent ? "Evento" : "Noticia"}
            </span>
            {item.source && (
              <span className="truncate text-[11px] text-slate-500">
                {item.source}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold leading-snug text-slate-100">
            {item.title}
          </h3>
        </div>
        <button
          onClick={() => removeTech(item.id)}
          aria-label="Quitar"
          className="shrink-0 text-slate-500 transition hover:text-coral active:scale-90"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {(item.date || item.location) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {item.date && (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
              <CalendarClock size={12} />
              {relativeDayLabel(item.date)}
              {item.time ? ` · ${formatHour(item.time)}` : ""}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={12} />
              {item.location}
            </span>
          )}
        </div>
      )}

      {item.summary && (
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.summary}</p>
      )}

      {isEvent && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {RSVPS.map((r) => {
            const meta = RSVP_META[r];
            const active = item.rsvp === r;
            return (
              <button
                key={r}
                onClick={() => setTechRsvp(item.id, r)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition active:scale-95",
                  active ? "border-transparent" : "border-white/10 text-slate-300",
                )}
                style={active ? { background: `${meta.color}26`, color: meta.color } : undefined}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-3 py-1.5 text-xs font-bold text-ink-950 transition active:scale-95"
          >
            <ExternalLink size={13} />
            {isEvent ? "Inscripción" : "Leer"}
          </a>
        )}
        {isEvent && item.date && (
          <button
            onClick={agendar}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition active:scale-95"
          >
            <CalendarPlus size={13} /> Agendar
          </button>
        )}
      </div>
    </motion.div>
  );
}
