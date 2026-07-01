"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { initInstallCapture } from "@/lib/pwa";
import { supabase } from "@/lib/supabase";
import { subscribeToPush } from "@/lib/push";
import AuthScreen from "./AuthScreen";
import TodayView from "./views/TodayView";
import CalendarView from "./views/CalendarView";
import NotesView from "./views/NotesView";
import PaymentsView from "./views/PaymentsView";
import StaffView from "./views/StaffView";
import RadarView from "./views/RadarView";
import SettingsView from "./views/SettingsView";
import BottomNav from "./BottomNav";
import EventEditor from "./EventEditor";
import StaffEditor from "./StaffEditor";
import BillEditor from "./BillEditor";
import InstallPrompt from "./InstallPrompt";

const VIEWS = {
  today: TodayView,
  calendar: CalendarView,
  notes: NotesView,
  payments: PaymentsView,
  staff: StaffView,
  radar: RadarView,
  settings: SettingsView,
} as const;

export default function AppShell() {
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const resetData = useStore((s) => s.resetData);
  const activeTab = useStore((s) => s.activeTab);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    initInstallCapture();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* el SW es opcional: la app funciona igual sin él */
      });
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(!!data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      if (!session) resetData();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [resetData]);

  useEffect(() => {
    if (signedIn && !hydrated) hydrate();
  }, [signedIn, hydrated, hydrate]);

  // Si ya se concedió permiso, re-suscribe este dispositivo a Web Push al entrar.
  useEffect(() => {
    if (
      signedIn &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      subscribeToPush();
    }
  }, [signedIn]);

  if (!authReady) return <BootSplash />;
  if (!signedIn) return <AuthScreen />;

  const ActiveView = VIEWS[activeTab];

  return (
    <div className="relative z-10 mx-auto min-h-[100dvh] w-full max-w-md px-4 pb-28 pt-safe">
      {!hydrated ? (
        <BootSplash />
      ) : (
        <>
          <InstallPrompt />
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <ActiveView />
          </motion.main>
        </>
      )}

      <BottomNav />
      <EventEditor />
      <StaffEditor />
      <BillEditor />
    </div>
  );
}

function BootSplash() {
  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-4">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 animate-pulse-ring rounded-3xl bg-azure/30" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt="HiHenry"
          className="h-20 w-20 rounded-3xl shadow-glass"
        />
      </div>
      <p className="font-display text-lg text-slate-400">HiHenry</p>
    </div>
  );
}
