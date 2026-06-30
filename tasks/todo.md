# TODO — Command Center

## ✅ Hecho (v0.1 — 2026-06-29)
- [x] Scaffolding Next.js 15 + TS + Tailwind v3 (manual, por nombre de carpeta con espacios)
- [x] Capa de datos: IndexedDB (`idb`) + store Zustand
- [x] Dashboard "Hoy": reloj en vivo, anillo de progreso, próximo evento, stats
- [x] Calendario mensual interactivo con puntos por categoría
- [x] Editor de eventos (fecha, hora, categoría, prioridad, recordatorio, ubicación, notas)
- [x] Notas de voz: transcripción en vivo (Web Speech) + audio (MediaRecorder) + waveform
- [x] Recordatorios locales (Notification API + service worker)
- [x] PWA: manifest, service worker, iconos generados sin deps nativas
- [x] Ajustes: permisos de notificación, instalar, exportar/borrar datos
- [x] Verificado en navegador (390×844): build OK, sin errores de consola

## 🔭 Backlog / mejoras futuras
- [ ] Búsqueda y filtros de eventos por categoría
- [ ] Vista semanal / agenda tipo timeline
- [ ] Recurrencia de eventos (diario/semanal)
- [ ] Vincular notas de voz a un evento concreto
- [ ] Sincronización en la nube opcional (Supabase) + push reales (VAPID)
- [ ] Tema claro / personalización de acento
- [ ] Importar respaldo JSON
