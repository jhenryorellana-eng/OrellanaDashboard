"use client";

import { useEffect, useState } from "react";
import { Trash2, Check, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import type { BillCategory, BillFrequency } from "@/lib/types";
import {
  BILL_CATEGORY_ORDER,
  BILL_CATEGORY_META,
  BILL_FREQUENCY_LABELS,
  CURRENCIES,
  REMINDER_DAYS_OPTIONS,
} from "@/lib/bills";
import { cn, dateKey } from "@/lib/utils";
import Sheet from "./ui/Sheet";
import BillIcon from "./BillIcon";

interface FormState {
  name: string;
  category: BillCategory;
  amount: string;
  currency: string;
  frequency: BillFrequency;
  nextDueDate: string;
  issuer: string;
  reference: string;
  autopay: boolean;
  reminderDaysBefore: number | null;
  notes: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    category: "tarjeta",
    amount: "",
    currency: "USD",
    frequency: "mensual",
    nextDueDate: dateKey(new Date()),
    issuer: "",
    reference: "",
    autopay: false,
    reminderDaysBefore: 3,
    notes: "",
  };
}

export default function BillEditor() {
  const open = useStore((s) => s.billEditorOpen);
  const editing = useStore((s) => s.editingBill);
  const close = useStore((s) => s.closeBillEditor);
  const saveBill = useStore((s) => s.saveBill);
  const removeBill = useStore((s) => s.removeBill);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            name: editing.name,
            category: editing.category,
            amount: String(editing.amount || ""),
            currency: editing.currency,
            frequency: editing.frequency,
            nextDueDate: editing.nextDueDate,
            issuer: editing.issuer ?? "",
            reference: editing.reference ?? "",
            autopay: editing.autopay,
            reminderDaysBefore: editing.reminderDaysBefore,
            notes: editing.notes ?? "",
          }
        : emptyForm(),
    );
  }, [open, editing]);

  function up<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.nextDueDate) return;
    await saveBill({
      id: editing?.id,
      name: form.name.trim(),
      category: form.category,
      amount: Number(form.amount) || 0,
      currency: form.currency,
      frequency: form.frequency,
      nextDueDate: form.nextDueDate,
      issuer: form.issuer.trim() || undefined,
      reference: form.reference.trim() || undefined,
      autopay: form.autopay,
      reminderDaysBefore: form.reminderDaysBefore,
      notes: form.notes.trim() || undefined,
    });
  }

  const dueLabel = form.frequency === "unico" ? "Fecha de pago" : "Próximo vencimiento";

  return (
    <Sheet open={open} onClose={close} title={editing ? "Editar pago" : "Nuevo pago"}>
      <div className="space-y-5">
        <input
          autoFocus
          value={form.name}
          onChange={(e) => up("name", e.target.value)}
          placeholder="Tarjeta Visa, Netflix, Luz…"
          className="w-full border-b border-white/10 bg-transparent pb-2 font-display text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:border-gold/50"
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tipo de pago
          </p>
          <div className="flex flex-wrap gap-2">
            {BILL_CATEGORY_ORDER.map((cat) => {
              const meta = BILL_CATEGORY_META[cat];
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => up("category", cat)}
                  className={cn(
                    "pill border transition",
                    active ? "border-transparent" : "border-white/10 text-slate-300",
                  )}
                  style={
                    active
                      ? { background: `${meta.color}26`, color: meta.color, borderColor: `${meta.color}55` }
                      : undefined
                  }
                >
                  <BillIcon category={cat} size={14} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto">
            <input inputMode="decimal" value={form.amount} onChange={(e) => up("amount", e.target.value)} placeholder="0.00" className="input-base tnum" />
          </Field>
          <Field label="Moneda">
            <select value={form.currency} onChange={(e) => up("currency", e.target.value)} className="input-base appearance-none">
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-ink-800">{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Frecuencia">
            <select value={form.frequency} onChange={(e) => up("frequency", e.target.value as BillFrequency)} className="input-base appearance-none">
              {(Object.keys(BILL_FREQUENCY_LABELS) as BillFrequency[]).map((f) => (
                <option key={f} value={f} className="bg-ink-800">{BILL_FREQUENCY_LABELS[f]}</option>
              ))}
            </select>
          </Field>
          <Field label={dueLabel}>
            <input type="date" value={form.nextDueDate} onChange={(e) => up("nextDueDate", e.target.value)} className="input-base" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Banco / empresa">
            <input value={form.issuer} onChange={(e) => up("issuer", e.target.value)} placeholder="BCP, Netflix…" className="input-base" />
          </Field>
          <Field label="Referencia">
            <input value={form.reference} onChange={(e) => up("reference", e.target.value)} placeholder="**** 1234, contrato…" className="input-base" />
          </Field>
        </div>

        <button
          onClick={() => up("autopay", !form.autopay)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition",
            form.autopay ? "border-mint/40 bg-mint/10" : "border-white/10 bg-white/[0.03]",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Zap size={16} className={form.autopay ? "text-mint" : "text-slate-400"} />
            Pago automático (domiciliado)
          </span>
          <span
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              form.autopay ? "bg-mint" : "bg-white/15",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                form.autopay ? "left-[22px]" : "left-0.5",
              )}
            />
          </span>
        </button>

        <Field label="Recordatorio">
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
          <textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} placeholder="Detalles, monto variable…" className="input-base h-20 resize-none" />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          {editing && (
            <button
              onClick={() => removeBill(editing.id)}
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
            {editing ? "Guardar cambios" : "Agregar pago"}
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
