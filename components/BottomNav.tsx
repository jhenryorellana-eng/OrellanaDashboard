"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, Mic, Settings, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TabKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "today", label: "Hoy", icon: LayoutDashboard },
  { key: "calendar", label: "Agenda", icon: CalendarDays },
  { key: "notes", label: "Notas", icon: Mic },
  { key: "settings", label: "Ajustes", icon: Settings },
];

export default function BottomNav() {
  const activeTab = useStore((s) => s.activeTab);
  const setTab = useStore((s) => s.setTab);
  const openEditor = useStore((s) => s.openEditor);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-safe">
      <div className="pointer-events-auto relative mx-auto mb-3 flex w-[min(94vw,420px)] items-center justify-between gap-1 rounded-full border border-white/10 bg-ink-900/80 px-3 py-2 shadow-glass backdrop-blur-2xl">
        {TABS.slice(0, 2).map((t) => (
          <TabButton key={t.key} tab={t} active={activeTab === t.key} onClick={() => setTab(t.key)} />
        ))}

        <button
          onClick={() => openEditor(null)}
          aria-label="Nuevo evento"
          className="relative -mt-7 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-ink-950 shadow-glow transition active:scale-90"
        >
          <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-gold/40" />
          <Plus size={26} strokeWidth={2.6} />
        </button>

        {TABS.slice(2).map((t) => (
          <TabButton key={t.key} tab={t} active={activeTab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onClick,
}: {
  tab: { key: TabKey; label: string; icon: typeof LayoutDashboard };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 transition",
        active ? "text-gold" : "text-slate-400 hover:text-slate-200",
      )}
    >
      {active && (
        <motion.span
          layoutId="navActive"
          className="absolute inset-0 -z-10 rounded-full bg-white/[0.06]"
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
        />
      )}
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
    </button>
  );
}
