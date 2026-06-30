"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

function translate(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("already registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (m.includes("at least 6")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("email") && m.includes("invalid")) return "El correo no es válido.";
  if (m.includes("not confirmed")) return "Confirma tu correo antes de entrar (revisa tu bandeja).";
  return message;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) setError(translate(error.message));
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) setError(translate(error.message));
        else if (!data.session) {
          setMessage(
            "Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.",
          );
          setMode("signin");
        }
      }
    } catch {
      setError("No se pudo conectar. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="HiHenry"
            className="h-16 w-16 rounded-3xl shadow-glass"
          />
          <div>
            <h1 className="font-display text-3xl font-semibold">HiHenry</h1>
            <p className="text-sm text-slate-400">
              {mode === "signin"
                ? "Inicia sesión para continuar"
                : "Crea tu cuenta de CEO"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="glass space-y-3 p-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Mail size={13} /> Correo
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="henry@empresa.com"
              autoComplete="email"
              className="input-base"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Lock size={13} /> Contraseña
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="input-base"
            />
          </label>

          {error && <p className="text-sm text-coral">{error}</p>}
          {message && <p className="text-sm text-mint">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-sm text-slate-400 transition hover:text-slate-200"
        >
          {mode === "signin"
            ? "¿No tienes cuenta? Crear una"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>
      </motion.div>
    </div>
  );
}
