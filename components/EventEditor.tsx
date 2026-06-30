"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check, MapPin, AlignLeft, Video } from "lucide-react";
import { useStore } from "@/lib/store";
import type {
  EventCategory,
  Priority,
  EventItem,
  EventModality,
} from "@/lib/types";
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  PRIORITY_META,
  REMINDER_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import Sheet from "./ui/Sheet";
import CategoryIcon from "./CategoryIcon";

interface FormState {
  title: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  notes: string;
  category: EventCategory;
  categoryDetail: string;
  modality: EventModality;
  priority: Priority;
  reminderMinutes: number | null;
}

/** Placeholder del primer campo según la categoría (lo que más importa). */
const TITLE_PLACEHOLDER: Record<EventCategory, string> = {
  meeting: "¿Con quién te reúnes?",
  deadline: "¿Qué hay que entregar?",
  travel: "¿A dónde viajas?",
  finance: "Concepto del movimiento",
  personal: "¿Qué tienes?",
  other: "¿Qué hay en la agenda?",
};

function defaults(date: string): FormState {
  const next = new Date();
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return {
    title: "",
    date,
    time: next.toTimeString().slice(0, 5),
    endTime: "",
    location: "",
    notes: "",
    category: "meeting",
    categoryDetail: "",
    modality: "presencial",
    priority: "medium",
    reminderMinutes: 15,
  };
}

function mergeDraft(base: FormState, draft: Partial<EventItem> | null): FormState {
  if (!draft) return base;
  return {
    ...base,
    title: draft.title ?? base.title,
    date: draft.date ?? base.date,
    time: draft.time ?? base.time,
    endTime: draft.endTime ?? base.endTime,
    location: draft.location ?? base.location,
    notes: draft.notes ?? base.notes,
    category: draft.category ?? base.category,
    categoryDetail: draft.categoryDetail ?? base.categoryDetail,
    priority: draft.priority ?? base.priority,
    reminderMinutes: draft.reminderMinutes ?? base.reminderMinutes,
  };
}

