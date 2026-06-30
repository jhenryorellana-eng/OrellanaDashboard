import type { EventCategory, Priority } from "./types";

export interface CategoryMeta {
  label: string;
  /** color HEX para acentos, puntos y bordes */
  color: string;
  /** nombre del icono de lucide-react */
  icon:
    | "Users"
    | "Flag"
    | "Plane"
    | "Wallet"
    | "Heart"
    | "Sparkles";
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  meeting: { label: "Reunión", color: "#6aa8ff", icon: "Users" },
  deadline: { label: "Deadline", color: "#ff6f6f", icon: "Flag" },
  travel: { label: "Viaje", color: "#4fe3c1", icon: "Plane" },
  finance: { label: "Finanzas", color: "#f5b642", icon: "Wallet" },
  personal: { label: "Personal", color: "#b794f6", icon: "Heart" },
  other: { label: "Otro", color: "#8aa0c0", icon: "Sparkles" },
};

export const CATEGORY_ORDER: EventCategory[] = [
  "meeting",
  "deadline",
  "travel",
  "finance",
  "personal",
  "other",
];

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string }
> = {
  high: { label: "Alta", color: "#ff6f6f" },
  medium: { label: "Media", color: "#f5b642" },
  low: { label: "Baja", color: "#4fe3c1" },
};

export const REMINDER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Sin recordatorio", value: null },
  { label: "Al momento", value: 0 },
  { label: "5 min antes", value: 5 },
  { label: "15 min antes", value: 15 },
  { label: "30 min antes", value: 30 },
  { label: "1 hora antes", value: 60 },
  { label: "1 día antes", value: 1440 },
];

export const APP_NAME = "Command Center";
export const APP_TAGLINE = "Tu día, bajo control ejecutivo.";
