"use client";

import { useEffect, useState } from "react";
import { Trash2, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import type {
  StaffStatus,
  PayFrequency,
  AccountType,
  PaymentMethod,
} from "@/lib/types";
import {
  STATUS_META,
  FREQUENCY_LABELS,
  ACCOUNT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  CURRENCIES,
  REMINDER_DAYS_OPTIONS,
} from "@/lib/staff";
import { cn } from "@/lib/utils";
import Sheet from "./ui/Sheet";

interface FormState {
  name: string;
  role: string;
  department: string;
  status: StaffStatus;
  salary: string;
  currency: string;
  payFrequency: PayFrequency;
  payDay: string;
  hireDate: string;
  bank: string;
  accountNumber: string;
  accountType: AccountType;
  accountHolder: string;
  holderId: string;
  paymentMethod: PaymentMethod;
  idNumber: string;
  phone: string;
  email: string;
  reminderDaysBefore: number | null;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  role: "",
  department: "",
  status: "activo",
  salary: "",
  currency: "USD",
  payFrequency: "mensual",
  payDay: "30",
  hireDate: "",
  bank: "",
  accountNumber: "",
  accountType: "",
  accountHolder: "",
  holderId: "",
  paymentMethod: "transferencia",
  idNumber: "",
  phone: "",
  email: "",
  reminderDaysBefore: 2,
  notes: "",
};

export default function StaffEditor() {
  const open = useStore((s) => s.staffEditorOpen);
  const editing = useStore((s) => s.editingStaff);
  const close = useStore((s) => s.closeStaffEditor);
  const saveStaff = useStore((s) => s.saveStaff);
  const removeStaff = useStore((s) => s.removeStaff);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            role: editing.role,
            department: editing.department ?? "",
            status: editing.status,
            salary: String(editing.salary || ""),
            currency: editing.currency,
            payFrequency: editing.payFrequency,
            payDay: String(editing.payDay || ""),
            hireDate: editing.hireDate ?? "",
            bank: editing.bank ?? "",
            accountNumber: editing.accountNumber ?? "",
            accountType: editing.accountType ?? "",
            accountHolder: editing.accountHolder ?? "",
            holderId: editing.holderId ?? "",
            paymentMethod: editing.paymentMethod,
            idNumber: editing.idNumber ?? "",
            phone: editing.phone ?? "",
            email: editing.email ?? "",
            reminderDaysBefore: editing.reminderDaysBefore,
            notes: editing.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, editing]);

  function up<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    await saveStaff({
      id: editing?.id,
      name: form.name.trim(),
      role: form.role.trim(),
      department: form.department.trim() || undefined,
      status: form.status,
      salary: Number(form.salary) || 0,
      currency: form.currency,
      payFrequency: form.payFrequency,
      payDay: Number(form.payDay) || 30,
      hireDate: form.hireDate || undefined,
      bank: form.bank.trim() || undefined,
      accountNumber: form.accountNumber.trim() || undefined,
      accountType: form.accountType,
      accountHolder: form.accountHolder.trim() || undefined,
      holderId: form.holderId.trim() || undefined,
      paymentMethod: form.paymentMethod,
      idNumber: form.idNumber.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      reminderDaysBefore: form.reminderDaysBefore,
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <Sheet open={open} onClose={close} title={editing ? "Editar persona" : "Nueva persona"}>
      <div className="space-y-5">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => up("name", e.target.value)}
          placeholder="Nombre completo"
          className="w-full border-b border-white/10 bg-transparent pb-2 font-display text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:border-gold/50"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rol / Posición">
            <input value={form.role} onChange={(e) => up("role", e.target.value)} placeholder="Gerente, asistente…" className="input-base" />
          </Field>
          <Field label="Departamento">
            <input value={form.department} onChange={(e) => up("department", e.target.value)} placeholder="Operaciones…" className="input-base" />
          </Field>
        </div>

        <Group label="Estado">
          {(Object.keys(STATUS_META) as StaffStatus[]).map((s) => {
            const meta = STATUS_META[s];
            const active = form.status === s;
            return (
              <Chip key={s} active={active} color={meta.color} onClick={() => up("status", s)}>
                {meta.label}
              </Chip>
            );
          })}
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sueldo">
            <input inputMode="decimal" value={form.salary} onChange={(e) => up("salary", e.target.value)} placeholder="1500" className="input-base tnum" />
          </Field>
          <Field label="Moneda">
            <select value={form.currency} onChange={(e) => up("currency", e.target.value)} className="input-base appearance-none">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-ink-800">{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Group label="Frecuencia de pago">
          {(Object.keys(FREQUENCY_LABELS) as PayFrequency[]).map((f) => (
            <Chip key={f} active={form.payFrequency === f} color="#f5b642" onClick={() => up("payFrequency", f)}>
              {FREQUENCY_LABELS[f]}
            </Chip>
          ))}
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Día de pago (del mes)">
            <input inputMode="numeric" value={form.payDay} onChange={(e) => up("payDay", e.target.value)} placeholder="30" className="input-base tnum" />
          </Field>
          <Field label="Fecha de inicio">
            <input type="date" value={form.hireDate} onChange={(e) => up("hireDate", e.target.value)} className="input-base" />
          </Field>
        </div>

        <p className="-mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Datos bancarios</p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Banco">
            <input value={form.bank} onChange={(e) => up("bank", e.target.value)} placeholder="BBVA…" className="input-base" />
          </Field>
          <Field label="Tipo de cuenta">
            <select value={form.accountType} onChange={(e) => up("accountType", e.target.value as AccountType)} className="input-base appearance-none">
              <option value="" className="bg-ink-800">—</option>
              <option value="ahorro" className="bg-ink-800">{ACCOUNT_TYPE_LABELS.ahorro}</option>
              <option value="corriente" className="bg-ink-800">{ACCOUNT_TYPE_LABELS.corriente}</option>
            </select>
          </Field>
        </div>

        <Field label="Número de cuenta">
          <input value={form.accountNumber} onChange={(e) => up("accountNumber", e.target.value)} placeholder="0011-2222-3333" className="input-base tnum" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Titular de la cuenta">
            <input value={form.accountHolder} onChange={(e) => up("accountHolder", e.target.value)} placeholder="Igual al empleado" className="input-base" />
          </Field>
          <Field label="Doc. del titular">
            <input value={form.holderId} onChange={(e) => up("holderId", e.target.value)} placeholder="DNI / RUC" className="input-base" />
          </Field>
        </div>

        <Field label="Estilo de pago">
          <select value={form.paymentMethod} onChange={(e) => up("paymentMethod", e.target.value as PaymentMethod)} className="input-base appearance-none">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m} className="bg-ink-800">{PAYMENT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </Field>

        <p className="-mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Contacto</p>

        <Field label="Documento del empleado">
          <input value={form.idNumber} onChange={(e) => up("idNumber", e.target.value)} placeholder="Cédula / DNI / RUC" className="input-base" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <input type="tel" value={form.phone} onChange={(e) => up("phone", e.target.value)} placeholder="+51…" className="input-base" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} placeholder="correo@…" className="input-base" />
          </Field>
        </div>

        <Field label="Recordatorio de pago">
          <select
            value={String(form.reminderDaysBefore)}
            onChange={(e) => up("reminderDaysBefore", e.target.value === "null" ? null : Number(e.target.value))}
            className="input-base appearance-none"
          >
            {REMINDER_DAYS_OPTIONS.map((o) => (
              <option key={String(o.value)} value={String(o.value)} className="bg-ink-800">{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Notas">
          <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} placeholder="Bonos, acuerdos…" className="input-base h-20 resize-none" />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          {editing && (
            <button
              onClick={() => removeStaff(editing.id)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-coral/30 bg-coral/10 text-coral transition active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Check size={18} />
            {editing ? "Guardar cambios" : "Agregar persona"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
        active ? "border-transparent" : "border-white/10 text-slate-300",
      )}
      style={active ? { background: `${color}22`, color } : undefined}
    >
      {children}
    </button>
  );
}
