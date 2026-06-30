"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Settings, AlertTriangle, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  monthlyTotals,
  formatMoney,
  dueSoonCount,
  daysUntil,
} from "@/lib/bills";
import BillCard from "../BillCard";

export default function PaymentsView() {
  const bills = useStore((s) => s.bills);
  const setTab = useStore((s) => s.setTab);
  const openBillEditor = useStore((s) => s.openBillEditor);
  const [query, setQuery] = useState("");

  const totals = useMemo(() => monthlyTotals(bills), [bills]);
  const dueSoon = useMemo(() => dueSoonCount(bills, 7), [bills]);
  const overdue = useMemo(
    () =>
      bills.filter(
        (b) =>
          !(b.frequency === "unico" && b.payments.length > 0) &&
          daysUntil(b.nextDueDate) < 0,
      ).length,
    [bills],
  );

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? bills.filter((b) =>
          [b.name, b.issuer, b.reference].some((f) =>
            (f ?? "").toLowerCase().includes(q),
          ),
        )
      : bills;
    const paidUnico = (b: (typeof bills)[number]) =>
      b.frequency === "unico" && b.payments.length > 0 ? 1 : 0;
    return [...list].sort(
      (a, b) =>
        paidUnico(a) - paidUnico(b) ||
        daysUntil(a.nextDueDate) - daysUntil(b.nextDueDate),
    );
  }, [bills, query]);

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pagos</h1>
          <p className="text-sm text-slate-400">Tarjetas, servicios y vencimientos.</p>
        </div>
        <button
          onClick={() => setTab("settings")}
          aria-label="Ajustes"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
        >
          <Settings size={18} />
        </button>
      </header>

      <section className="glass relative overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
        <p className="text-xs uppercase tracking-widest text-gold/80">
          Gasto mensual estimado
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
          {Object.keys(totals).length === 0 ? (
            <span className="font-display text-3xl font-semibold text-slate-500">—</span>
          ) : (
            Object.entries(totals).map(([cur, total]) => (
              <span key={cur} className="tnum font-display text-3xl font-semibold">
                {formatMoney(total, cur)}
              </span>
            ))
          )}
        </div>
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Wallet size={15} className="text-azure" />
            {bills.length} {bills.length === 1 ? "pago" : "pagos"}
          </span>
          {(dueSoon > 0 || overdue > 0) && (
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: overdue > 0 ? "#ff6f6f" : "#f5b642" }}
            >
              <AlertTriangle size={15} />
              {overdue > 0
                ? `${overdue} vencido${overdue > 1 ? "s" : ""}`
                : `${dueSoon} por vencer`}
            </span>
          )}
        </div>
      </section>

      {bills.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarjeta, servicio…"
            className="input-base pl-10"
          />
        </div>
      )}

      <section className="space-y-2.5">
        {bills.length === 0 ? (
          <button
            onClick={() => openBillEditor(null)}
            className="glass-soft flex w-full flex-col items-center gap-2 px-4 py-10 text-center transition active:scale-[0.99]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15">
              <Plus className="text-gold" size={24} />
            </div>
            <p className="font-display text-lg font-semibold">Organiza tus pagos</p>
            <p className="text-sm text-slate-400">
              Agrega tu primera tarjeta o servicio
            </p>
          </button>
        ) : sorted.length === 0 ? (
          <p className="glass-soft px-4 py-8 text-center text-sm text-slate-500">
            Sin resultados para “{query}”.
          </p>
        ) : (
          sorted.map((b) => <BillCard key={b.id} bill={b} />)
        )}
      </section>
    </div>
  );
}
