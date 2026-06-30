# TODO — Orellana Dashboard

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

## ✅ Hecho (v0.2 — 2026-06-30)
- [x] Renombrado de marca a "Orellana Dashboard"
- [x] Campo contextual por categoría en el editor (con quién / destino / monto…)
- [x] Notas → acción: detector de fecha/hora en español (`parseDateTime`) → "Crear evento" prellenado
- [x] Vínculo nota ↔ fecha (linkedDate) al crear evento desde una nota
- [x] Compartir nota (Web Share API, con audio) + copiar texto
- [x] Grabador: pausar/reanudar + selector de idioma (ES/EN)
- [x] Reproductor pro: waveform decodificado, scrubber y velocidad (1×/1.5×/2×)
- [x] Verificado en navegador: build OK, detección de fecha y prefill correctos, sin errores

## ✅ Hecho (v0.3 — 2026-06-30)
- [x] Nueva sección **Equipo** (5ª pestaña; Ajustes movido al engranaje de cada header)
- [x] Ficha completa: sueldo+moneda, frecuencia, día de pago, antigüedad, banco,
      cuenta, tipo, titular+doc, estilo de pago, documento, contacto, notas
- [x] Copiar datos de pago (bloque formateado) + copiar campo individual (cuenta/monto)
- [x] Control de pagos: marcar pagado por periodo + historial por persona
- [x] Recordatorio de pago (X días antes) integrado en las notificaciones locales
- [x] Bloqueo con PIN (SHA-256 en IndexedDB, desbloqueo por sesión, keypad)
- [x] Resumen de nómina mensual + buscador + estados + export CSV
- [x] FAB contextual (evento o persona según la pestaña)
- [x] Verificado en navegador: alta, detalle, copiar pago, marcar pagado, PIN (lock/unlock)

## 🔭 Backlog / mejoras futuras
- [ ] Notas: buscador, título editable y categorías/etiquetas
- [ ] Notas: extraer pendientes (checklist) del texto
- [ ] IA opcional (fase 2): resumen + action items + auto-título (requiere backend/API key)
- [ ] Búsqueda y filtros de eventos por categoría
- [ ] Vista semanal / agenda tipo timeline
- [ ] Recurrencia de eventos (diario/semanal)
- [ ] Sincronización en la nube opcional (Supabase) + push reales (VAPID)
- [ ] Tema claro / personalización de acento
- [ ] Importar respaldo JSON
