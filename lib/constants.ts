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
  /** Pregunta contextual que aparece al elegir esta categoría */
  detailLabel: string;
  detailPlaceholder: string;
  /** Prefijo corto para mostrar el detalle en la tarjeta del evento */
  detailPrefix: string;
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  meeting: {
    label: "Reunión",
    color: "#6aa8ff",
    icon: "Users",
    detailLabel: "¿Con quién es la reunión?",
    detailPlaceholder: "Inversionistas, equipo, cliente…",
    detailPrefix: "Con",
  },
  deadline: {
    label: "Deadline",
    color: "#ff6f6f",
    icon: "Flag",
    detailLabel: "¿Qué hay que entregar?",
    detailPlaceholder: "Entregable y responsable…",
    detailPrefix: "Entrega",
  },
  travel: {
    label: "Viaje",
    color: "#4fe3c1",
    icon: "Plane",
    detailLabel: "¿A dónde viajas?",
    detailPlaceholder: "Ciudad, vuelo, hotel…",
    detailPrefix: "Destino",
  },
  finance: {
    label: "Finanzas",
    color: "#f5b642",
    icon: "Wallet",
    detailLabel: "Monto y concepto",
    detailPlaceholder: "Ej. $5,000 — pago a proveedor",
    detailPrefix: "Monto",
  },
  personal: {
    label: "Personal",
    color: "#b794f6",
    icon: "Heart",
    detailLabel: "¿De qué se trata?",
    detailPlaceholder: "Detalle personal…",
    detailPrefix: "Detalle",
  },
  other: {
    label: "Otro",
    color: "#8aa0c0",
    icon: "Sparkles",
    detailLabel: "Detalle del evento",
    detailPlaceholder: "Añade contexto…",
    detailPrefix: "Nota",
  },
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

export const APP_NAME = "Orellana Dashboard";
export const APP_TAGLINE = "Tu día, bajo control ejecutivo.";
