import { differenceInMonths, getISOWeek, getISOWeekYear } from "date-fns";
import type {
  StaffMember,
  StaffStatus,
  PayFrequency,
  AccountType,
  PaymentMethod,
} from "./types";

export const STATUS_META: Record<
  StaffStatus,
  { label: string; color: string }
> = {
  activo: { label: "Activo", color: "#4fe3c1" },
  vacaciones: { label: "Vacaciones", color: "#f5b642" },
  inactivo: { label: "Inactivo", color: "#8aa0c0" },
};

export const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

export const ACCOUNT_TYPE_LABELS: Record<Exclude<AccountType, "">, string> = {
  ahorro: "Ahorro",
  corriente: "Corriente",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  cheque: "Cheque",
  pago_movil: "Pago móvil",
  zelle: "Zelle",
  otro: "Otro",
};

export const CURRENCIES = ["USD", "EUR", "MXN", "PEN", "COP", "ARS", "CLP"];

export const REMINDER_DAYS_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Sin recordatorio", value: null },
  { label: "El mismo día", value: 0 },
  { label: "1 día antes", value: 1 },
  { label: "2 días antes", value: 2 },
  { label: "3 días antes", value: 3 },
  { label: "1 semana antes", value: 7 },
];

const AVATAR_COLORS = [
  "#6aa8ff",
  "#4fe3c1",
  "#f5b642",
  "#b794f6",
  "#ff8f6f",
  "#7ed957",
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

export function tenureLabel(hireDate?: string): string {
  if (!hireDate) return "—";
  const start = new Date(`${hireDate}T00:00:00`);
  const total = differenceInMonths(new Date(), start);
  if (total < 0) return "—";
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  return parts.join(", ");
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** Próxima fecha de pago según la frecuencia. */
export function nextPayday(m: StaffMember): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (m.payFrequency === "semanal") {
    const weekday = m.hireDate ? new Date(`${m.hireDate}T00:00:00`).getDay() : 5;
    const d = new Date(now);
    let diff = (weekday - d.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // Días ancla del mes según frecuencia
  const anchors =
    m.payFrequency === "quincenal"
      ? [15, 30]
      : [m.payDay && m.payDay >= 1 ? m.payDay : 30];

  // Buscar el primer día ancla futuro en este o el próximo mes
  for (let offset = 0; offset < 2; offset++) {
    const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const y = base.getFullYear();
    const mo = base.getMonth();
    const candidates = anchors
      .map((a) => Math.min(a, daysInMonth(y, mo)))
      .sort((a, b) => a - b)
      .map((day) => new Date(y, mo, day));
    for (const c of candidates) {
      if (c.getTime() >= now.getTime()) return c;
    }
  }
  return null;
}

/** Clave del periodo actual (para saber si ya se pagó). */
export function currentPeriodKey(
  freq: PayFrequency,
  date = new Date(),
): string {
  const y = date.getFullYear();
  if (freq === "semanal") {
    return `${getISOWeekYear(date)}-W${pad(getISOWeek(date))}`;
  }
  if (freq === "quincenal") {
    return `${y}-${pad(date.getMonth() + 1)}-${date.getDate() <= 15 ? "Q1" : "Q2"}`;
  }
  return `${y}-${pad(date.getMonth() + 1)}`;
}

export function isPaidThisPeriod(m: StaffMember): boolean {
  const key = currentPeriodKey(m.payFrequency);
  return m.payments.some((p) => p.period === key);
}

/** Texto formateado listo para pegar en la app del banco. */
export function buildPaymentCopyText(m: StaffMember): string {
  const lines = [
    `${m.name}${m.role ? ` — ${m.role}` : ""}`,
    m.bank ? `Banco: ${m.bank}` : null,
    m.accountNumber
      ? `Cuenta: ${m.accountNumber}${
          m.accountType ? ` (${ACCOUNT_TYPE_LABELS[m.accountType]})` : ""
        }`
      : null,
    m.accountHolder
      ? `Titular: ${m.accountHolder}${m.holderId ? ` (${m.holderId})` : ""}`
      : null,
    `Monto: ${formatMoney(m.salary, m.currency)}`,
    `Método: ${PAYMENT_METHOD_LABELS[m.paymentMethod]}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Suma de sueldos mensualizados de los activos. */
export function monthlyPayroll(members: StaffMember[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const m of members) {
    if (m.status === "inactivo") continue;
    const factor =
      m.payFrequency === "semanal" ? 4 : m.payFrequency === "quincenal" ? 2 : 1;
    totals[m.currency] = (totals[m.currency] ?? 0) + m.salary * factor;
  }
  return totals;
}

const csvCell = (v: string | number | undefined) =>
  `"${String(v ?? "").replace(/"/g, '""')}"`;

export function buildStaffCSV(members: StaffMember[]): string {
  const headers = [
    "Nombre",
    "Rol",
    "Departamento",
    "Estado",
    "Sueldo",
    "Moneda",
    "Frecuencia",
    "Día de pago",
    "Fecha inicio",
    "Banco",
    "Cuenta",
    "Tipo cuenta",
    "Titular",
    "Doc. titular",
    "Método",
    "Documento",
    "Teléfono",
    "Email",
  ];
  const rows = members.map((m) =>
    [
      m.name,
      m.role,
      m.department,
      STATUS_META[m.status].label,
      m.salary,
      m.currency,
      FREQUENCY_LABELS[m.payFrequency],
      m.payDay,
      m.hireDate,
      m.bank,
      m.accountNumber,
      m.accountType ? ACCOUNT_TYPE_LABELS[m.accountType] : "",
      m.accountHolder,
      m.holderId,
      PAYMENT_METHOD_LABELS[m.paymentMethod],
      m.idNumber,
      m.phone,
      m.email,
    ]
      .map(csvCell)
      .join(","),
  );
  return [headers.map(csvCell).join(","), ...rows].join("\r\n");
}
