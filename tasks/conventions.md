# Convenciones del proyecto

## Arquitectura
- **Estado global** en `lib/store.ts` (Zustand). Las mutaciones persisten en
  IndexedDB (`lib/db.ts`) y reprograman recordatorios en el mismo paso.
- **Lógica pura** (cálculos derivados) en `lib/selectors.ts` — sin estado, testeable.
- **Componentes** presentacionales en `components/`; las pantallas en `components/views/`.
- Acceso a APIs del navegador encapsulado por módulo: `speech.ts`, `notifications.ts`,
  `pwa.ts`. Siempre con *guards* de `typeof window` y degradación elegante.

## Estilo
- Tailwind con tokens en `tailwind.config.ts` (colores `ink/gold/azure/mint/...`).
- Clases de marca en `globals.css`: `.glass`, `.glass-soft`, `.pill`, `.text-gradient-gold`.
- Tipografía vía `next/font`: `--font-display` (Fraunces) y `--font-sans` (Manrope).
- Mobile-first; contenedor `max-w-md`. Respetar `safe-area` (`pt-safe`/`pb-safe`).

## Reglas
- Sin `any`. Sin `console.log` permanente. `catch` siempre maneja o degrada.
- Fechas como `yyyy-MM-dd`, horas como `HH:mm` (strings). Combinar con `toDateTime`.
- IDs con `uid()`. Nada de secretos ni llamadas a servidores (app local-first).
