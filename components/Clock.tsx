"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function greeting(hour: number): string {
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Clock({ name }: { name?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Evita desajuste de hidratación: no renderizamos la hora en el servidor.
  if (!now) {
    return <div className="h-[88px]" aria-hidden />;
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-400">
        {greeting(now.getHours())}
        {name ? `, ${name}` : ""}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="tnum font-display text-5xl font-semibold leading-none tracking-tight">
          {format(now, "HH:mm")}
        </span>
        <span className="tnum text-lg font-medium text-gold">
          {format(now, "ss")}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400 first-letter:uppercase">
        {format(now, "EEEE d 'de' MMMM", { locale: es })}
      </p>
    </div>
  );
}
