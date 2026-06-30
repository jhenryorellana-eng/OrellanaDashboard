"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Mic, Sparkles, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  eventsForDate,
  todayProgress,
  nextEvent,
} from "@/lib/selectors";
import { dateKey, toDateTime, formatHour } from "@/lib/utils";
import Clock from "../Clock";
import ProgressRing from "../ProgressRing";
import EventCard from "../EventCard";
import CategoryIcon from "../CategoryIcon";

export default function TodayView() {
  const events = useStore((s) => s.events);
  const notes = useStore((s) => s.notes);
  const openEditor = useStore((s) => s.openEditor);
  const setTab = useStore((s) => s.setTab);

  const today = dateKey(new Date());
  const todays = eventsForDate(events, today);
  const progress = todayProgress(events);
  const next = nextEvent(events);

  const weekCount = events.filter((e) => {
    const diff = (toDateTime(e.date, e.time).getTime() - Date.now()) / 86400000;
    return diff >= -0.5 && diff <= 7;
  }).length;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between pt-2">
        <Clock />
        <button
          onClick={() => setTab("settings")}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 font-display text-lg font-semibold text-gold"
        >
          O
        </button>
      </header>

      {/* Hero: anillo de progreso del día */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1] }}
        className="glass relative overflow-hidden p-5"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="flex items-center gap-5">
          <ProgressRing percent={progress.percent}>
            <span className="tnum font-display text-3xl font-semibold">
              {progress.done}
              <span className="text-slate-500">/{progress.total}</span>
            </span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-widest text-slate-400">
              eventos
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-gold/80">
              Progreso de hoy
            </p>
            <p className="mt-1 font-display text-xl font-semibold leading-snug">
              {progress.total === 0
                ? "Agenda despejada"
                : progress.percent === 100
                  ? "¡Día completado!"
                  : `${progress.percent}% completado`}
            </p>
            {next ? (
              <p className="mt-2 text-sm text-slate-400">
                Próximo{" "}
                <span className="text-slate-200">
                  {formatDistanceToNow(toDateTime(next.date, next.time), {
                    locale: es,
                    addSuffix: true,
                  })}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Sin pendientes próximos</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Próximo evento destacado */}
      {next && (
        <section>
          <SectionTitle>Lo que sigue</SectionTitle>
          <button
            onClick={() => openEditor(next)}
            className="glass mt-2 flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.99]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
              <CategoryIcon category={next.category} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold">
                {next.title}
              </p>
              <p className="tnum text-sm text-slate-400">
                {formatHour(next.time)}
                {next.location ? ` · ${next.location}` : ""}
              </p>
            </div>
            <ArrowRight className="text-slate-500" size={20} />
          </button>
        </section>
      )}

      {/* Stats rápidas */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<CalendarDays size={18} className="text-azure" />}
          value={weekCount}
          label="Esta semana"
          onClick={() => setTab("calendar")}
        />
        <StatCard
          icon={<Mic size={18} className="text-violet" />}
          value={notes.length}
          label="Notas de voz"
          onClick={() => setTab("notes")}
        />
      </section>

      {/* Agenda de hoy */}
      <section>
        <SectionTitle>Agenda de hoy</SectionTitle>
        <div className="mt-2 space-y-2.5">
          {todays.length === 0 ? (
            <EmptyToday onAdd={() => openEditor(null, today)} />
          ) : (
            todays.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} onClick={() => openEditor(e)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
      {children}
    </h2>
  );
}

function StatCard({
  icon,
  value,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="glass-soft p-4 text-left transition active:scale-[0.98]">
      <div className="flex items-center gap-2">{icon}</div>
      <p className="tnum mt-2 font-display text-3xl font-semibold">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </button>
  );
}

function EmptyToday({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="glass-soft flex w-full flex-col items-center gap-2 px-4 py-8 text-center transition active:scale-[0.99]"
    >
      <Sparkles className="text-gold" size={24} />
      <p className="font-display text-lg font-semibold">Tu día está libre</p>
      <p className="text-sm text-slate-400">Toca para agendar tu primer evento</p>
    </button>
  );
}
