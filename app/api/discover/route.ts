import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

interface RawItem {
  kind: "event" | "news";
  title: string;
  summary: string;
  date: string | null;
  time: string | null;
  location: string | null;
  url: string | null;
  source: string | null;
  topics: string[];
}

const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

// Plataformas reales donde un URL del modelo suele ser correcto.
const TRUSTED_HOSTS = [
  "lu.ma",
  "luma.com",
  "eventbrite.com",
  "meetup.com",
  "ti.to",
  "partiful.com",
  "splashthat.com",
  "devpost.com",
  "sessionize.com",
  "hopin.com",
  "airmeet.com",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function googleSearch(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
}

/** Enlace que NUNCA da 404: directo si es de plataforma confiable, si no, búsqueda en Google. */
function reliableEventUrl(
  title: string,
  location: string | null,
  url: string | null,
): string {
  const host = url ? hostOf(url) : "";
  if (host && TRUSTED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return url as string;
  }
  return googleSearch(`${title} ${location ?? ""} evento registro tickets`);
}

function buildEventsPrompt(region: string, topics: string, today: string, limit: number) {
  return `Eres un asistente que descubre EVENTOS REALES de tecnología e IA usando búsqueda web actualizada (Google).

Hoy es ${today}.
Busca eventos REALES y ACTUALES en Estados Unidos (todo el país: incluye ciudades como San Francisco, Nueva York, Austin, Seattle, Boston, Los Ángeles, Denver, Miami, Salt Lake City${region && region.toLowerCase() !== "estados unidos" ? ` y especialmente ${region}` : ""}) sobre ${topics}: conferencias, cumbres, meetups, hackathons, demo days, pitch nights y charlas, con fecha FUTURA (>= hoy).

Usa fuentes reales como Luma (lu.ma), Eventbrite, Meetup, Devpost y los sitios oficiales de las conferencias.

REGLAS IMPORTANTES (cúmplelas):
- Incluye SOLO eventos que realmente encuentres en la búsqueda. Si encuentras pocos, devuelve pocos. NO inventes eventos.
- "url": el URL público real del evento tal como aparece en los resultados. Si NO estás seguro del URL exacto, pon url en null. NO inventes URLs.
- No repitas el mismo evento.

Devuelve cada evento con: title, summary (1-2 frases en español), date ("YYYY-MM-DD"), time ("HH:mm" o null), location (ciudad y lugar, o null), url (real o null), source (organizador real o null), topics (array de etiquetas cortas).

Responde ÚNICAMENTE con un array JSON válido (sin markdown). Máximo ${limit} eventos.`;
}

function extractEvents(text: string): RawItem[] {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const tryParse = (s: string) => {
    try {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  };
  let arr = tryParse(cleaned);
  if (!arr) {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) arr = tryParse(m[0]);
  }
  if (!arr) return [];
  return arr
    .filter((x) => x && typeof x.title === "string")
    .map((x): RawItem => {
      const title = String(x.title).slice(0, 200);
      const location = typeof x.location === "string" ? x.location.slice(0, 120) : null;
      const rawUrl =
        typeof x.url === "string" && /^https?:\/\//.test(x.url) ? x.url : null;
      return {
        kind: "event",
        title,
        summary: typeof x.summary === "string" ? x.summary.slice(0, 400) : "",
        date: isDate(x.date) ? x.date : null,
        time: typeof x.time === "string" && /^\d{1,2}:\d{2}$/.test(x.time) ? x.time : null,
        location,
        url: reliableEventUrl(title, location, rawUrl),
        source: typeof x.source === "string" ? x.source.slice(0, 80) : null,
        topics: Array.isArray(x.topics)
          ? x.topics.filter((t: unknown) => typeof t === "string").slice(0, 5)
          : [],
      };
    });
}

const decodeEntities = (s: string) =>
  s
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

/** Noticias REALES con enlace directo, vía Google News RSS (sin API key). */
async function fetchNews(topics: string, limit: number): Promise<RawItem[]> {
  const query = `${topics
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .join(" OR ")} when:7d`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=es-419&gl=US&ceid=US:es-419`;

  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return [];
  const xml = await res.text();

  const pick = (block: string, tag: string) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return m ? decodeEntities(m[1]) : null;
  };

  const items: RawItem[] = [];
  for (const block of xml.split("<item>").slice(1, limit + 1)) {
    const rawTitle = pick(block, "title");
    const link = pick(block, "link");
    const pub = pick(block, "pubDate");
    const source = pick(block, "source");
    if (!rawTitle || !link) continue;
    let title = rawTitle;
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim();
    }
    let date: string | null = null;
    if (pub) {
      const d = new Date(pub);
      if (!Number.isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
    }
    items.push({
      kind: "news",
      title,
      summary: "",
      date,
      time: null,
      location: null,
      url: link,
      source: source ?? "Google News",
      topics: [],
    });
  }
  return items;
}

async function generateEvents(
  ai: GoogleGenAI,
  prompt: string,
  attempts = 3,
): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { tools: [{ googleSearch: {} }], temperature: 0 },
      });
      return response.text ?? "";
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!/503|UNAVAILABLE|overloaded|high demand/i.test(msg) || i === attempts - 1) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

function friendlyError(message: string): string {
  if (/429|quota|rate limit/i.test(message))
    return "Cuota de Gemini excedida. Intenta más tarde.";
  if (/503|UNAVAILABLE|overloaded|high demand/i.test(message))
    return "El modelo está saturado. Intenta de nuevo en unos segundos.";
  if (/api[_ ]?key|permission|401|403/i.test(message))
    return "API key inválida o sin permisos. Revísala en Ajustes.";
  return `Gemini: ${message.slice(0, 160)}`;
}

export async function POST(req: Request) {
  let body: { region?: string; topics?: string; apiKey?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || body.apiKey;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta la API key de Gemini. Agrégala en Ajustes." },
      { status: 400 },
    );
  }

  const region = (body.region || "Estados Unidos").slice(0, 120);
  const topics = (body.topics || "tecnología, inteligencia artificial").slice(0, 160);
  const limit = Math.min(Math.max(body.limit || 10, 4), 20);
  const today = new Date().toISOString().slice(0, 10);

  // Noticias reales (RSS) y eventos (IA) en paralelo. Las noticias no dependen de Gemini.
  const newsPromise = fetchNews(topics, 6).catch(() => [] as RawItem[]);

  let events: RawItem[] = [];
  let aiError: string | null = null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const text = await generateEvents(ai, buildEventsPrompt(region, topics, today, limit));
    events = extractEvents(text);
  } catch (err) {
    aiError = friendlyError(err instanceof Error ? err.message : String(err));
  }

  const news = await newsPromise;
  const items = [...events, ...news];

  if (items.length === 0) {
    return NextResponse.json(
      { error: aiError || "No se encontraron resultados. Intenta de nuevo." },
      { status: 502 },
    );
  }
  return NextResponse.json({ items, model: DEFAULT_MODEL, note: aiError ?? undefined });
}
