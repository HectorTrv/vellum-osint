import { create } from "zustand";
import { api, isTauri } from "@/lib/api";
import type { Case, NewCase, CaseStatus } from "@/lib/types";
import { toast } from "@/lib/toasts";
import { MOCK_CASES } from "@/lib/mockData";

export type SortKey = "updated" | "alpha" | "kind" | "size";
export type Density = "comfortable" | "compact";

const PIN_KEY = "vellum.pinned.v1";
const PREF_KEY = "vellum.prefs.v1";

function loadPins(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function savePins(s: Set<string>) {
  try {
    localStorage.setItem(PIN_KEY, JSON.stringify(Array.from(s)));
  } catch {}
}

function loadPrefs(): { sort: SortKey; density: Density } {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : { sort: "updated", density: "comfortable" };
  } catch {
    return { sort: "updated", density: "comfortable" };
  }
}
function savePrefs(p: { sort: SortKey; density: Density }) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
}

type CasesState = {
  cases: Case[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  initialized: boolean;
  pinned: Set<string>;
  sort: SortKey;
  density: Density;

  refresh: () => Promise<void>;
  create: (input: NewCase) => Promise<Case>;
  setStatus: (id: string, status: CaseStatus) => Promise<void>;
  archive: (id: string) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  togglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  select: (id: string | null) => void;
  setSort: (s: SortKey) => void;
  setDensity: (d: Density) => void;
};

export const useCases = create<CasesState>((set, get) => {
  const prefs = typeof window !== "undefined" ? loadPrefs() : { sort: "updated" as SortKey, density: "comfortable" as Density };
  const pinned = typeof window !== "undefined" ? loadPins() : new Set<string>();
  return {
    cases: [],
    loading: false,
    error: null,
    selectedId: null,
    initialized: false,
    pinned,
    sort: prefs.sort,
    density: prefs.density,

    refresh: async () => {
      set({ loading: true, error: null });
      try {
        const cases = isTauri ? await api.casesList() : MOCK_CASES;
        set({ cases, loading: false, initialized: true });
      } catch (e: unknown) {
        set({ error: String(e), loading: false, initialized: true });
      }
    },

    create: async (input) => {
      if (!isTauri) {
        const c: Case = {
          id: `mock-${Date.now()}`,
          kind: input.kind,
          title: input.title,
          status: "Active",
          legalBasis: input.legalBasis ?? null,
          accent: input.accent ?? "ember",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archivedAt: null,
          entityCount: 0,
          relationCount: 0,
        };
        set({ cases: [c, ...get().cases] });
        return c;
      }
      const c = await api.caseCreate(input);
      set({ cases: [c, ...get().cases] });
      return c;
    },

    setStatus: async (id, status) => {
      if (!isTauri) {
        set({
          cases: get().cases.map((c) =>
            c.id === id
              ? { ...c, status, archivedAt: status === "Archived" ? new Date().toISOString() : null }
              : c
          ),
        });
        return;
      }
      const updated = await api.caseSetStatus(id, status);
      set({ cases: get().cases.map((c) => (c.id === id ? updated : c)) });
    },

    archive: async (id) => {
      const before = get().cases.find((c) => c.id === id);
      if (!before) return;
      const wasArchived = before.status === "Archived";
      const next: CaseStatus = wasArchived ? "Active" : "Archived";
      await get().setStatus(id, next);
      toast.withUndo(
        wasArchived ? "Case restored" : "Case archived",
        () => {
          // Undo
          get().setStatus(id, before.status);
        },
        before.title
      );
    },

    rename: async (id, title) => {
      if (!isTauri) {
        set({ cases: get().cases.map((c) => (c.id === id ? { ...c, title } : c)) });
        return;
      }
      const updated = await api.caseRename(id, title);
      set({ cases: get().cases.map((c) => (c.id === id ? updated : c)) });
    },

    togglePin: (id) => {
      const next = new Set(get().pinned);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      set({ pinned: next });
      savePins(next);
    },

    isPinned: (id) => get().pinned.has(id),

    select: (id) => set({ selectedId: id }),

    setSort: (sort) => {
      set({ sort });
      savePrefs({ sort, density: get().density });
    },

    setDensity: (density) => {
      set({ density });
      savePrefs({ sort: get().sort, density });
    },
  };
});

/** Sort cases: pinned first, then by chosen criterion. */
export function sortCases(cases: Case[], pinned: Set<string>, key: SortKey): Case[] {
  const cmp = (a: Case, b: Case): number => {
    const ap = pinned.has(a.id) ? 1 : 0;
    const bp = pinned.has(b.id) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    // Archived cases drop to bottom regardless
    const aa = a.status === "Archived" ? 1 : 0;
    const ba = b.status === "Archived" ? 1 : 0;
    if (aa !== ba) return aa - ba;
    switch (key) {
      case "alpha":
        return a.title.localeCompare(b.title);
      case "kind":
        return a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title);
      case "size":
        return b.entityCount - a.entityCount;
      case "updated":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  };
  return [...cases].sort(cmp);
}
