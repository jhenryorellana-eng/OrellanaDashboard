import { supabase } from "./supabase";
import { eventRemindAt, billRemindAt, staffRemindAt } from "./reminders";
import type {
  EventItem,
  VoiceNote,
  StaffMember,
  Bill,
  TechItem,
  StaffPayment,
  BillPayment,
} from "./types";

type Row = Record<string, unknown>;
const s = (v: unknown): string | undefined => (v == null ? undefined : String(v));
const n = (v: unknown): number => Number(v ?? 0);

function fail(message: string): never {
  throw new Error(message);
}

// ---------- Eventos ----------
function rowToEvent(r: Row): EventItem {
  return {
    id: r.id as string,
    title: r.title as string,
    notes: s(r.notes),
    date: r.date as string,
    time: r.time as string,
    endTime: s(r.end_time),
    location: s(r.location),
    category: r.category as EventItem["category"],
    categoryDetail: s(r.category_detail),
    modality: (r.modality as EventItem["modality"]) ?? undefined,
    priority: r.priority as EventItem["priority"],
    reminderMinutes: (r.reminder_minutes as number | null) ?? null,
    createdAt: n(r.created_at),
  };
}
function eventToRow(e: EventItem): Row {
  return {
    id: e.id,
    title: e.title,
    notes: e.notes ?? null,
    date: e.date,
    time: e.time,
    end_time: e.endTime ?? null,
    location: e.location ?? null,
    category: e.category,
    category_detail: e.categoryDetail ?? null,
    modality: e.modality ?? null,
    priority: e.priority,
    reminder_minutes: e.reminderMinutes,
    remind_at: eventRemindAt(e),
    created_at: e.createdAt,
  };
}

export async function getAllEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase.from("events").select("*");
  if (error) fail(error.message);
  return (data ?? []).map(rowToEvent);
}
export async function putEvent(e: EventItem): Promise<void> {
  const { error } = await supabase.from("events").upsert(eventToRow(e));
  if (error) fail(error.message);
}
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) fail(error.message);
}

// ---------- Notas de voz ----------
function rowToNote(r: Row): VoiceNote {
  return {
    id: r.id as string,
    text: (r.text as string) ?? "",
    audioPath: s(r.audio_path),
    durationSec: n(r.duration_sec),
    pinned: Boolean(r.pinned),
    linkedDate: s(r.linked_date),
    createdAt: n(r.created_at),
  };
}
function noteToRow(note: VoiceNote): Row {
  return {
    id: note.id,
    text: note.text ?? "",
    audio_path: note.audioPath ?? null,
    duration_sec: note.durationSec,
    pinned: note.pinned,
    linked_date: note.linkedDate ?? null,
    created_at: note.createdAt,
  };
}

export async function getAllNotes(): Promise<VoiceNote[]> {
  const { data, error } = await supabase.from("voice_notes").select("*");
  if (error) fail(error.message);
  return (data ?? []).map(rowToNote);
}
export async function putNote(note: VoiceNote): Promise<void> {
  const { error } = await supabase.from("voice_notes").upsert(noteToRow(note));
  if (error) fail(error.message);
}
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("voice_notes").delete().eq("id", id);
  if (error) fail(error.message);
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? "";
}

export async function uploadAudio(
  noteId: string,
  blob: Blob,
): Promise<string | undefined> {
  const uid = await currentUserId();
  if (!uid) return undefined;
  const ext = (blob.type.split("/")[1] || "webm").split(";")[0];
  const path = `${uid}/${noteId}.${ext}`;
  const { error } = await supabase.storage
    .from("voice-notes")
    .upload(path, blob, { upsert: true, contentType: blob.type || "audio/webm" });
  if (error) fail(error.message);
  return path;
}
export async function getAudioUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("voice-notes")
    .createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
export async function deleteAudio(path: string): Promise<void> {
  await supabase.storage.from("voice-notes").remove([path]);
}

