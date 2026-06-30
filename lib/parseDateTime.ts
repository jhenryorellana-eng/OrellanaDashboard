/**
 * Detector ligero de fecha/hora en español dentro de un texto libre
 * (lo que Henry dicta en una nota de voz). Sin dependencias ni IA.
 * Reconoce: hoy / mañana / pasado mañana, días de la semana,
 * "DD de <mes>", y horas tipo "a las 3", "3pm", "15:30", "a las 10 y media".
 */

export interface DetectedDateTime {
  /** yyyy-MM-dd */
  date: string;
  /** HH:mm o null si no se detectó hora */
  time: string | null;
}

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function detectDate(text: string, now: Date): Date | null {
  if (/\bpasado\s+manana\b/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d;
  }
  if (/\bmanana\b/.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/\bhoy\b/.test(text)) return new Date(now);

  for (let i = 0; i < WEEKDAYS.length; i++) {
    const re = new RegExp(
      `\\b(?:el\\s+|este\\s+|proximo\\s+|el\\s+proximo\\s+)?${WEEKDAYS[i]}\\b`,
    );
    if (re.test(text)) {
      const d = new Date(now);
      let diff = (i - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // el mismo día → la próxima semana
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  const m = text.match(/\b(\d{1,2})\s+de\s+([a-z]+)/);
  if (m) {
    const day = parseInt(m[1], 10);
    const name = m[2] === "setiembre" ? "septiembre" : m[2];
    const mi = MONTHS.indexOf(name);
    if (mi >= 0 && day >= 1 && day <= 31) {
      let d = new Date(now.getFullYear(), mi, day);
      if (d.getTime() < now.getTime() - 86_400_000) {
        d = new Date(now.getFullYear() + 1, mi, day);
      }
      return d;
    }
  }
  return null;
}

function detectTime(text: string): string | null {
  let hour: number | null = null;
  let min = 0;
  let period: string | undefined;

  const periodRe =
    "(de la manana|de la tarde|de la noche|a\\.?m\\.?|p\\.?m\\.?)";
  const aLas = text.match(
    new RegExp(
      `a\\s+la[s]?\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(y media|y cuarto)?\\s*${periodRe}?`,
    ),
  );
  const h24 = text.match(/\b(\d{1,2}):(\d{2})\b/);
  const hPeriod = text.match(/\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/);

  if (aLas) {
    hour = parseInt(aLas[1], 10);
    if (aLas[2]) min = parseInt(aLas[2], 10);
    if (aLas[3] === "y media") min = 30;
    else if (aLas[3] === "y cuarto") min = 15;
    period = aLas[4];
  } else if (h24) {
    hour = parseInt(h24[1], 10);
    min = parseInt(h24[2], 10);
  } else if (hPeriod) {
    hour = parseInt(hPeriod[1], 10);
    period = hPeriod[2];
  } else {
    return null;
  }

  if (hour == null || hour > 23 || min > 59) return null;

  const p = period ? stripAccents(period) : "";
  if (/tarde|noche|p\.?m/.test(p) && hour < 12) hour += 12;
  else if (/manana|a\.?m/.test(p) && hour === 12) hour = 0;
  else if (!p && hour >= 1 && hour <= 7) hour += 12; // heurística horario laboral

  return `${pad(hour)}:${pad(min)}`;
}

export function parseSpanishDateTime(input: string): DetectedDateTime | null {
  if (!input || input.trim().length < 3) return null;
  const text = stripAccents(input.toLowerCase());
  const now = new Date();

  let date = detectDate(text, now);
  const time = detectTime(text);

  if (!date && !time) return null;

  // Hora sin fecha → hoy; si ya pasó, mañana.
  if (!date && time) {
    const d = new Date(now);
    const [h, m] = time.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
    date = d;
  }

  return { date: toKey(date as Date), time };
}
