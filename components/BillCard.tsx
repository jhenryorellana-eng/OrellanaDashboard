"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  Pencil,
  ChevronDown,
  Bell,
  Zap,
  Undo2,
  BadgeCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { Bill } from "@/lib/types";
import {
  BILL_CATEGORY_META,
  BILL_FREQUENCY_LABELS,
  formatMoney,
  dueStatus,
  formatDueDate,
} from "@/lib/bills";
import { cn } from "@/lib/utils";
import BillIcon from "./BillIcon";

export default function BillCard({ bill }: { bill: Bill }) {
  const openBillEditor = useStore((s) => s.openBillEditor);
  const markBillPaid = useStore((s) => s.markBillPaid);
  const undoBillPayment = useStore((s) => s.undoBillPayment);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = BILL_CATEGORY_META[bill.category];
  const status = dueStatus(bill);
  const isPaid = status.state === "pagado";

  async function copyRef() {
    if (!bill.reference) return;
    try {
      await navigator.clipboard.writeText(bill.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        "glass-soft overflow-hidden",
        status.state === "vencido" && "ring-1 ring-coral/40",
      )}
    >
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: `${meta.color}1f` }}
        >
          <BillIcon category={bill.category} size={20} />
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-100">{bill.name}</h3>
            {bill.autopay && <Zap size={13} className="shrink-0 text-mint" />}
            {bill.reminderDaysBefore != null && (
              <Bell size={12} className="shrink-0 text-gold/70" />
            )}
          </div>
          <p className="truncate text-xs text-slate-400">
            {bill.issuer || meta.label}
            {bill.reference ? ` · ${bill.reference}` : ""}
          </p>
        </button>
        <div className="text-right">
          <p className="tnum font-display text-lg font-semibold leading-none">
            {formatMoney(bill.amount, bill.currency)}
          </p>
          <p className="text-[11px] text-slate-500">
            {BILL_FREQUENCY_LABELS[bill.frequency]}
          </p>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-slate-500 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </div>

      <div className="flex items-center gap-2 px-3.5 pb-3">
        <span
          className="pill"
          style={{ background: `${status.color}1f`, color: status.color }}
        >
          {status.label}
        </span>
        {!isPaid && (
          <button
            onClick={() => markBillPaid(bill.id)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-3 py-1.5 text-xs font-bold text-ink-950 transition active:scale-95"
          >
            <BadgeCheck size={14} /> Marcar pagado
          </button>
        )}
        {isPaid && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-mint">
            <Check size={14} /> Pagado
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t border-white/5 px-3.5 py-3 text-sm">
              <Row label="Vencimiento" value={formatDueDate(bill.nextDueDate)} />
              <Row label="Frecuencia" value={BILL_FREQUENCY_LABELS[bill.frequency]} />
              <Row label="Banco / empresa" value={bill.issuer} />
              {bill.reference && (
                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-xs text-slate-500">Referencia</span>
                  <span className="min-w-0 flex-1 truncate text-slate-100">
                    {bill.reference}
                  </span>
                  <button
                    onClick={copyRef}
                    className="shrink-0 text-slate-400 transition hover:text-gold active:scale-90"
                    aria-label="Copiar referencia"
                  >
                    {copied ? <Check size={15} className="text-mint" /> : <Copy size={15} />}
                  </button>
                </div>
              )}
              {bill.autopay && (
                <p className="inline-flex items-center gap-1.5 text-xs text-mint">
                  <Zap size={13} /> Pago automático activado
                </p>
              )}
              {bill.notes && (
                <p className="rounded-xl bg-white/[0.03] p-2.5 text-xs text-slate-300">
                  {bill.notes}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                {bill.payments.length > 0 && (
                  <button
                    onClick={() => undoBillPayment(bill.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition active:scale-95"
                  >
                    <Undo2 size={14} /> Deshacer pago
                  </button>
                )}
                <button
                  onClick={() => openBillEditor(bill)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition active:scale-95"
                >
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 truncate text-slate-100">{value}</span>
    </div>
  );
}
