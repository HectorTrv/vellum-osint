import { create } from "zustand";
import { api, isTauri } from "@/lib/api";
import type { Entity, Event, NewEntity, Relation } from "@/lib/types";
import { MOCK_ENTITIES, MOCK_RELATIONS, MOCK_EVENTS } from "@/lib/mockData";

function mock(id: string, caseId: string, kind: string, label: string, attrs: Record<string, unknown> = {}): Entity {
  const ts = new Date().toISOString();
  return {
    id, caseId, kind, label,
    attributes: attrs,
    confidence: 0.9,
    source: "manual",
    firstSeen: ts, lastSeen: ts, createdAt: ts,
  };
}

type State = {
  byCase: Record<string, { entities: Entity[]; relations: Relation[]; events: Event[]; loading: boolean; error: string | null }>;

  load: (caseId: string) => Promise<void>;
  createEntity: (input: NewEntity) => Promise<Entity>;
  deleteEntity: (id: string, caseId: string) => Promise<void>;
};

export const useEntities = create<State>((set, get) => ({
  byCase: {},

  load: async (caseId) => {
    set({
      byCase: { ...get().byCase, [caseId]: { ...(get().byCase[caseId] ?? { entities: [], relations: [], events: [] }), loading: true, error: null } },
    });
    try {
      if (isTauri) {
        const [entities, relations, events] = await Promise.all([
          api.entitiesList(caseId),
          api.relationsList(caseId),
          api.eventsList(caseId),
        ]);
        set({ byCase: { ...get().byCase, [caseId]: { entities, relations, events, loading: false, error: null } } });
      } else {
        set({
          byCase: {
            ...get().byCase,
            [caseId]: {
              entities: MOCK_ENTITIES[caseId] ?? [],
              relations: MOCK_RELATIONS[caseId] ?? [],
              events: MOCK_EVENTS[caseId] ?? [],
              loading: false,
              error: null,
            },
          },
        });
      }
    } catch (e) {
      set({
        byCase: {
          ...get().byCase,
          [caseId]: { ...(get().byCase[caseId] ?? { entities: [], relations: [], events: [] }), loading: false, error: String(e) },
        },
      });
    }
  },

  createEntity: async (input) => {
    if (!isTauri) {
      const e = mock(`me-${Date.now()}`, input.caseId, input.kind, input.label, input.attributes ?? {});
      const cur = get().byCase[input.caseId] ?? { entities: [], relations: [], events: [], loading: false, error: null };
      set({ byCase: { ...get().byCase, [input.caseId]: { ...cur, entities: [e, ...cur.entities] } } });
      return e;
    }
    const e = await api.entityCreate(input);
    const cur = get().byCase[input.caseId] ?? { entities: [], relations: [], events: [], loading: false, error: null };
    set({ byCase: { ...get().byCase, [input.caseId]: { ...cur, entities: [e, ...cur.entities] } } });
    return e;
  },

  deleteEntity: async (id, caseId) => {
    if (isTauri) await api.entityDelete(id);
    const cur = get().byCase[caseId] ?? { entities: [], relations: [], events: [], loading: false, error: null };
    set({
      byCase: {
        ...get().byCase,
        [caseId]: { ...cur, entities: cur.entities.filter((e) => e.id !== id) },
      },
    });
  },
}));