export default function EventEditor() {
  const open = useStore((s) => s.editorOpen);
  const editing = useStore((s) => s.editingEvent);
  const draft = useStore((s) => s.draftEvent);
  const selectedDate = useStore((s) => s.selectedDate);
  const close = useStore((s) => s.closeEditor);
  const saveEvent = useStore((s) => s.saveEvent);
  const removeEvent = useStore((s) => s.removeEvent);

  const [form, setForm] = useState<FormState>(defaults(selectedDate));

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            title: editing.title,
            date: editing.date,
            time: editing.time,
            endTime: editing.endTime ?? "",
            location: editing.location ?? "",
            notes: editing.notes ?? "",
            category: editing.category,
            categoryDetail: editing.categoryDetail ?? "",
            modality: editing.modality ?? "presencial",
            priority: editing.priority,
            reminderMinutes: editing.reminderMinutes,
          }
        : mergeDraft(defaults(selectedDate), draft),
    );
  }, [open, editing, draft, selectedDate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    await saveEvent({
      id: editing?.id,
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      endTime: form.endTime || undefined,
      location:
        form.category === "meeting" ? form.location.trim() || undefined : undefined,
      notes: form.notes.trim() || undefined,
      category: form.category,
      categoryDetail: form.categoryDetail.trim() || undefined,
      modality: form.category === "meeting" ? form.modality : undefined,
      priority: form.priority,
      reminderMinutes: form.reminderMinutes,
    });
  }

  return (
    <Sheet open={open} onClose={close} title={editing ? "Editar evento" : "Nuevo evento"}>
      <div className="space-y-5">
        <input
          autoFocus
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder={TITLE_PLACEHOLDER[form.category]}
          className="w-full border-b border-white/10 bg-transparent pb-2 font-display text-2xl font-semibold text-slate-100 outline-none placeholder:text-slate-600 focus:border-gold/50"
        />

        <div className="flex items-end gap-2">
          <label className="block min-w-0 flex-[1.5]">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fecha
            </span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className="input-base min-w-0 px-2"
            />
          </label>
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inicio
            </span>
            <input
              type="time"
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              className="input-base min-w-0 px-1.5 text-center"
            />
          </label>
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fin
            </span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => update("endTime", e.target.value)}
              aria-label="Hora de fin (opcional)"
              className="input-base min-w-0 px-1.5 text-center"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Categoría
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((cat) => {
              const meta = CATEGORY_META[cat];
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => update("category", cat)}
                  className={cn(
                    "pill border transition",
                    active ? "border-transparent" : "border-white/10 text-slate-300",
                  )}
                  style={
                    active
                      ? { background: `${meta.color}26`, color: meta.color, borderColor: `${meta.color}55` }
                      : undefined
                  }
                >
                  <CategoryIcon category={cat} size={14} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo contextual: cambia según la categoría que elija Henry */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={form.category}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl border p-3"
              style={{
                borderColor: `${CATEGORY_META[form.category].color}55`,
                background: `${CATEGORY_META[form.category].color}12`,
              }}
            >
              <label
                className="mb-2 flex items-center gap-2 text-sm font-semibold"
                style={{ color: CATEGORY_META[form.category].color }}
              >
                <CategoryIcon category={form.category} size={16} />
                {CATEGORY_META[form.category].detailLabel}
              </label>
              <input
                value={form.categoryDetail}
                onChange={(e) => update("categoryDetail", e.target.value)}
                placeholder={CATEGORY_META[form.category].detailPlaceholder}
                className="input-base"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {form.category === "meeting" && (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Modalidad
              </p>
              <div className="flex gap-2">
                {(
                  [
                    { key: "presencial", label: "Presencial", icon: MapPin },
                    { key: "digital", label: "Digital", icon: Video },
                  ] as const
                ).map((m) => {
                  const active = form.modality === m.key;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.key}
                      onClick={() => {
                        if (m.key !== form.modality) {
                          setForm((f) => ({ ...f, modality: m.key, location: "" }));
                        }
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition",
                        active
                          ? "border-transparent bg-azure/20 text-azure"
                          : "border-white/10 text-slate-300",
                      )}
                    >
                      <Icon size={16} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caja que se abre según la modalidad elegida */}
            <div
              className="rounded-2xl border border-azure/30 bg-azure/[0.08] p-3"
            >
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-azure">
                {form.modality === "digital" ? (
                  <Video size={16} />
                ) : (
                  <MapPin size={16} />
                )}
                {form.modality === "digital"
                  ? "Enlace de la videollamada"
                  : "Ubicación"}
              </label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder={
                  form.modality === "digital"
                    ? "Zoom, Meet, WhatsApp…"
                    : "Oficina, dirección, lugar…"
                }
                className="input-base"
              />
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Prioridad
          </p>
          <div className="flex gap-2">
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
              const meta = PRIORITY_META[p];
              const active = form.priority === p;
              return (
                <button
                  key={p}
                  onClick={() => update("priority", p)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-sm font-semibold transition",
                    active ? "border-transparent" : "border-white/10 text-slate-300",
                  )}
                  style={active ? { background: `${meta.color}22`, color: meta.color } : undefined}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Recordatorio">
          <select
            value={String(form.reminderMinutes)}
            onChange={(e) =>
              update(
                "reminderMinutes",
                e.target.value === "null" ? null : Number(e.target.value),
              )
            }
            className="input-base appearance-none"
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={String(o.value)} value={String(o.value)} className="bg-ink-800">
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notas" icon={<AlignLeft size={14} />}>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Detalles, agenda, asistentes…"
            className="input-base h-20 resize-none"
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          {editing && (
            <button
              onClick={() => removeEvent(editing.id)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-coral/30 bg-coral/10 text-coral transition active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-50"
          >
            <Check size={18} />
            {editing ? "Guardar cambios" : "Crear evento"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
