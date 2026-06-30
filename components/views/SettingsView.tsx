"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Download,
  Trash2,
  Smartphone,
  ShieldCheck,
  Github,
} from "lucide-react";
import {
  notificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  notificationsSupported,
} from "@/lib/notifications";
import { canInstall, promptInstall, isStandalone, onInstallChange } from "@/lib/pwa";
import { exportData, clearAll } from "@/lib/db";
import { useStore } from "@/lib/store";
import { APP_NAME } from "@/lib/constants";

export default function SettingsView() {
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [installable, setInstallable] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setPerm(notificationPermission());
    setStandalone(isStandalone());
    setInstallable(canInstall());
    return onInstallChange(() => setInstallable(canInstall()));
  }, []);

  async function enableNotifications() {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === "granted") await sendTestNotification();
  }

  async function handleExport() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `command-center-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleClear() {
    if (!confirm("¿Borrar todos los eventos y notas? Esta acción no se puede deshacer.")) {
      return;
    }
    await clearAll();
    location.reload();
  }

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-semibold">Ajustes</h1>
        <p className="text-sm text-slate-400">Configura tu Command Center.</p>
      </header>

      <Group title="Notificaciones">
        <Row
          icon={<Bell size={18} className="text-gold" />}
          title="Recordatorios"
          subtitle={
            !notificationsSupported()
              ? "No soportado en este navegador"
              : perm === "granted"
                ? "Activados · te avisaremos a tiempo"
                : perm === "denied"
                  ? "Bloqueados en el navegador"
                  : "Recibe avisos de tus eventos"
          }
        >
          {perm !== "granted" && notificationsSupported() && (
            <ActionBtn onClick={enableNotifications}>Activar</ActionBtn>
          )}
          {perm === "granted" && (
            <button
              onClick={() => sendTestNotification()}
              className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold transition active:scale-90"
            >
              <BellRing size={16} />
            </button>
          )}
        </Row>
      </Group>

      <Group title="Aplicación">
        <Row
          icon={<Smartphone size={18} className="text-azure" />}
          title="Instalar app"
          subtitle={
            standalone
              ? "Ya está instalada 🎉"
              : installable
                ? "Añádela a tu pantalla de inicio"
                : "Usa el menú del navegador → «Instalar»"
          }
        >
          {!standalone && installable && (
            <ActionBtn onClick={() => promptInstall()}>Instalar</ActionBtn>
          )}
        </Row>
      </Group>

      <Group title="Datos">
        <Row
          icon={<ShieldCheck size={18} className="text-mint" />}
          title="Privacidad"
          subtitle="Todo se guarda solo en este dispositivo"
        />
        <Row
          icon={<Download size={18} className="text-slate-300" />}
          title="Exportar datos"
          subtitle="Descarga un respaldo en JSON"
        >
          <ActionBtn onClick={handleExport}>Exportar</ActionBtn>
        </Row>
        <Row
          icon={<Trash2 size={18} className="text-coral" />}
          title="Borrar todo"
          subtitle="Elimina eventos y notas"
        >
          <button
            onClick={handleClear}
            className="rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-sm font-semibold text-coral transition active:scale-95"
          >
            Borrar
          </button>
        </Row>
      </Group>

      <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-slate-600">
        <Github size={13} /> {APP_NAME} · PWA · v0.1
      </p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </h2>
      <div className="glass divide-y divide-white/5 overflow-hidden">{children}</div>
    </section>
  );
}

function Row({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-100">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ActionBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-4 py-1.5 text-sm font-semibold text-ink-950 transition active:scale-95"
    >
      {children}
    </button>
  );
}
