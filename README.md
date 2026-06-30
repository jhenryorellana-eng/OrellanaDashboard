# 🟡 Command Center · CEO Dashboard

PWA mobile-first para ejecutivos: calendario organizacional, notas de voz
(transcripción + audio) y recordatorios locales. Diseño *dark glassmorphism*
con identidad propia. **100% offline y privado** — todos los datos viven en el
dispositivo (IndexedDB), sin servidor ni cuentas.

![stack](https://img.shields.io/badge/Next.js-15-black) ![pwa](https://img.shields.io/badge/PWA-installable-f5b642) ![offline](https://img.shields.io/badge/offline-first-4fe3c1)

## ✨ Funcionalidades

- **Dashboard "Hoy"** — reloj en vivo, anillo de progreso del día, próximo
  evento y métricas rápidas.
- **Calendario** — vista mensual interactiva, puntos por categoría, selección de
  fecha y alta de eventos con hora, categoría, prioridad y recordatorio.
- **Notas de voz** — graba con un toque: transcripción **en tiempo real**
  (Web Speech API) **+** audio guardado, con waveform animado. Fijar y reproducir.
- **Recordatorios locales** — la app avisa a la hora programada vía
  service worker (sin backend ni claves VAPID).
- **PWA instalable** — manifest, iconos, service worker, funciona offline.
- **Datos** — exporta un respaldo en JSON o bórralo todo. Privacidad total.

## 🚀 Cómo ejecutar

```bash
npm install          # instalar dependencias
npm run gen:icons    # (opcional) regenerar iconos PWA
npm run dev          # desarrollo  → http://localhost:3000
npm run build        # build de producción
npm run start        # servir el build
```

> 💡 Para probar **instalación PWA y notificaciones** usa `npm run build && npm run start`
> sobre `localhost` (o HTTPS). El reconocimiento de voz funciona en
> Chrome/Edge/Safari.

## 🧱 Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v3**
- **Zustand** (estado) · **idb** (IndexedDB) · **date-fns** (fechas)
- **Framer Motion** (animaciones) · **lucide-react** (iconos)
- Tipografía: **Fraunces** (display) + **Manrope** (UI)

## 📁 Estructura

```
app/            layout, página raíz, estilos globales, favicon
components/     AppShell, BottomNav, EventEditor, VoiceRecorder, ...
  views/        TodayView, CalendarView, NotesView, SettingsView
  ui/           Sheet (bottom sheet reutilizable)
lib/            store, db, notifications, speech, pwa, selectors, types
public/         manifest.webmanifest, sw.js, icons/
scripts/        generate-icons.mjs (genera PNGs sin dependencias nativas)
```

## ⚠️ Notas técnicas

- Los **recordatorios** se programan mientras la PWA está activa/instalada
  (timeouts + service worker). Para *push* reales multi-dispositivo en segundo
  plano se requeriría un backend con VAPID — fuera del alcance actual.
- El audio de las notas **no** se incluye en el export JSON (solo el texto).
