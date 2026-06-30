"use client";

import { motion } from "framer-motion";
import { Bell, MapPin, Clock3 } from "lucide-react";
import type { EventItem } from "@/lib/types";
import { CATEGORY_META, PRIORITY_META } from "@/lib/constants";
import { formatHour, cn } from "@/lib/utils";
import CategoryIcon from "./CategoryIcon";

export default function EventCard({
  event,
  onClick,
  index = 0,
}: {
  event: EventItem;
  onClick?: () => void;
  index?: number;
}) {
  const meta = CATEGORY_META[event.category];
  const priority = PRIORITY_META[event.priority];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="glass-soft group flex w-full items-stretch gap-3 p-3 text-left transition active:scale-[0.985]"
    >
      <div
        className="w-1.5 shrink-0 rounded-full"
        style={{ background: meta.color }}
      />
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ background: `${meta.color}1f` }}
      >
        <CategoryIcon category={event.category} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-slate-100">
            {event.title}
          </h3>
          {event.priority === "high" && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: priority.color }}
              title="Prioridad alta"
            />
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 tnum">
            <Clock3 size={12} />
            {formatHour(event.time)}
            {event.endTime ? ` – ${formatHour(event.endTime)}` : ""}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin size={12} />
              {event.location}
            </span>
          )}
          {event.reminderMinutes != null && (
            <span className="inline-flex items-center gap-1 text-gold/80">
              <Bell size={12} />
            </span>
          )}
        </div>
      </div>

      <span
        className={cn(
          "pill self-center shrink-0",
        )}
        style={{ background: `${meta.color}1a`, color: meta.color }}
      >
        {meta.label}
      </span>
    </motion.button>
  );
}
