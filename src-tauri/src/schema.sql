-- Vellum vault schema · v1
-- Idempotent — safe to run on every open.

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
);
INSERT OR IGNORE INTO schema_version (version) VALUES (1);

-- ─── Cases ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id          TEXT    PRIMARY KEY,
  kind        TEXT    NOT NULL CHECK(kind IN ('Person','Cyber','Brand','Custom')),
  title       TEXT    NOT NULL,
  status      TEXT    NOT NULL CHECK(status IN ('Active','Idle','Archived')) DEFAULT 'Active',
  legal_basis TEXT,
  accent      TEXT    NOT NULL DEFAULT 'ember',
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_kind   ON cases(kind);

-- ─── Entities ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entities (
  id              TEXT    PRIMARY KEY,
  case_id         TEXT    NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind            TEXT    NOT NULL,
  label           TEXT    NOT NULL,
  attributes_json TEXT    NOT NULL DEFAULT '{}',
  confidence      REAL    NOT NULL DEFAULT 1.0 CHECK(confidence >= 0 AND confidence <= 1),
  source          TEXT    NOT NULL DEFAULT 'manual',
  first_seen      TEXT    NOT NULL,
  last_seen       TEXT    NOT NULL,
  created_at      TEXT    NOT NULL,
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_entities_case ON entities(case_id);
CREATE INDEX IF NOT EXISTS idx_entities_kind ON entities(kind);

-- ─── Relations (typed edges) ────────────────────────────
CREATE TABLE IF NOT EXISTS relations (
  id              TEXT    PRIMARY KEY,
  case_id         TEXT    NOT NULL REFERENCES cases(id)     ON DELETE CASCADE,
  from_entity     TEXT    NOT NULL REFERENCES entities(id)  ON DELETE CASCADE,
  to_entity       TEXT    NOT NULL REFERENCES entities(id)  ON DELETE CASCADE,
  kind            TEXT    NOT NULL,
  attributes_json TEXT    NOT NULL DEFAULT '{}',
  confidence      REAL    NOT NULL DEFAULT 1.0,
  first_seen      TEXT    NOT NULL,
  last_seen       TEXT,
  created_at      TEXT    NOT NULL,
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_relations_case ON relations(case_id);
CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_entity);
CREATE INDEX IF NOT EXISTS idx_relations_to   ON relations(to_entity);

-- ─── Forensic ledger (append-only, HMAC-chained) ────────
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id      TEXT    NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind         TEXT    NOT NULL,
  actor        TEXT    NOT NULL,
  payload_json TEXT    NOT NULL DEFAULT '{}',
  ts           TEXT    NOT NULL,
  prev_hash    TEXT    NOT NULL,
  hash         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_case_ts ON events(case_id, ts);

-- Block UPDATE/DELETE on the ledger — append-only.
CREATE TRIGGER IF NOT EXISTS events_no_update
  BEFORE UPDATE ON events
  BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;
CREATE TRIGGER IF NOT EXISTS events_no_delete
  BEFORE DELETE ON events
  BEGIN SELECT RAISE(ABORT, 'ledger is append-only'); END;

-- ─── Notes (markdown, attached to case or entity) ───────
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  case_id    TEXT NOT NULL REFERENCES cases(id)    ON DELETE CASCADE,
  entity_id  TEXT          REFERENCES entities(id) ON DELETE SET NULL,
  body_md    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_case ON notes(case_id);
