/**
 * Genera los iconos PNG de la PWA sin dependencias nativas.
 * Rasteriza un diseño vectorial (fondo dorado + anillo de progreso ink)
 * con antialiasing analítico y codifica PNG usando solo zlib de Node.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT_DIR = "public/icons";

const GOLD_A = [249, 205, 118];
const GOLD_B = [221, 154, 38];
const INK = [10, 14, 26];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Distancia con signo a un rectángulo redondeado centrado. */
function roundedRectSDF(px, py, cx, cy, half, radius) {
  const qx = Math.abs(px - cx) - (half - radius);
  const qy = Math.abs(py - cy) - (half - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return outside - radius;
}

/** Color RGBA [0..255] de un punto del icono. */
function sample(px, py, size, maskable) {
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * (maskable ? 0.27 : 0.31);
  const stroke = size * (maskable ? 0.085 : 0.095);
  const dotR = size * (maskable ? 0.066 : 0.075);
  const bgHalf = size / 2 - (maskable ? 0 : size * 0.03);
  const bgRadius = maskable ? 0 : size * 0.22;

  // Fondo dorado (degradado diagonal)
  const t = (px + py) / (2 * size);
  const bg = [lerp(GOLD_A[0], GOLD_B[0], t), lerp(GOLD_A[1], GOLD_B[1], t), lerp(GOLD_A[2], GOLD_B[2], t)];
  const bgCov = maskable
    ? 1
    : clamp01(0.5 - roundedRectSDF(px, py, cx, cy, bgHalf, bgRadius));

  // Anillo de progreso (con hueco arriba)
  const dist = Math.hypot(px - cx, py - cy);
  let ringCov = clamp01(stroke / 2 - Math.abs(dist - ringR) + 0.5);
  const ang = Math.atan2(py - cy, px - cx); // -PI..PI ; -PI/2 = arriba
  let diff = Math.abs(ang - -Math.PI / 2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  if (diff < 0.34) ringCov = 0; // hueco superior

  // Punto central
  const dotCov = clamp01(dotR - dist + 0.5);

  const inkCov = Math.max(ringCov, dotCov);

  // Composición: ink sobre dorado sobre transparente
  const r = lerp(bg[0], INK[0], inkCov);
  const g = lerp(bg[1], INK[1], inkCov);
  const b = lerp(bg[2], INK[2], inkCov);
  const a = Math.max(bgCov, inkCov);
  return [Math.round(r), Math.round(g), Math.round(b), Math.round(a * 255)];
}

function renderPNG(size, maskable) {
  const SS = 2; // supersampling 2x2 para bordes suaves
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filtro None
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const c = sample(px, py, size, maskable);
          r += c[0]; g += c[1]; b += c[2]; a += c[3];
        }
      }
      const n = SS * SS;
      const idx = y * (1 + size * 4) + 1 + x * 4;
      raw[idx] = Math.round(r / n);
      raw[idx + 1] = Math.round(g / n);
      raw[idx + 2] = Math.round(b / n);
      raw[idx + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, raw);
}

// ---- Codificador PNG mínimo (RGBA, 8 bits) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
const targets = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["maskable-512.png", 512, true],
];
for (const [name, size, maskable] of targets) {
  writeFileSync(`${OUT_DIR}/${name}`, renderPNG(size, maskable));
  console.log(`✓ ${OUT_DIR}/${name} (${size}px${maskable ? ", maskable" : ""})`);
}
console.log("Iconos generados.");
