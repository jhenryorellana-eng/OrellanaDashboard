export type EventCategory =
  | "meeting"
  | "deadline"
  | "travel"
  | "finance"
  | "personal"
  | "other";

export type Priority = "low" | "medium" | "high";

export type TabKey = "today" | "calendar" | "notes" | "settings";

export interface EventItem {
  id: string;
  title: string;
  notes?: string;
  /** Fecha en formato yyyy-MM-dd */
  date: string;
  /** Hora de inicio HH:mm */
  time: string;
  /** Hora de fin opcional HH:mm */
  endTime?: string;
  location?: string;
  category: EventCategory;
  priority: Priority;
  /** Minutos antes del evento para el recordatorio. null = sin recordatorio */
  reminderMinutes: number | null;
  createdAt: number;
}

export interface VoiceNote {
  id: string;
  /** Transcripción de la voz a texto */
  text: string;
  /** Audio original grabado (se guarda en IndexedDB) */
  audio?: Blob | null;
  durationSec: number;
  pinned: boolean;
  /** Fecha opcional asociada yyyy-MM-dd */
  linkedDate?: string;
  createdAt: number;
}
