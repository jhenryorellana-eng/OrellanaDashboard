import type { EventItem } from "./types";
import { CATEGORY_META } from "./constants";
import { toDateTime, formatHour } from "./utils";

/**
 * Recordatorios locales: mientras la PWA está abierta (o instalada en segundo
 * plano un rato), programamos timeouts para los eventos próximos y mostramos la
 * notificación vía el service worker. No requiere servidor ni claves VAPID.
 */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const WINDOW_MS = 24 * 60 * 60 * 1000; // solo programamos las próximas 24h

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission {
  if (!notificationsSupported()) return "denied";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

async function showNotification(event: EventItem) {
  if (notificationPermission() !== "granted") return;
  const meta = CATEGORY_META[event.category];
  const body = `${formatHour(event.time)} · ${meta.label}${
    event.location ? ` · ${event.location}` : ""
  }`;
  const options: NotificationOptions = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: event.id,
    data: { eventId: event.id },
  };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(`⏰ ${event.title}`, options);
      return;
    }
  } catch {
    /* fallback abajo */
  }
  new Notification(`⏰ ${event.title}`, options);
}

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
}

/** Reprograma todos los recordatorios a partir de la lista de eventos. */
export function scheduleReminders(events: EventItem[]) {
  if (!notificationsSupported() || notificationPermission() !== "granted") {
    return;
  }
  clearTimers();
  const now = Date.now();
  for (const event of events) {
    if (event.reminderMinutes == null) continue;
    const eventTime = toDateTime(event.date, event.time).getTime();
    const fireAt = eventTime - event.reminderMinutes * 60 * 1000;
    const delay = fireAt - now;
    if (delay <= 0 || delay > WINDOW_MS) continue;
    timers.set(
      event.id,
      setTimeout(() => {
        void showNotification(event);
        timers.delete(event.id);
      }, delay),
    );
  }
}

/** Notificación de prueba para validar permisos. */
export async function sendTestNotification() {
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return false;
  await showNotification({
    id: "test",
    title: "Recordatorios activos",
    date: "",
    time: new Date().toTimeString().slice(0, 5),
    category: "other",
    priority: "low",
    reminderMinutes: 0,
    createdAt: Date.now(),
  });
  return true;
}
