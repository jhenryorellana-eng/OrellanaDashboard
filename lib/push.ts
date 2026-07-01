import { supabase } from "./supabase";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC
  );
}

/**
 * Suscribe este dispositivo a Web Push y guarda la suscripción en Supabase.
 * Requiere permiso de notificaciones concedido y service worker registrado.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
    }
    const { error } = await supabase.from("push_subscriptions").upsert(
      { endpoint: sub.endpoint, subscription: sub.toJSON() },
      { onConflict: "user_id,endpoint" },
    );
    return !error;
  } catch {
    return false;
  }
}
