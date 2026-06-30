import { create } from "zustand";
import type {
  EventItem,
  VoiceNote,
  StaffMember,
  Bill,
  TechItem,
  RsvpStatus,
  TabKey,
} from "./types";
import * as db from "./db";
import {
  scheduleReminders,
  scheduleStaffReminders,
  scheduleBillReminders,
} from "./notifications";
import { currentPeriodKey } from "./staff";
import { advanceDue } from "./bills";
import { mergeTechItems, REGION_DEFAULT, TOPICS_DEFAULT } from "./tech";
import { uid, dateKey, sha256 } from "./utils";

const PIN_META_KEY = "staffPinHash";
const REGION_META_KEY = "radarRegion";
const GEMINI_META_KEY = "geminiApiKey";

type StaffInput = Omit<StaffMember, "id" | "createdAt" | "payments"> & {
  id?: string;
};

type BillInput = Omit<Bill, "id" | "createdAt" | "payments"> & {
  id?: string;
};

interface RawTech {
  kind?: string;
  title: string;
  summary?: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  url?: string | null;
  source?: string | null;
  topics?: string[];
}

interface CommandState {
  hydrated: boolean;
  events: EventItem[];
  notes: VoiceNote[];
  staff: StaffMember[];
  bills: Bill[];

  // Equipo (UI + seguridad)
  staffEditorOpen: boolean;
  editingStaff: StaffMember | null;
  staffPinSet: boolean;
  staffUnlocked: boolean;

  // Pagos (UI)
  billEditorOpen: boolean;
  editingBill: Bill | null;

  // Radar (IA)
  techItems: TechItem[];
  techLoading: boolean;
  techError: string | null;
  radarRegion: string;
  geminiKey: string;

  // UI
  activeTab: TabKey;
  selectedDate: string;
  editorOpen: boolean;
  editingEvent: EventItem | null;
  /** Borrador prellenado para un evento nuevo (p. ej. creado desde una nota) */
  draftEvent: Partial<EventItem> | null;

  // lifecycle
  hydrate: () => Promise<void>;
  resetData: () => void;

  // events
  saveEvent: (input: Omit<EventItem, "id" | "createdAt"> & { id?: string }) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;

  // notes
  addNote: (
    note: Omit<VoiceNote, "id" | "createdAt" | "audioPath">,
    audioBlob?: Blob | null,
  ) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  linkNoteToDate: (id: string, date: string) => Promise<void>;

  // staff
  saveStaff: (input: StaffInput) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  toggleStaffPaid: (id: string) => Promise<void>;
  openStaffEditor: (member?: StaffMember | null) => void;
  closeStaffEditor: () => void;

  // staff PIN
  setStaffPin: (pin: string) => Promise<void>;
  removeStaffPin: () => Promise<void>;
  unlockStaff: (pin: string) => Promise<boolean>;

  // pagos
  saveBill: (input: BillInput) => Promise<void>;
  removeBill: (id: string) => Promise<void>;
  markBillPaid: (id: string) => Promise<void>;
  undoBillPayment: (id: string) => Promise<void>;
  openBillEditor: (bill?: Bill | null) => void;
  closeBillEditor: () => void;

  // radar
  discoverTech: () => Promise<void>;
  setTechRsvp: (id: string, status: RsvpStatus) => Promise<void>;
  removeTech: (id: string) => Promise<void>;
  setRadarRegion: (region: string) => Promise<void>;
  setGeminiKey: (key: string) => Promise<void>;

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
  staff: [],
  bills: [],
  staffEditorOpen: false,
  editingStaff: null,
  staffPinSet: false,
  staffUnlocked: false,
  billEditorOpen: false,
  editingBill: null,
  techItems: [],
  techLoading: false,
  techError: null,
  radarRegion: REGION_DEFAULT,
  geminiKey: "",
  activeTab: "today",
  selectedDate: dateKey(new Date()),
  editorOpen: false,
  editingEvent: null,
  draftEvent: null,

