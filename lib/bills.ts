import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Bill, BillCategory, BillFrequency } from "./types";

export { formatMoney, CURRENCIES, REMINDER_DAYS_OPTIONS } from "./staff";

export interface BillCategoryMeta {
  label: string;
  color: string;
  icon:
    | "CreditCard"
    | "Zap"
    | "Repeat"
    | "Landmark"
    | "Home"
    | "Receipt"
    | "Wallet";
}

export const BILL_CATEGORY_META: Record<BillCategory, BillCategoryMeta> = {
  tarjeta: { label: "Tarjeta", color: "#b794f6", icon: "CreditCard" },
  servicio: { label: "Servicio", color: "#f5b642", icon: "Zap" },
  suscripcion: { label: "Suscripción", color: "#6aa8ff", icon: "Repeat" },
  prestamo: { label: "Préstamo", color: "#ff6f6f", icon: "Landmark" },
  renta: { label: "Renta", color: "#4fe3c1", icon: "Home" },
  impuesto: { label: "Impuesto", color: "#ff8f6f", icon: "Receipt" },
  otro: { label: "Otro", color: "#8aa0c0", icon: "Wallet" },
};

export const BILL_CATEGORY_ORDER: BillCategory[] = [
  "tarjeta",
  "servicio",
  "suscripcion",
  "prestamo",
  "renta",
  "impuesto",
  "otro",
];

export const BILL_FREQUENCY_LABELS: Record<BillFrequency, string> = {
  semanal: "Semanal",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  unico: "Único",
};

const MONTHLY_FACTOR: Record<BillFrequency, number> = {
  semanal: 4.33,
  mensual: 1,
  bimestral: 1 / 2,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
  unico: 0,
};

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function shift(dateStr: string, freq: BillFrequency, dir: 1 | -1): string {
  const d = new Date(`${dateStr}T00:00:00`);
  switch (freq) {
    case "semanal":
      d.setDate(d.getDate() + 7 * dir);
      break;
    case "mensual":
      d.setMonth(d.getMonth() + 1 * dir);
      break;
    case "bimestral":
      d.setMonth(d.getMonth() + 2 * dir);
      break;
    case "trimestral":
      d.setMonth(d.getMonth() + 3 * dir);
      break;
    case "semestral":
      d.setMonth(d.getMonth() + 6 * dir);
      break;
    case "anual":
      d.setFullYear(d.getFullYear() + 1 * dir);
      break;
    case "unico":
      break;
  }
  return toKey(d);
}

export const advanceDue = (dateStr: string, freq: BillFrequency) =>
  shift(dateStr, freq, 1);

export function daysUntil(dateStr: string): number {
  const due = new Date(`${dateStr}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / 86_400_000);
}

export interface DueStatus {
  state: "pagado" | "vencido" | "hoy" | "pronto" | "futuro";
  days: number;
  label: string;
  color: string;
}

export function dueStatus(bill: Bill): DueStatus {
  if (bill.frequency === "unico" && bill.payments.length > 0) {
    return { state: "pagado", days: 0, label: "Pagado", color: "#4fe3c1" };
  }
  const days = daysUntil(bill.nextDueDate);
  if (days < 0) {
    return {
      state: "vencido",
      days,
      label: `Vencido hace ${-days} d`,
      color: "#ff6f6f",
    };
  }
  if (days === 0) {
    return { state: "hoy", days, label: "Vence hoy", color: "#ff6f6f" };
  }
  if (days <= 7) {
    return { state: "pronto", days, label: `Vence en ${days} d`, color: "#f5b642" };
  }
  return {
    state: "futuro",
    days,
    label: `Vence ${formatDueDate(bill.nextDueDate)}`,
    color: "#8aa0c0",
  };
}

export function formatDueDate(dateStr: string): string {
  return format(new Date(`${dateStr}T00:00:00`), "d MMM", { locale: es });
}

export function monthlyEquivalent(bill: Bill): number {
  return bill.amount * MONTHLY_FACTOR[bill.frequency];
}

/** Total mensualizado por moneda (excluye pagos únicos). */
export function monthlyTotals(bills: Bill[]): Record<string, number> {
  return bills.reduce<Record<string, number>>((acc, b) => {
    const eq = monthlyEquivalent(b);
    if (eq > 0) acc[b.currency] = (acc[b.currency] ?? 0) + eq;
    return acc;
  }, {});
}

/** Pagos por vencer (incluye vencidos), ordenados por fecha. */
export function upcomingBills(bills: Bill[], withinDays = 9999): Bill[] {
  return bills
    .filter((b) => !(b.frequency === "unico" && b.payments.length > 0))
    .filter((b) => daysUntil(b.nextDueDate) <= withinDays)
    .sort((a, b) => daysUntil(a.nextDueDate) - daysUntil(b.nextDueDate));
}

/** Conteo de vencidos + por vencer en los próximos N días. */
export function dueSoonCount(bills: Bill[], withinDays = 7): number {
  return bills.filter((b) => {
    if (b.frequency === "unico" && b.payments.length > 0) return false;
    return daysUntil(b.nextDueDate) <= withinDays;
  }).length;
}
