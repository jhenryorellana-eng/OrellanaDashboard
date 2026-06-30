import type { TechItem, RsvpStatus } from "./types";

export const REGION_DEFAULT = "Estados Unidos";
export const TOPICS_DEFAULT = "tecnología, inteligencia artificial, startups";

export const RSVP_META: Record<
  RsvpStatus,
  { label: string; short: string; color: string }
> = {
  going: { label: "Asistiré", short: "Voy", color: "#4fe3c1" },
  maybe: { label: "Tal vez", short: "Tal vez", color: "#f5b642" },
  skip: { label: "No iré", short: "No", color: "#8aa0c0" },
};

/** Clave para deduplicar items descubiertos. */
export function techKey(item: {
  url?: string;
  title: string;
  date?: string;
}): string {
  return (item.url || `${item.title}|${item.date ?? ""}`).trim().toLowerCase();
}

/** Combina items nuevos con los existentes, sin duplicar ni perder el RSVP. */
export function mergeTechItems(
  existing: TechItem[],
  incoming: TechItem[],
): TechItem[] {
  const byKey = new Map(existing.map((i) => [techKey(i), i]));
  for (const item of incoming) {
    const key = techKey(item);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, { ...item, id: prev.id, rsvp: prev.rsvp, createdAt: prev.createdAt });
    } else {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
}

const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function isUpcoming(item: TechItem): boolean {
  return !!item.date && item.date >= todayKey();
}

/** Eventos próximos ordenados por fecha. */
export function upcomingEvents(items: TechItem[]): TechItem[] {
  return items
    .filter((i) => i.kind === "event" && isUpcoming(i))
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

/** Noticias y eventos sin fecha futura, ordenados por descubrimiento. */
export function feedItems(
  items: TechItem[],
  filter: "all" | "event" | "news",
): TechItem[] {
  return items
    .filter((i) => (filter === "all" ? true : i.kind === filter))
    .sort((a, b) => {
      // Eventos próximos primero (por fecha), luego lo más reciente
      const au = isUpcoming(a) ? 0 : 1;
      const bu = isUpcoming(b) ? 0 : 1;
      if (au !== bu) return au - bu;
      if (au === 0) return (a.date ?? "").localeCompare(b.date ?? "");
      return b.createdAt - a.createdAt;
    });
}

/** Mapa fecha -> nº de eventos, para el calendario. */
export function eventCountsByDate(items: TechItem[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, i) => {
    if (i.kind === "event" && i.date) acc[i.date] = (acc[i.date] ?? 0) + 1;
    return acc;
  }, {});
}