  hydrate: async () => {
    if (get().hydrated) return;
    const [events, notes, staff, bills, tech, pinHash, region, gemini] =
      await Promise.all([
        db.getAllEvents(),
        db.getAllNotes(),
        db.getAllStaff(),
        db.getAllBills(),
        db.getAllTech(),
        db.getMeta<string>(PIN_META_KEY),
        db.getMeta<string>(REGION_META_KEY),
        db.getMeta<string>(GEMINI_META_KEY),
      ]);
    set({
      events,
      notes,
      staff,
      bills,
      techItems: tech,
      staffPinSet: !!pinHash,
      radarRegion: region || REGION_DEFAULT,
      geminiKey: gemini || "",
      hydrated: true,
    });
    reschedule(events);
    scheduleStaffReminders(staff);
    scheduleBillReminders(bills);
  },

  resetData: () =>
    set({
      hydrated: false,
      events: [],
      notes: [],
      staff: [],
      bills: [],
      techItems: [],
      staffUnlocked: false,
      staffPinSet: false,
      geminiKey: "",
      radarRegion: REGION_DEFAULT,
      techError: null,
      activeTab: "today",
      editorOpen: false,
      editingEvent: null,
      draftEvent: null,
      staffEditorOpen: false,
      editingStaff: null,
      billEditorOpen: false,
      editingBill: null,
    }),

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

  addNote: async (note, audioBlob) => {
    const id = uid();
    let audioPath: string | undefined;
    if (audioBlob) audioPath = await db.uploadAudio(id, audioBlob);
    const full: VoiceNote = { ...note, id, audioPath, createdAt: Date.now() };
    await db.putNote(full);
    set({ notes: [full, ...get().notes] });
  },

