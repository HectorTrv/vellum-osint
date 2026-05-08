import { api, isTauri } from "@/lib/api";
import { useCases } from "@/lib/casesStore";
import type { Case } from "@/lib/types";

/**
 * Create a richly-populated demo case so brand-new users can explore the app
 * without doing any data entry first.
 *
 * Tauri mode: creates real DB rows + emits real ledger events.
 * Web mode:   pushes a single mock case with inflated counts to the store.
 */
export async function createDemoCase(): Promise<Case> {
  const store = useCases.getState();

  if (!isTauri) {
    const c: Case = {
      id: `mock-demo-${Date.now()}`,
      kind: "Cyber",
      title: "Demo · Threat Actor — Vermilion",
      status: "Active",
      legalBasis: "ctf",
      accent: "ember",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      entityCount: 5,
      relationCount: 3,
    };
    useCases.setState({ cases: [c, ...useCases.getState().cases] });
    return c;
  }

  // Real Tauri mode — persist case + 5 entities + 3 relations
  const c = await store.create({
    kind: "Cyber",
    title: "Demo · Threat Actor — Vermilion",
    accent: "ember",
    legalBasis: "ctf",
  });

  const j  = await api.entityCreate({ caseId: c.id, kind: "Person",   label: "J. Doe",            confidence: 0.9 });
  const e  = await api.entityCreate({ caseId: c.id, kind: "Email",    label: "j.doe@x.com",       confidence: 1.0 });
  const u  = await api.entityCreate({ caseId: c.id, kind: "Username", label: "@vermilion_99",     confidence: 0.95 });
  const d  = await api.entityCreate({ caseId: c.id, kind: "Domain",   label: "vermilion.run",     confidence: 1.0 });
  await       api.entityCreate({ caseId: c.id, kind: "IP",       label: "185.220.101.42",    confidence: 0.85 });

  await api.relationCreate({ caseId: c.id, fromEntity: j.id, toEntity: e.id, kind: "owns" });
  await api.relationCreate({ caseId: c.id, fromEntity: j.id, toEntity: u.id, kind: "owns" });
  await api.relationCreate({ caseId: c.id, fromEntity: u.id, toEntity: d.id, kind: "registered" });

  await store.refresh();
  return c;
}