// ---------- Equipo ----------
function rowToStaff(r: Row): StaffMember {
  return {
    id: r.id as string,
    name: r.name as string,
    role: (r.role as string) ?? "",
    department: s(r.department),
    status: r.status as StaffMember["status"],
    salary: n(r.salary),
    currency: r.currency as string,
    payFrequency: r.pay_frequency as StaffMember["payFrequency"],
    payDay: n(r.pay_day),
    hireDate: s(r.hire_date),
    bank: s(r.bank),
    accountNumber: s(r.account_number),
    accountType: (r.account_type as StaffMember["accountType"]) ?? "",
    accountHolder: s(r.account_holder),
    holderId: s(r.holder_id),
    paymentMethod: r.payment_method as StaffMember["paymentMethod"],
    idNumber: s(r.id_number),
    phone: s(r.phone),
    email: s(r.email),
    reminderDaysBefore: (r.reminder_days_before as number | null) ?? null,
    notes: s(r.notes),
    payments: (r.payments as StaffPayment[]) ?? [],
    createdAt: n(r.created_at),
  };
}
function staffToRow(m: StaffMember): Row {
  return {
    id: m.id,
    name: m.name,
    role: m.role || null,
    department: m.department ?? null,
    status: m.status,
    salary: m.salary,
    currency: m.currency,
    pay_frequency: m.payFrequency,
    pay_day: m.payDay,
    hire_date: m.hireDate ?? null,
    bank: m.bank ?? null,
    account_number: m.accountNumber ?? null,
    account_type: m.accountType || null,
    account_holder: m.accountHolder ?? null,
    holder_id: m.holderId ?? null,
    payment_method: m.paymentMethod,
    id_number: m.idNumber ?? null,
    phone: m.phone ?? null,
    email: m.email ?? null,
    reminder_days_before: m.reminderDaysBefore,
    notes: m.notes ?? null,
    payments: m.payments,
    remind_at: staffRemindAt(m),
    created_at: m.createdAt,
  };
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase.from("staff").select("*");
  if (error) fail(error.message);
  return (data ?? []).map(rowToStaff);
}
export async function putStaff(m: StaffMember): Promise<void> {
  const { error } = await supabase.from("staff").upsert(staffToRow(m));
  if (error) fail(error.message);
}
export async function deleteStaff(id: string): Promise<void> {
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) fail(error.message);
}

// ---------- Pagos ----------
function rowToBill(r: Row): Bill {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Bill["category"],
    amount: n(r.amount),
    currency: r.currency as string,
    frequency: r.frequency as Bill["frequency"],
    nextDueDate: r.next_due_date as string,
    issuer: s(r.issuer),
    reference: s(r.reference),
    autopay: Boolean(r.autopay),
    reminderDaysBefore: (r.reminder_days_before as number | null) ?? null,
    notes: s(r.notes),
    payments: (r.payments as BillPayment[]) ?? [],
    createdAt: n(r.created_at),
  };
}
function billToRow(b: Bill): Row {
  return {
    id: b.id,
    name: b.name,
    category: b.category,
    amount: b.amount,
    currency: b.currency,
    frequency: b.frequency,
    next_due_date: b.nextDueDate,
    issuer: b.issuer ?? null,
    reference: b.reference ?? null,
    autopay: b.autopay,
    reminder_days_before: b.reminderDaysBefore,
    notes: b.notes ?? null,
    payments: b.payments,
    remind_at: billRemindAt(b),
    created_at: b.createdAt,
  };
}

export async function getAllBills(): Promise<Bill[]> {
  const { data, error } = await supabase.from("bills").select("*");
  if (error) fail(error.message);
  return (data ?? []).map(rowToBill);
}
export async function putBill(b: Bill): Promise<void> {
  const { error } = await supabase.from("bills").upsert(billToRow(b));
  if (error) fail(error.message);
}
export async function deleteBill(id: string): Promise<void> {
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) fail(error.message);
}

// ---------- Radar ----------
function rowToTech(r: Row): TechItem {
  return {
    id: r.id as string,
    kind: r.kind as TechItem["kind"],
    title: r.title as string,
    summary: (r.summary as string) ?? "",
    date: s(r.date),
    time: s(r.time),
    location: s(r.location),
    url: s(r.url),
    source: s(r.source),
    topics: (r.topics as string[]) ?? [],
    rsvp: (r.rsvp as TechItem["rsvp"]) ?? null,
    createdAt: n(r.created_at),
  };
}
function techToRow(t: TechItem): Row {
  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    summary: t.summary,
    date: t.date ?? null,
    time: t.time ?? null,
    location: t.location ?? null,
    url: t.url ?? null,
    source: t.source ?? null,
    topics: t.topics ?? [],
    rsvp: t.rsvp ?? null,
    created_at: t.createdAt,
  };
}

export async function getAllTech(): Promise<TechItem[]> {
  const { data, error } = await supabase.from("tech_items").select("*");
  if (error) fail(error.message);
  return (data ?? []).map(rowToTech);
}
export async function putTech(t: TechItem): Promise<void> {
  const { error } = await supabase.from("tech_items").upsert(techToRow(t));
  if (error) fail(error.message);
}
export async function putManyTech(items: TechItem[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await supabase.from("tech_items").upsert(items.map(techToRow));
  if (error) fail(error.message);
}
export async function deleteTech(id: string): Promise<void> {
  const { error } = await supabase.from("tech_items").delete().eq("id", id);
  if (error) fail(error.message);
}

// ---------- Ajustes (clave-valor por usuario) ----------
export async function getMeta<T>(key: string): Promise<T | undefined> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) fail(error.message);
  return (data?.value ?? undefined) as T | undefined;
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: value as string | null }, { onConflict: "user_id,key" });
  if (error) fail(error.message);
}

// ---------- Utilidades ----------
export async function exportData() {
  const [events, notes] = await Promise.all([getAllEvents(), getAllNotes()]);
  return { exportedAt: new Date().toISOString(), events, notes };
}
export async function clearAll(): Promise<void> {
  await supabase.from("events").delete().gte("created_at", 0);
  await supabase.from("voice_notes").delete().gte("created_at", 0);
}
