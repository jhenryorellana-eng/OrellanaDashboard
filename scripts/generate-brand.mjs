/**
 * Genera los iconos de la PWA, el favicon y la imagen de Open Graph
 * (vista previa al compartir el enlace) a partir del logo de HiHenry.
 *
 *   node scripts/generate-brand.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "scripts/logo-source.png";
const ICONS = "public/icons";
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const INK = { r: 10, g: 14, b: 26, alpha: 1 };

mkdirSync(ICONS, { recursive: true });

async function resizeIcon(size, out) {
  await sharp(SRC).resize(size, size, { fit: "cover" }).png().toFile(out);
  console.log(`✓ ${out} (${size}px)`);
}

async function flatIcon(size, out, bg) {
  await sharp(SRC)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: bg })
    .png()
    .toFile(out);
  console.log(`✓ ${out} (${size}px, fondo)`);
}

async function maskable(size, out) {
  const inner = Math.round(size * 0.78);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: WHITE })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log(`✓ ${out} (${size}px, maskable)`);
}

async function ogImage(out) {
  const W = 1200;
  const H = 630;
  const logo = await sharp(SRC)
    .resize(480, 480, { fit: "contain", background: INK })
    .toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 4, background: INK },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(out);
  console.log(`✓ ${out} (1200×630, Open Graph)`);
}

await resizeIcon(192, `${ICONS}/icon-192.png`);
await resizeIcon(512, `${ICONS}/icon-512.png`);
await maskable(512, `${ICONS}/maskable-512.png`);
await flatIcon(180, `${ICONS}/apple-touch-icon.png`, WHITE);
await flatIcon(96, "app/icon.png", WHITE);
await ogImage("public/og.png");

console.log("Marca generada ✔");
