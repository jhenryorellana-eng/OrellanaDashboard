export type EventCategory =
  | "meeting"
  | "deadline"
  | "travel"
  | "finance"
  | "personal"
  | "other";

export type Priority = "low" | "medium" | "high";

export type TabKey = "today" | "calendar" | "notes" | "staff" | "settings";

export type StaffStatus = "activo" | "vacaciones" | "inactivo";
export type PayFrequency = "mensual" | "quincenal" | "semanal";
export type AccountType = "ahorro" | "corriente" | "";
export type PaymentMethod =
  | "transferencia"
  | "efectivo"
  | "cheque"
  | "pago_movil"
  | "zelle"
  | "otro";

/** Un pago registrado a un miembro del equipo (historial). */
export interface StaffPayment {
  id: string;
  /** Fecha en que se marcó pagado yyyy-MM-dd */
  date: string;
  amount: number;
  /** Periodo que cubre (yyyy-MM, yyyy-MM-Q1/Q2 o yyyy-Www) */
  period: string;
  note?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  status: StaffStatus;
  salary: number;
  currency: string;
  payFrequency: PayFrequency;
  /** Día de pago del mes (1-31), ancla para calcular el próximo pago */
  payDay: number;
  /** Fecha de inicio yyyy-MM-dd, para calcular antigüedad */
  hireDate?: string;
  bank?: string;
  accountNumber?: string;
  accountType?: AccountType;
  /** Titular de la cuenta (a veces distinto al empleado) */
  accountHolder?: string;
  /** Documento del titular de la cuenta */
  holderId?: string;
  paymentMethod: PaymentMethod;
  /** Documento de identidad del empleado */
  idNumber?: string;
  phone?: string;
  email?: string;
  /** Recordatorio: días antes del pago. null = sin recordatorio */
  reminderDaysBefore: number | null;
  notes?: string;
  /** Historial de pagos */
  payments: StaffPayment[];
  createdAt: number;
}

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
  /** Detalle específico según la categoría (con quién, destino, monto…) */
  categoryDetail?: string;
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
