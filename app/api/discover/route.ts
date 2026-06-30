import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

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

function buildPrompt(region: string, topics: string, today: string, limit: number) {
  return `Eres un asistente que descubre EVENTOS de tecnología/IA y NOTICIAS recientes usando búsqueda web actualizada.

Hoy es ${today}.
Región de interés para los eventos: ${region}.
Temas: ${topics}.

Devuelve:
1) PRÓXIMOS EVENTOS (conferencias, meetups, presentaciones, hackathons, demo days) en o cerca de "${region}" sobre ${topics}, con fecha FUTURA (>= hoy). Incluye el link de inscripción/registro real.
2) NOTICIAS recientes (últimos 7 días) e importantes de ${topics}, con el link al artículo.

Para cada item incluye exactamente estos campos:
- kind: "event" o "news"
- title: string
- summary: 1-2 frases en español
- date: "YYYY-MM-DD" (fecha del evento o de publicación) o null
- time: "HH:mm" o null
- location: ciudad/lugar o null
- url: link real de inscripción o del artículo (o null)
- source: nombre de la fuente/organizador (o null)
- topics: array de etiquetas cortas (ej. ["IA","Startups"])

Responde ÚNICAMENTE con un array JSON válido (sin markdown, sin texto extra). Máximo ${limit} items, priorizando los eventos próximos más relevantes.`;
}

function extractJSON(text: string): RawItem[] {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const tryParse = (s: string) => {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };
  let arr = tryParse(cleaned);
  if (!arr) {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) arr = tryParse(match[0]);
  }
  if (!arr) return [];
  return arr
    .filter((x) => x && typeof x.title === "string")
    .map((x): RawItem => ({
      kind: x.kind === "news" ? "news" : "event",
      title: String(x.title).slice(0, 200),
      summary: typeof x.summary === "string" ? x.summary.slice(0, 400) : "",
      date: isDate(x.date) ? x.date : null,
      time: typeof x.time === "string" && /^\d{1,2}:\d{2}$/.test(x.time) ? x.time : null,
      location: typeof x.location === "string" ? x.location.slice(0, 120) : null,
      url: typeof x.url === "string" && /^https?:\/\//.test(x.url) ? x.url : null,
      source: typeof x.source === "string" ? x.source.slice(0, 80) : null,
      topics: Array.isArray(x.topics)
        ? x.topics.filter((t: unknown) => typeof t === "string").slice(0, 5)
        : [],
    }));
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

  const region = (body.region || "tecnología global").slice(0, 120);
  const topics = (body.topics || "tecnología, IA").slice(0, 160);
  const limit = Math.min(Math.max(body.limit || 12, 4), 20);
  const today = new Date().toISOString().slice(0, 10);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: buildPrompt(region, topics, today, limit) }] },
        ],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `Gemini respondió ${res.status}. Revisa tu API key o cuota.`, detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text)
        .filter(Boolean)
        .join("") ?? "";

    const items = extractJSON(text);
    return NextResponse.json({ items, model: DEFAULT_MODEL });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo conectar con Gemini.", detail: String(err).slice(0, 200) },
      { status: 502 },
    );
  }
}