  removeNote: async (id) => {
    const note = get().notes.find((nn) => nn.id === id);
    if (note?.audioPath) await db.deleteAudio(note.audioPath);
    await db.deleteNote(id);
    set({ notes: get().notes.filter((nn) => nn.id !== id) });
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

  saveStaff: async (input) => {
    const existing = input.id
      ? get().staff.find((m) => m.id === input.id)
      : null;
    const member: StaffMember = {
      ...input,
      id: input.id ?? uid(),
      payments: existing?.payments ?? [],
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await db.putStaff(member);
    const staff = existing
      ? get().staff.map((m) => (m.id === member.id ? member : m))
      : [...get().staff, member];
    set({ staff, staffEditorOpen: false, editingStaff: null });
    scheduleStaffReminders(staff);
  },

  removeStaff: async (id) => {
    await db.deleteStaff(id);
    const staff = get().staff.filter((m) => m.id !== id);
    set({ staff, staffEditorOpen: false, editingStaff: null });
    scheduleStaffReminders(staff);
  },

  toggleStaffPaid: async (id) => {
    const member = get().staff.find((m) => m.id === id);
    if (!member) return;
    const key = currentPeriodKey(member.payFrequency);
    const already = member.payments.some((p) => p.period === key);
    const payments = already
      ? member.payments.filter((p) => p.period !== key)
      : [
          ...member.payments,
          {
            id: uid(),
            date: dateKey(new Date()),
            amount: member.salary,
            period: key,
          },
        ];
    const updated = { ...member, payments };
    await db.putStaff(updated);
    set({ staff: get().staff.map((m) => (m.id === id ? updated : m)) });
  },

  openStaffEditor: (member = null) =>
    set({ staffEditorOpen: true, editingStaff: member }),
  closeStaffEditor: () => set({ staffEditorOpen: false, editingStaff: null }),

  setStaffPin: async (pin) => {
    const hash = await sha256(pin);
    await db.setMeta(PIN_META_KEY, hash);
    set({ staffPinSet: true, staffUnlocked: true });
  },
  removeStaffPin: async () => {
    await db.setMeta(PIN_META_KEY, null);
    set({ staffPinSet: false, staffUnlocked: true });
  },
  unlockStaff: async (pin) => {
    const hash = await sha256(pin);
    const stored = await db.getMeta<string>(PIN_META_KEY);
    if (stored && hash === stored) {
      set({ staffUnlocked: true });
      return true;
    }
    return false;
  },

  saveBill: async (input) => {
    const existing = input.id
      ? get().bills.find((b) => b.id === input.id)
      : null;
    const bill: Bill = {
      ...input,
      id: input.id ?? uid(),
      payments: existing?.payments ?? [],
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await db.putBill(bill);
    const bills = existing
      ? get().bills.map((b) => (b.id === bill.id ? bill : b))
      : [...get().bills, bill];
    set({ bills, billEditorOpen: false, editingBill: null });
    scheduleBillReminders(bills);
  },

  removeBill: async (id) => {
    await db.deleteBill(id);
    const bills = get().bills.filter((b) => b.id !== id);
    set({ bills, billEditorOpen: false, editingBill: null });
    scheduleBillReminders(bills);
  },

  markBillPaid: async (id) => {
    const bill = get().bills.find((b) => b.id === id);
    if (!bill) return;
    const payment = {
      id: uid(),
      date: dateKey(new Date()),
      amount: bill.amount,
      dueDate: bill.nextDueDate,
    };
    const nextDueDate =
      bill.frequency === "unico"
        ? bill.nextDueDate
        : advanceDue(bill.nextDueDate, bill.frequency);
    const updated = {
      ...bill,
      payments: [...bill.payments, payment],
      nextDueDate,
    };
    await db.putBill(updated);
    const bills = get().bills.map((b) => (b.id === id ? updated : b));
    set({ bills });
    scheduleBillReminders(bills);
  },

  undoBillPayment: async (id) => {
    const bill = get().bills.find((b) => b.id === id);
    if (!bill || bill.payments.length === 0) return;
    const last = bill.payments[bill.payments.length - 1];
    const updated = {
      ...bill,
      payments: bill.payments.slice(0, -1),
      nextDueDate: bill.frequency === "unico" ? bill.nextDueDate : last.dueDate,
    };
    await db.putBill(updated);
    const bills = get().bills.map((b) => (b.id === id ? updated : b));
    set({ bills });
    scheduleBillReminders(bills);
  },

  openBillEditor: (bill = null) =>
    set({ billEditorOpen: true, editingBill: bill }),
  closeBillEditor: () => set({ billEditorOpen: false, editingBill: null }),

  discoverTech: async () => {
    if (get().techLoading) return;
    set({ techLoading: true, techError: null });
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: get().radarRegion,
          topics: TOPICS_DEFAULT,
          apiKey: get().geminiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({
          techError: data?.error || "No se pudo actualizar el radar.",
          techLoading: false,
        });
        return;
      }
      const incoming: TechItem[] = ((data.items as RawTech[]) ?? []).map((r) => ({
        id: uid(),
        kind: r.kind === "news" ? "news" : "event",
        title: r.title,
        summary: r.summary ?? "",
        date: r.date ?? undefined,
        time: r.time ?? undefined,
        location: r.location ?? undefined,
        url: r.url ?? undefined,
        source: r.source ?? undefined,
        topics: r.topics ?? [],
        rsvp: null,
        createdAt: Date.now(),
      }));
      const merged = mergeTechItems(get().techItems, incoming);
      await db.putManyTech(merged);
      set({ techItems: merged, techLoading: false });
    } catch {
      set({ techError: "No se pudo conectar con el servidor.", techLoading: false });
    }
  },

  setTechRsvp: async (id, status) => {
    const item = get().techItems.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, rsvp: item.rsvp === status ? null : status };
    await db.putTech(updated);
    set({ techItems: get().techItems.map((i) => (i.id === id ? updated : i)) });
  },

  removeTech: async (id) => {
    await db.deleteTech(id);
    set({ techItems: get().techItems.filter((i) => i.id !== id) });
  },

  setRadarRegion: async (region) => {
    await db.setMeta(REGION_META_KEY, region);
    set({ radarRegion: region });
  },

  setGeminiKey: async (key) => {
    await db.setMeta(GEMINI_META_KEY, key);
    set({ geminiKey: key });
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
