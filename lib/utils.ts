import {
  format,
  isToday,
  isTomorrow,
  isSameDay,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { es } from "date-fns/locale";

/** Une clases condicionalmente (mini "clsx"). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Identificador único, con fallback si crypto.randomUUID no existe. */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Clave de fecha yyyy-MM-dd a partir de un Date. */
export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Combina fecha (yyyy-MM-dd) y hora (HH:mm) en un Date local. */
export function toDateTime(dateStr: string, time: string): Date {
  return new Date(`${dateStr}T${(time || "00:00").padStart(5, "0")}:00`);
}

export function formatHour(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Etiqueta humana relativa: "Hoy", "Mañana" o fecha formateada. */
export function relativeDayLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  return format(d, "EEE d MMM", { locale: es });
}

export function fullDateLabel(d: Date): string {
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

/** Hash SHA-256 en hex (para guardar el PIN sin texto plano). */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deriva un título corto a partir del texto de una nota. */
export function deriveTitle(text: string, max = 48): string {
  const clean = (text || "").trim().replace(/\s+/g, " ");
  if (!clean) return "Nota de voz";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function timeAgo(ts: number): string {
  const mins = differenceInMinutes(new Date(), new Date(ts));
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export { isToday, isSameDay, parseISO, format };
