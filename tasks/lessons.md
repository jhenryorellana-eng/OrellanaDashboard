# Lessons learned

## 2026-06-29: create-next-app falla con nombres de carpeta no válidos
**Error**: `create-next-app .` falló porque la carpeta "plataforma henry
organizado" tiene espacios/mayúsculas (restricción de nombres de npm).
**Root cause**: create-next-app deriva el nombre del paquete del basename del
directorio y lo valida contra las reglas de npm.
**Rule**: En carpetas con nombre no compatible, hacer scaffolding manual
(package.json + configs) en vez de pelear con el generador. Da más control.

## 2026-06-29: `sharp` es riesgoso en Node muy reciente (Node 25)
**Error**: Riesgo de que el `postinstall` nativo de `sharp` rompa todo
`npm install` si no hay binario precompilado para la versión de Node/OS.
**Root cause**: Dependencias nativas dependen de prebuilds por versión.
**Rule**: Para generar assets (PNG de iconos) preferir una solución sin deps
nativas — aquí se rasteriza el SVG por píxeles y se codifica PNG con `zlib`
nativo en `scripts/generate-icons.mjs`.

## 2026-06-29: `capitalize` de Tailwind capitaliza CADA palabra
**Error**: La fecha salía "Lunes 29 De Junio" en vez de "Lunes 29 de junio".
**Root cause**: `text-transform: capitalize` afecta a todas las palabras.
**Rule**: Para capitalizar solo la inicial de una frase usar
`first-letter:uppercase`.
