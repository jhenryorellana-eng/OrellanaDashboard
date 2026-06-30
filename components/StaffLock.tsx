"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Delete } from "lucide-react";
import { useStore } from "@/lib/store";
import Sheet from "./ui/Sheet";

const PIN_LENGTH = 4;

function PinPad({
  onSubmit,
  errorSignal = 0,
}: {
  onSubmit: (code: string) => void;
  errorSignal?: number;
}) {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (errorSignal > 0) {
      setCode("");
      setShake(true);
      const t = setTimeout(() => setShake(false), 450);
      return () => clearTimeout(t);
    }
  }, [errorSignal]);

  function press(d: string) {
    if (code.length >= PIN_LENGTH) return;
    const next = code + d;
    setCode(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onSubmit(next);
        setCode("");
      }, 150);
    }
  }

  return (
    <div className="flex flex-col items-center gap-7">
      <motion.div
        animate={shake ? { x: [0, -9, 9, -7, 7, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="flex gap-3.5"
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className="h-3.5 w-3.5 rounded-full border border-white/20 transition-colors"
            style={{ background: i < code.length ? "#f5b642" : "transparent" }}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PadButton key={d} onClick={() => press(d)}>
            {d}
          </PadButton>
        ))}
        <span />
        <PadButton onClick={() => press("0")}>0</PadButton>
        <PadButton onClick={() => setCode((c) => c.slice(0, -1))} aria-label="Borrar">
          <Delete size={20} />
        </PadButton>
      </div>
    </div>
  );
}

function PadButton({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className="grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5 font-display text-2xl font-semibold text-slate-100 transition active:scale-90 active:bg-white/10"
    >
      {children}
    </button>
  );
}

/** Pantalla de desbloqueo de la sección Equipo. */
export function StaffLock() {
  const unlockStaff = useStore((s) => s.unlockStaff);
  const [err, setErr] = useState(0);

  async function submit(code: string) {
    const ok = await unlockStaff(code);
    if (!ok) setErr((e) => e + 1);
  }

  return (
    <div className="flex min-h-[62vh] flex-col items-center justify-center gap-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold/15">
        <ShieldCheck size={30} className="text-gold" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold">Sección protegida</h2>
        <p className="mt-1 text-sm text-slate-400">
          Ingresa tu PIN para ver al equipo
        </p>
      </div>
      <PinPad onSubmit={submit} errorSignal={err} />
    </div>
  );
}

/** Hoja para crear un PIN (lo pide dos veces). */
export function PinSetupSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const setStaffPin = useStore((s) => s.setStaffPin);
  const [step, setStep] = useState<"new" | "confirm">("new");
  const [first, setFirst] = useState("");
  const [err, setErr] = useState(0);

  function reset() {
    setStep("new");
    setFirst("");
  }

  async function submit(code: string) {
    if (step === "new") {
      setFirst(code);
      setStep("confirm");
    } else if (code === first) {
      await setStaffPin(code);
      reset();
      onClose();
    } else {
      setErr((e) => e + 1);
      reset();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Proteger con PIN"
    >
      <div className="flex flex-col items-center gap-6 py-2">
        <p className="text-sm text-slate-400">
          {step === "new" ? "Crea un PIN de 4 dígitos" : "Confirma tu PIN"}
        </p>
        <PinPad key={step} onSubmit={submit} errorSignal={err} />
      </div>
    </Sheet>
  );
}
