"use client";

/** Barras de audio en vivo. Recibe niveles 0..1 calculados desde el AnalyserNode. */
export default function Waveform({
  levels,
  active,
}: {
  levels: number[];
  active: boolean;
}) {
  return (
    <div className="flex h-16 items-center justify-center gap-1">
      {levels.map((lvl, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full transition-[height,background-color] duration-75"
          style={{
            height: `${Math.max(8, lvl * 100)}%`,
            background: active
              ? `linear-gradient(180deg, #f9cd76, #f5b642 60%, #6aa8ff)`
              : "rgba(255,255,255,0.12)",
            opacity: active ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}
