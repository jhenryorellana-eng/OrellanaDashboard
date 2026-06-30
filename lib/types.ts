export type EventCategory =
  | "meeting"
  | "deadline"
  | "travel"
  | "finance"
  | "personal"
  | "other";

export type Priority = "low" | "medium" | "high";

/** Modalidad de una reunión */
export type EventModality = "presencial" | "digital";

export type TabKey =
  | "today"
  | "calendar"
  | "notes"
  | "payments"
  | "staff"
  | "radar"
  | "settings";

export type TechKind = "event" | "news";
export type RsvpStatus = "going" | "maybe" | "skip";

/** Evento o noticia descubierto por el Radar (IA). */
export interface TechItem {
  id: string;
  kind: TechKind;
  title: string;
  summary: string;
  /** Fecha del evento o de publicación yyyy-MM-dd */
  date?: string;
  time?: string;
  location?: string;
  /** Link de inscripción (evento) o del artículo (noticia) */
  url?: string;
  source?: string;
  topics?: string[];
  /** Decisión de asistencia (solo eventos) */
  rsvp?: RsvpStatus | null;
  createdAt: number;
}

export type BillCategory =
  | "tarjeta"
  | "servicio"
  | "suscripcion"
  | "prestamo"
  | "renta"
  | "impuesto"
  | "otro";

export type BillFrequency =
  | "semanal"
  | "mensual"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual"
  | "unico";

/** Un pago registrado de una cuenta/servicio (historial). */
export interface BillPayment {
  id: string;
  /** Fecha en que se marcó pagado yyyy-MM-dd */
  date: string;
  amount: number;
  /** Vencimiento que cubrió este pago yyyy-MM-dd */
  dueDate: string;
}

export interface Bill {
  id: string;
  name: string;
  category: BillCategory;
  amount: number;
  currency: string;
  frequency: BillFrequency;
  /** Próximo vencimiento yyyy-MM-dd */
  nextDueDate: string;
  /** Banco o empresa emisora */
  issuer?: string;
  /** Referencia: últimos 4 dígitos, nº de contrato/servicio… */
  reference?: string;
  /** Pago domiciliado/automático */
  autopay: boolean;
  /** Recordatorio: días antes del vencimiento. null = sin recordatorio */
  reminderDaysBefore: number | null;
  notes?: string;
  payments: BillPayment[];
  createdAt: number;
}

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
  /** Detalle específico según la categoría (tema, destino, monto…) */
  categoryDetail?: string;
  /** Modalidad (solo reuniones): presencial o digital */
  modality?: EventModality;
  priority: Priority;
  /** Minutos antes del evento para el recordatorio. null = sin recordatorio */
  reminderMinutes: number | null;
  createdAt: number;
}

export interface VoiceNote {
  id: string;
  /** Transcripción de la voz a texto */
  text: string;
  /** Ruta del audio en Supabase Storage (bucket voice-notes) */
  audioPath?: string;
  durationSec: number;
  pinned: boolean;
  /** Fecha opcional asociada yyyy-MM-dd */
  linkedDate?: string;
  createdAt: number;
}
