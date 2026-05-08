// Mirror of src-tauri/src/domain.rs — keep in sync.

export type CaseKind = "Person" | "Cyber" | "Brand" | "Custom";
export type CaseStatus = "Active" | "Idle" | "Archived";
export type Accent = "ember" | "solar" | "moss" | "ink";

export type Case = {
  id: string;
  kind: CaseKind;
  title: string;
  status: CaseStatus;
  legalBasis: string | null;
  accent: Accent;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  entityCount: number;
  relationCount: number;
};

export type NewCase = {
  kind: CaseKind;
  title: string;
  legalBasis?: string | null;
  accent?: Accent;
};

export type Entity = {
  id: string;
  caseId: string;
  kind: string;
  label: string;
  attributes: Record<string, unknown>;
  confidence: number;
  source: string;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
};

export type NewEntity = {
  caseId: string;
  kind: string;
  label: string;
  attributes?: Record<string, unknown>;
  confidence?: number;
  source?: string;
};

export type Relation = {
  id: string;
  caseId: string;
  fromEntity: string;
  toEntity: string;
  kind: string;
  attributes: Record<string, unknown>;
  confidence: number;
  firstSeen: string;
  lastSeen: string | null;
  createdAt: string;
};

export type NewRelation = {
  caseId: string;
  fromEntity: string;
  toEntity: string;
  kind: string;
  attributes?: Record<string, unknown>;
};

export type Event = {
  id: number;
  caseId: string;
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
  ts: string;
  prevHash: string;
  hash: string;
};

export type AppInfo = {
  name: string;
  version: string;
  edition: string;
  vaultPath: string;
};
