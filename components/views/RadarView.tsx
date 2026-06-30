"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  List,
  CalendarDays,
  Settings,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { TechItem } from "@/lib/types";
import { feedItems, eventCountsByDate, REGION_DEFAULT } from "@/lib/tech";
import { dateKey, relativeDayLabel, cn } from "@/lib/utils";
import TechCard from "../TechCard";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
type Mode = "feed" | "calendar";
type Filter = "all" | "event" | "news";

export default function RadarView() {
  const techItems = useStore((s) => s.techItems);
  const loading = useStore((s) => s.techLoading);
  const error = useStore((s) => s.techError);
  const region = useStore((s) => s.radarRegion);
  const setRadarRegion = useStore((s) => s.setRadarRegion);
  const discoverTech = useStore((s) => s.discoverTech);
  const setTab = useStore((s) => s.setTab);

  const [mode, setMode] = useState<Mode>("feed");
  const [filter, setFilter] = useState<Filter>("all");
  const [regionInput, setRegionInput] = useState(region || REGION_DEFAULT);

  async function update() {
    await setRadarRegion(regionInput.trim() || REGION_DEFAULT);
    await discoverTech();
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-center gap-3">
        <button
          onClick={() => setTab("today")}
          aria-label="Volver"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold">Radar Tech</h1>
          <p className="text-sm text-slate-400">Eventos y noticias de tecnología e IA.</p>
        </div>
        <button
          onClick={() => setTab("settings")}
          aria-label="Ajustes"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Buscador con IA */}
      <section className="glass space-y-3 p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Región / ciudad de interés
          </span>
          <input
            value={regionInput}
            onChange={(e) => setRegionInput(e.target.value)}
            placeholder="Utah, EE.UU."
            className="input-base"
          />
        </label>
        <button
          onClick={update}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 py-3 font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Buscando con IA…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Actualizar radar
            </>
          )}
        </button>
        {error && <p className="text-sm text-coral">{error}</p>}
      </section>

      {/* Conmutador de vista */}
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        <ToggleBtn active={mode === "feed"} onClick={() => setMode("feed")}>
          <List size={15} /> Novedades
        </ToggleBtn>
        <ToggleBtn active={mode === "calendar"} onClick={() => setMode("calendar")}>
          <CalendarDays size={15} /> Calendario
        </ToggleBtn>
      </div>

      {techItems.length === 0 ? (
        <EmptyState loading={loading} onUpdate={update} />
      ) : mode === "feed" ? (
        <FeedMode techItems={techItems} filter={filter} setFilter={setFilter} />
      ) : (
        <CalendarMode techItems={techItems} />
      )}
    </div>
  );
}

function FeedMode({
  techItems,
  filter,
  setFilter,
}: {
  techItems: TechItem[];
  filter: Filter;
  setFilter: (f: Filter) => void;
}) {
  const list = useMemo(() => feedItems(techItems, filter), [techItems, filter]);
  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Todo" },
    { key: "event", label: "Eventos" },
    { key: "news", label: "Noticias" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
              filter === f.key
                ? "border-gold/40 bg-gold/15 text-gold"
                : "border-white/10 text-slate-300",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="glass-soft px-4 py-8 text-center text-sm text-slate-500">
          Nada en esta categoría todavía.
        </p>
      ) : (
        list.map((i) => <TechCard key={i.id} item={i} />)
      )}
    </div>
  );
}

function CalendarMode({ techItems }: { techItems: TechItem[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateKey(new Date()));

  const counts = useMemo(() => eventCountsByDate(techItems), [techItems]);
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayEvents = techItems.filter(
    (i) => i.kind === "event" && i.date === selected,
  );

  return (
    <div className="space-y-4">
      <section className="glass p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex gap-2">
            <NavBtn onClick={() => setCursor((c) => subMonths(c, 1))}>
              <ChevronLeft size={18} />
            </NavBtn>
            <NavBtn onClick={() => setCursor((c) => addMonths(c, 1))}>
              <ChevronRight size={18} />
            </NavBtn>
          </div>
        </div>
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
            const selectedDay = key === selected;
            const inMonth = isSameMonth(day, cursor);
            const has = counts[key] > 0;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition",
                  !inMonth && "text-slate-600",
                  inMonth && !selectedDay && "text-slate-200 hover:bg-white/5",
                  selectedDay && "bg-gradient-to-br from-azure to-[#3f7fe0] font-bold text-ink-950",
                )}
              >
                {isToday(day) && !selectedDay && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-azure" />
                )}
                <span className="tnum">{format(day, "d")}</span>
                {has && (
                  <span
                    className="absolute bottom-1.5 h-1 w-1 rounded-full"
                    style={{ background: selectedDay ? "rgba(6,8,15,0.6)" : "#6aa8ff" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div>
        <h2 className="px-1 font-display text-lg font-semibold capitalize first-letter:uppercase">
          {relativeDayLabel(selected)}
        </h2>
        <div className="mt-2 space-y-3">
          {dayEvents.length === 0 ? (
            <p className="glass-soft px-4 py-8 text-center text-sm text-slate-500">
              Sin eventos este día.
            </p>
          ) : (
            dayEvents.map((i) => <TechCard key={i.id} item={i} />)
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ loading, onUpdate }: { loading: boolean; onUpdate: () => void }) {
  return (
    <button
      onClick={onUpdate}
      disabled={loading}
      className="glass-soft flex w-full flex-col items-center gap-2 px-4 py-10 text-center transition active:scale-[0.99] disabled:opacity-60"
    >
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15">
        <Sparkles className="text-gold" size={24} />
      </div>
      <p className="font-display text-lg font-semibold">Descubre con IA</p>
      <p className="text-sm text-slate-400">
        Toca «Actualizar radar» para traer eventos y noticias al día.
      </p>
    </button>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition",
        active ? "bg-white/10 text-gold" : "text-slate-400",
      )}
    >
      {children}
    </button>
  );
}

function NavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
    >
      {children}
    </button>
  );
}
