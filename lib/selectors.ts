import type { EventItem } from "./types";
import { toDateTime, dateKey } from "./utils";

export function sortByTime(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => a.time.localeCompare(b.time));
}

export function eventsForDate(events: EventItem[], date: string): EventItem[] {
  return sortByTime(events.filter((e) => e.date === date));
}

/** Próximos eventos a partir de ahora, ordenados cronológicamente. */
export function upcomingEvents(
  events: EventItem[],
  limit = 5,
): EventItem[] {
  const now = Date.now();
  return events
    .filter((e) => toDateTime(e.date, e.time).getTime() >= now - 60 * 60 * 1000)
    .sort(
      (a, b) =>
        toDateTime(a.date, a.time).getTime() -
        toDateTime(b.date, b.time).getTime(),
    )
    .slice(0, limit);
}

/** Próximo evento (el más cercano en el futuro). */
export function nextEvent(events: EventItem[]): EventItem | null {
  return upcomingEvents(events, 1)[0] ?? null;
}

/** Progreso del día: cuántos eventos de hoy ya pasaron. */
export function todayProgress(events: EventItem[]): {
  total: number;
  done: number;
  percent: number;
} {
  const today = dateKey(new Date());
  const todays = events.filter((e) => e.date === today);
  const now = Date.now();
  const done = todays.filter(
    (e) => toDateTime(e.date, e.time).getTime() < now,
  ).length;
  const total = todays.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

/** Mapa fecha -> nº de eventos, para pintar puntos en el calendario. */
export function countsByDate(events: EventItem[]): Record<string, number> {
  return events.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + 1;
    return acc;
  }, {});
}

/** Colores únicos de categorías presentes en una fecha (para los puntos). */
export function colorsForDate(
  events: EventItem[],
  date: string,
  colorMap: Record<string, string>,
): string[] {
  const cats = new Set(
    events.filter((e) => e.date === date).map((e) => e.category),
  );
  return Array.from(cats).map((c) => colorMap[c]);
}
