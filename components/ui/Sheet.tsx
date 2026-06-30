"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="glass relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-b-none rounded-t-4xl px-5 pb-8 pt-3 no-scrollbar sm:rounded-4xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="sticky top-0 z-10 -mx-5 mb-2 flex items-center justify-between bg-gradient-to-b from-ink-900/80 to-transparent px-5 pb-3 pt-2 backdrop-blur">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
            </div>
            <div className="flex items-center justify-between">
              {title && (
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
