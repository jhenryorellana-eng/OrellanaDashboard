import type { EventItem, StaffMember, Bill } from "./types";

/**
 * Permisos + notificación local de prueba.
 * Los recordatorios reales se envían por Web Push desde el servidor
 * (Supabase edge function `send-reminders`), para que lleguen aunque la app
 * esté cerrada (incluido iPhone con la PWA instalada).
 */

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

async function notify(title: string, options: NotificationOptions) {
  if (notificationPermission() !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* sin service worker: usamos la API directa abajo */
  }
  new Notification(title, options);
}

// Los recordatorios ya se programan por Web Push en el servidor (columna
// remind_at + cron). Estas funciones se mantienen como no-op por compatibilidad.
export function scheduleReminders(_events: EventItem[]) {}
export function scheduleStaffReminders(_members: StaffMember[]) {}
export function scheduleBillReminders(_bills: Bill[]) {}

/** Notificación local de prueba para validar permisos. */
export async function sendTestNotification() {
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return false;
  await notify("🔔 Notificaciones activas", {
    body: "Recibirás recordatorios de tus eventos y pagos.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "test",
  });
  return true;
}
