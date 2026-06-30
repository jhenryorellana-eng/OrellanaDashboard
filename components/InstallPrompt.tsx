"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { canInstall, promptInstall, isStandalone, onInstallChange } from "@/lib/pwa";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refresh = () => setShow(canInstall() && !isStandalone());
    refresh();
    return onInstallChange(refresh);
  }, []);

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="glass mb-4 flex items-center gap-3 p-3"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15">
            <Download size={18} className="text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instala Orellana Dashboard</p>
            <p className="text-xs text-slate-400">Acceso directo y notificaciones.</p>
          </div>
          <button
            onClick={() => promptInstall()}
            className="rounded-full bg-gradient-to-br from-gold-300 to-gold-600 px-4 py-1.5 text-sm font-semibold text-ink-950 active:scale-95"
          >
            Instalar
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Descartar"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
