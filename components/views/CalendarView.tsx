"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { eventsForDate, colorsForDate } from "@/lib/selectors";
import { CATEGORY_META } from "@/lib/constants";
import { dateKey, parseISO, cn, relativeDayLabel } from "@/lib/utils";
import EventCard from "../EventCard";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const COLOR_MAP = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.color]),
) as Record<string, string>;

export default function CalendarView() {
  const events = useStore((s) => s.events);
  const selectedDate = useStore((s) => s.selectedDate);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const openEditor = useStore((s) => s.openEditor);

  const [cursor, setCursor] = useState(() => parseISO(selectedDate));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayEvents = eventsForDate(events, selectedDate);

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold capitalize">
          {format(cursor, "MMMM", { locale: es })}{" "}
          <span className="text-slate-500">{format(cursor, "yyyy")}</span>
        </h1>
        <div className="flex gap-2">
          <NavBtn onClick={() => setCursor((c) => subMonths(c, 1))}>
            <ChevronLeft size={20} />
          </NavBtn>
          <NavBtn onClick={() => setCursor((c) => addMonths(c, 1))}>
            <ChevronRight size={20} />
          </NavBtn>
        </div>
      </header>

      <section className="glass p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-[11px] font-bold uppercase text-slate-500">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = dateKey(day);
            const selected = key === selectedDate;
            const inMonth = isSameMonth(day, cursor);
            const dots = colorsForDate(events, key, COLOR_MAP).slice(0, 3);
            return (
              <button
                key={key}
                onClick={() => setSelectedDate(key)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition",
                  !inMonth && "text-slate-600",
                  inMonth && !selected && "text-slate-200 hover:bg-white/5",
                  selected && "bg-gradient-to-br from-gold-300 to-gold-600 font-bold text-ink-950",
                )}
              >
                {isToday(day) && !selected && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
                )}
                <span className="tnum">{format(day, "d")}</span>
                <span className="absolute bottom-1.5 flex gap-0.5">
                  {dots.map((c, i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ background: selected ? "rgba(6,8,15,0.6)" : c }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display text-xl font-semibold first-letter:uppercase">
            {relativeDayLabel(selectedDate)}
          </h2>
          <button
            onClick={() => openEditor(null, selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold transition active:scale-95"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 space-y-2.5"
        >
          {dayEvents.length === 0 ? (
            <div className="glass-soft px-4 py-10 text-center">
              <p className="font-display text-lg font-semibold text-slate-300">
                Sin eventos este día
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Toca «Agregar» para planificar algo.
              </p>
            </div>
          ) : (
            dayEvents.map((e, i) => (
              <EventCard key={e.id} event={e} index={i} onClick={() => openEditor(e)} />
            ))
          )}
        </motion.div>
      </section>
    </div>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
    >
      {children}
    </button>
  );
}
