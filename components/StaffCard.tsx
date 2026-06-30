"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Pencil,
  ChevronDown,
  Phone,
  Mail,
  MessageCircle,
  CalendarClock,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type { StaffMember } from "@/lib/types";
import {
  STATUS_META,
  FREQUENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  ACCOUNT_TYPE_LABELS,
  formatMoney,
  tenureLabel,
  nextPayday,
  isPaidThisPeriod,
  buildPaymentCopyText,
  initials,
  avatarColor,
} from "@/lib/staff";
import { cn, relativeDayLabel, dateKey } from "@/lib/utils";

export default function StaffCard({ member }: { member: StaffMember }) {
  const openStaffEditor = useStore((s) => s.openStaffEditor);
  const toggleStaffPaid = useStore((s) => s.toggleStaffPaid);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const status = STATUS_META[member.status];
  const paid = isPaidThisPeriod(member);
  const next = nextPayday(member);
  const color = avatarColor(member.name);

  async function copy(field: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null); // clipboard no disponible
    }
  }

  const waLink = member.phone
    ? `https://wa.me/${member.phone.replace(/[^\d]/g, "")}`
    : null;

  return (
    <motion.div layout className="glass-soft overflow-hidden">
      {/* Cabecera */}
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold"
          style={{ background: `${color}22`, color }}
        >
          {initials(member.name)}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-100">{member.name}</h3>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: status.color }}
              title={status.label}
            />
          </div>
          <p className="truncate text-xs text-slate-400">
            {member.role || "—"}
            {member.department ? ` · ${member.department}` : ""}
          </p>
        </button>
        <div className="text-right">
          <p className="tnum font-display text-lg font-semibold leading-none">
            {formatMoney(member.salary, member.currency)}
          </p>
          <p className="text-[11px] text-slate-500">
            {FREQUENCY_LABELS[member.payFrequency]}
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

      {/* Estado de pago + acción rápida */}
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <button
          onClick={() => toggleStaffPaid(member.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
            paid
              ? "bg-mint/15 text-mint"
              : "border border-white/10 text-slate-300",
          )}
        >
          <BadgeCheck size={14} />
          {paid ? "Pagado" : "Marcar pagado"}
        </button>
        {next && !paid && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <CalendarClock size={13} />
            Paga {relativeDayLabel(dateKey(next))}
          </span>
        )}
        <button
          onClick={() => copy("full", buildPaymentCopyText(member))}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-3 py-1.5 text-xs font-bold text-ink-950 transition active:scale-95"
        >
          {copied === "full" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "full" ? "Copiado" : "Copiar pago"}
        </button>
      </div>

      {/* Detalle expandible */}
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
              <Row label="Banco" value={member.bank} />
              <Row
                label="Cuenta"
                value={
                  member.accountNumber
                    ? `${member.accountNumber}${
                        member.accountType
                          ? ` · ${ACCOUNT_TYPE_LABELS[member.accountType]}`
                          : ""
                      }`
                    : undefined
                }
                copyText={member.accountNumber}
                copyKey="acc"
                copied={copied}
                onCopy={copy}
              />
              <Row label="Titular" value={member.accountHolder || member.name} />
              <Row label="Doc. titular" value={member.holderId} />
              <Row
                label="Monto"
                value={formatMoney(member.salary, member.currency)}
                copyText={String(member.salary)}
                copyKey="amount"
                copied={copied}
                onCopy={copy}
              />
              <Row label="Estilo de pago" value={PAYMENT_METHOD_LABELS[member.paymentMethod]} />
              <Row
                label="Día de pago"
                value={`Día ${member.payDay} · ${FREQUENCY_LABELS[member.payFrequency]}`}
              />
              <Row
                label="Antigüedad"
                value={
                  member.hireDate
                    ? tenureLabel(member.hireDate)
                    : undefined
                }
              />
              <Row label="Documento" value={member.idNumber} />
              {member.notes && (
                <p className="rounded-xl bg-white/[0.03] p-2.5 text-xs text-slate-300">
                  {member.notes}
                </p>
              )}

              {member.payments.length > 0 && (
                <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={13} />
                  {member.payments.length}{" "}
                  {member.payments.length === 1 ? "pago registrado" : "pagos registrados"}
                  {" · último "}
                  {relativeDayLabel(
                    member.payments[member.payments.length - 1].date,
                  )}
                </p>
              )}

              {/* Contacto + editar */}
              <div className="flex items-center gap-2 pt-1">
                {waLink && (
                  <IconLink href={waLink} label="WhatsApp">
                    <MessageCircle size={16} />
                  </IconLink>
                )}
                {member.phone && (
                  <IconLink href={`tel:${member.phone}`} label="Llamar">
                    <Phone size={16} />
                  </IconLink>
                )}
                {member.email && (
                  <IconLink href={`mailto:${member.email}`} label="Email">
                    <Mail size={16} />
                  </IconLink>
                )}
                <button
                  onClick={() => openStaffEditor(member)}
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

function Row({
  label,
  value,
  copyText,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value?: string;
  copyText?: string;
  copyKey?: string;
  copied?: string | null;
  onCopy?: (field: string, text: string) => void;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 truncate text-slate-100">{value}</span>
      {copyText && copyKey && onCopy && (
        <button
          onClick={() => onCopy(copyKey, copyText)}
          className="shrink-0 text-slate-400 transition hover:text-gold active:scale-90"
          aria-label={`Copiar ${label}`}
        >
          {copied === copyKey ? (
            <Check size={15} className="text-mint" />
          ) : (
            <Copy size={15} />
          )}
        </button>
      )}
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:text-gold active:scale-90"
    >
      {children}
    </a>
  );
}
