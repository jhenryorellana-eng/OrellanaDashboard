"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Settings,
  Lock,
  ShieldPlus,
  Download,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  monthlyPayroll,
  formatMoney,
  STATUS_META,
  buildStaffCSV,
} from "@/lib/staff";
import { dateKey } from "@/lib/utils";
import StaffCard from "../StaffCard";
import { StaffLock, PinSetupSheet } from "../StaffLock";

export default function StaffView() {
  const staff = useStore((s) => s.staff);
  const setTab = useStore((s) => s.setTab);
  const openStaffEditor = useStore((s) => s.openStaffEditor);
  const staffPinSet = useStore((s) => s.staffPinSet);
  const staffUnlocked = useStore((s) => s.staffUnlocked);
  const removeStaffPin = useStore((s) => s.removeStaffPin);

  const [query, setQuery] = useState("");
  const [pinOpen, setPinOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? staff.filter((m) =>
          [m.name, m.role, m.department].some((f) =>
            (f ?? "").toLowerCase().includes(q),
          ),
        )
      : staff;
    const rank = { activo: 0, vacaciones: 1, inactivo: 2 };
    return [...list].sort(
      (a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name),
    );
  }, [staff, query]);

  const payroll = useMemo(() => monthlyPayroll(staff), [staff]);
  const activeCount = staff.filter((m) => m.status === "activo").length;

  function exportCSV() {
    const blob = new Blob([buildStaffCSV(staff)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomina-${dateKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePin() {
    if (staffPinSet) {
      if (confirm("¿Quitar el PIN de esta sección?")) removeStaffPin();
    } else {
      setPinOpen(true);
    }
  }

  // Bloqueo
  if (staffPinSet && !staffUnlocked) {
    return <StaffLock />;
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Equipo</h1>
          <p className="text-sm text-slate-400">Nómina y datos de pago.</p>
        </div>
        <div className="flex gap-2">
          <HeaderBtn onClick={handlePin} label="PIN">
            {staffPinSet ? (
              <Lock size={18} className="text-gold" />
            ) : (
              <ShieldPlus size={18} />
            )}
          </HeaderBtn>
          <HeaderBtn onClick={() => setTab("settings")} label="Ajustes">
            <Settings size={18} />
          </HeaderBtn>
        </div>
      </header>

      {/* Resumen de nómina */}
      <section className="glass relative overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
        <p className="text-xs uppercase tracking-widest text-gold/80">
          Nómina mensual estimada
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
          {Object.keys(payroll).length === 0 ? (
            <span className="font-display text-3xl font-semibold text-slate-500">
              —
            </span>
          ) : (
            Object.entries(payroll).map(([cur, total]) => (
              <span key={cur} className="tnum font-display text-3xl font-semibold">
                {formatMoney(total, cur)}
              </span>
            ))
          )}
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} className="text-azure" />
            {activeCount} activos · {staff.length} total
          </span>
          {staff.length > 0 && (
            <button
              onClick={exportCSV}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition active:scale-95"
            >
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </section>

      {staff.length > 0 && (
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o rol…"
            className="input-base pl-10"
          />
        </div>
      )}

      <section className="space-y-2.5">
        {staff.length === 0 ? (
          <button
            onClick={() => openStaffEditor(null)}
            className="glass-soft flex w-full flex-col items-center gap-2 px-4 py-10 text-center transition active:scale-[0.99]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15">
              <Plus className="text-gold" size={24} />
            </div>
            <p className="font-display text-lg font-semibold">Registra a tu equipo</p>
            <p className="text-sm text-slate-400">
              Agrega a la primera persona y sus datos de pago
            </p>
          </button>
        ) : filtered.length === 0 ? (
          <p className="glass-soft px-4 py-8 text-center text-sm text-slate-500">
            Sin resultados para “{query}”.
          </p>
        ) : (
          filtered.map((m) => <StaffCard key={m.id} member={m} />)
        )}
      </section>

      {staff.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-slate-600">
          <Lock size={12} /> Datos guardados solo en este dispositivo
        </p>
      )}

      <PinSetupSheet open={pinOpen} onClose={() => setPinOpen(false)} />
    </div>
  );
}

function HeaderBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
    >
      {children}
    </button>
  );
}
