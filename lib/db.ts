import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { EventItem, VoiceNote } from "./types";

interface CommandCenterDB extends DBSchema {
  events: {
    key: string;
    value: EventItem;
    indexes: { "by-date": string };
  };
  notes: {
    key: string;
    value: VoiceNote;
    indexes: { "by-created": number };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "exec-command-center";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CommandCenterDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB solo está disponible en el navegador.");
  }
  if (!dbPromise) {
    dbPromise = openDB<CommandCenterDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const events = db.createObjectStore("events", { keyPath: "id" });
        events.createIndex("by-date", "date");
        const notes = db.createObjectStore("notes", { keyPath: "id" });
        notes.createIndex("by-created", "createdAt");
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function getAllEvents(): Promise<EventItem[]> {
  const db = await getDB();
  return db.getAll("events");
}

export async function putEvent(event: EventItem): Promise<void> {
  const db = await getDB();
  await db.put("events", event);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("events", id);
}

export async function getAllNotes(): Promise<VoiceNote[]> {
  const db = await getDB();
  return db.getAll("notes");
}

export async function putNote(note: VoiceNote): Promise<void> {
  const db = await getDB();
  await db.put("notes", note);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("notes", id);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get("meta", key)) as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("meta", value, key);
}

export async function exportData() {
  const [events, notes] = await Promise.all([getAllEvents(), getAllNotes()]);
  // Las notas de audio (Blob) no se serializan en el export JSON.
  return {
    exportedAt: new Date().toISOString(),
    events,
    notes: notes.map(({ audio, ...rest }) => rest),
  };
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  await Promise.all([db.clear("events"), db.clear("notes")]);
}
