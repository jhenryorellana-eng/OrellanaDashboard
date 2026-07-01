import type { EventItem, Bill, StaffMember } from "./types";
import { toDateTime } from "./utils";
import { nextPayday } from "./staff";

/**
 * Momento absoluto (ISO/UTC) en que debe dispararse el recordatorio, o null.
 * Se calcula en el navegador (hora local del usuario) → sin ambigüedad de zona
 * horaria en el servidor. El backend (edge function) solo compara con "ahora".
 */

const futureISO = (ms: number): string | null =>
  ms > Date.now() ? new Date(ms).toISOString() : null;

export function eventRemindAt(e: EventItem): string | null {
  if (e.reminderMinutes == null) return null;
  const fireAt = toDateTime(e.date, e.time).getTime() - e.reminderMinutes * 60_000;
  return futureISO(fireAt);
}

export function billRemindAt(b: Bill): string | null {
  if (b.reminderDaysBefore == null) return null;
  if (b.frequency === "unico" && b.payments.length > 0) return null;
  const due = new Date(`${b.nextDueDate}T09:00:00`).getTime();
  return futureISO(due - b.reminderDaysBefore * 86_400_000);
}

export function staffRemindAt(s: StaffMember): string | null {
  if (s.reminderDaysBefore == null || s.status === "inactivo") return null;
  const payday = nextPayday(s);
  if (!payday) return null;
  payday.setHours(9, 0, 0, 0);
  return futureISO(payday.getTime() - s.reminderDaysBefore * 86_400_000);
}
