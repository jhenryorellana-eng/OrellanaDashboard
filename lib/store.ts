import { create } from "zustand";
import type { EventItem, VoiceNote, TabKey } from "./types";
import * as db from "./db";
import { scheduleReminders } from "./notifications";
import { uid, dateKey } from "./utils";

interface CommandState {
  hydrated: boolean;
  events: EventItem[];
  notes: VoiceNote[];

  // UI
  activeTab: TabKey;
  selectedDate: string;
  editorOpen: boolean;
  editingEvent: EventItem | null;
  /** Borrador prellenado para un evento nuevo (p. ej. creado desde una nota) */
  draftEvent: Partial<EventItem> | null;

  // lifecycle
  hydrate: () => Promise<void>;

  // events
  saveEvent: (input: Omit<EventItem, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;

  // notes
  addNote: (note: Omit<VoiceNote, "id" | "createdAt">) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  linkNoteToDate: (id: string, date: string) => Promise<void>;

  // UI actions
  setTab: (tab: TabKey) => void;
  setSelectedDate: (date: string) => void;
  openEditor: (event?: EventItem | null, presetDate?: string) => void;
  openEditorDraft: (draft: Partial<EventItem>) => void;
  closeEditor: () => void;
}

function reschedule(events: EventItem[]) {
  scheduleReminders(events);
}

export const useStore = create<CommandState>((set, get) => ({
  hydrated: false,
  events: [],
  notes: [],
  activeTab: "today",
  selectedDate: dateKey(new Date()),
  editorOpen: false,
  editingEvent: null,
  draftEvent: null,

  hydrate: async () => {
    if (get().hydrated) return;
    const [events, notes] = await Promise.all([
      db.getAllEvents(),
      db.getAllNotes(),
    ]);
    set({ events, notes, hydrated: true });
    reschedule(events);
  },

  saveEvent: async (input) => {
    const existing = input.id
      ? get().events.find((e) => e.id === input.id)
      : null;
    const event: EventItem = {
      ...input,
      id: input.id ?? uid(),
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await db.putEvent(event);
    const events = existing
      ? get().events.map((e) => (e.id === event.id ? event : e))
      : [...get().events, event];
    set({ events, editorOpen: false, editingEvent: null });
    reschedule(events);
  },

  removeEvent: async (id) => {
    await db.deleteEvent(id);
    const events = get().events.filter((e) => e.id !== id);
    set({ events });
    reschedule(events);
  },

  addNote: async (note) => {
    const full: VoiceNote = { ...note, id: uid(), createdAt: Date.now() };
    await db.putNote(full);
    set({ notes: [full, ...get().notes] });
  },

  removeNote: async (id) => {
    await db.deleteNote(id);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },

  togglePinNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, pinned: !note.pinned };
    await db.putNote(updated);
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) });
  },

  linkNoteToDate: async (id, date) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, linkedDate: date };
    await db.putNote(updated);
    set({ notes: get().notes.map((n) => (n.id === id ? updated : n)) });
  },

  setTab: (tab) => set({ activeTab: tab }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  openEditor: (event = null, presetDate) =>
    set({
      editorOpen: true,
      editingEvent: event,
      draftEvent: null,
      selectedDate: presetDate ?? get().selectedDate,
    }),
  openEditorDraft: (draft) =>
    set({
      editorOpen: true,
      editingEvent: null,
      draftEvent: draft,
      selectedDate: draft.date ?? get().selectedDate,
    }),
  closeEditor: () =>
    set({ editorOpen: false, editingEvent: null, draftEvent: null }),
}));
