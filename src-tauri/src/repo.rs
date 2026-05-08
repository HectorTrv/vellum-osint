//! Repository — CRUD on cases, entities, relations.
//!
//! Every mutating fn appends a forensic event in the same transaction.

use crate::domain::*;
use crate::error::{Error, Result};
use crate::ledger;
use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde_json::json;
use uuid::Uuid;

const ACTOR: &str = "local@vellum";

fn now() -> DateTime<Utc> { Utc::now() }
fn new_id() -> String { Uuid::new_v4().to_string() }

// ─── Cases ──────────────────────────────────────────────

pub fn list_cases(conn: &Connection) -> Result<Vec<Case>> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.kind, c.title, c.status, c.legal_basis, c.accent,
                c.created_at, c.updated_at, c.archived_at,
                (SELECT count(*) FROM entities e  WHERE e.case_id = c.id AND e.deleted_at IS NULL),
                (SELECT count(*) FROM relations r WHERE r.case_id = c.id AND r.deleted_at IS NULL)
         FROM cases c
         ORDER BY (c.status = 'Archived') ASC, c.updated_at DESC",
    )?;
    let rows = stmt.query_map([], |r| {
        Ok(Case {
            id: r.get(0)?,
            kind: r.get(1)?,
            title: r.get(2)?,
            status: r.get(3)?,
            legal_basis: r.get(4)?,
            accent: r.get(5)?,
            created_at: parse_ts(&r.get::<_, String>(6)?),
            updated_at: parse_ts(&r.get::<_, String>(7)?),
            archived_at: r.get::<_, Option<String>>(8)?.map(|s| parse_ts(&s)),
            entity_count: r.get(9)?,
            relation_count: r.get(10)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

pub fn get_case(conn: &Connection, id: &str) -> Result<Case> {
    let mut stmt = conn.prepare(
        "SELECT c.id, c.kind, c.title, c.status, c.legal_basis, c.accent,
                c.created_at, c.updated_at, c.archived_at,
                (SELECT count(*) FROM entities e  WHERE e.case_id = c.id AND e.deleted_at IS NULL),
                (SELECT count(*) FROM relations r WHERE r.case_id = c.id AND r.deleted_at IS NULL)
         FROM cases c WHERE c.id = ?1",
    )?;
    stmt.query_row(params![id], |r| {
        Ok(Case {
            id: r.get(0)?,
            kind: r.get(1)?,
            title: r.get(2)?,
            status: r.get(3)?,
            legal_basis: r.get(4)?,
            accent: r.get(5)?,
            created_at: parse_ts(&r.get::<_, String>(6)?),
            updated_at: parse_ts(&r.get::<_, String>(7)?),
            archived_at: r.get::<_, Option<String>>(8)?.map(|s| parse_ts(&s)),
            entity_count: r.get(9)?,
            relation_count: r.get(10)?,
        })
    })
    .optional()?
    .ok_or_else(|| Error::NotFound(format!("case {id}")))
}

pub fn create_case(conn: &mut Connection, hmac_key: &[u8; 32], input: NewCase) -> Result<Case> {
    if CaseKind::parse(&input.kind).is_none() {
        return Err(Error::Invalid(format!("CaseKind '{}' invalid", input.kind)));
    }
    if input.title.trim().is_empty() {
        return Err(Error::Invalid("title required".into()));
    }
    let id = new_id();
    let ts = now();
    let ts_str = ts.to_rfc3339();
    let accent = input.accent.unwrap_or_else(|| "ember".into());

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO cases (id, kind, title, status, legal_basis, accent, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'Active', ?4, ?5, ?6, ?6)",
        params![id, input.kind, input.title.trim(), input.legal_basis, accent, ts_str],
    )?;
    ledger::append(
        &tx,
        hmac_key,
        &id,
        "case.create",
        ACTOR,
        &json!({ "id": id, "kind": input.kind, "title": input.title, "legal_basis": input.legal_basis }),
    )?;
    tx.commit()?;
    get_case(conn, &id)
}

pub fn update_case_status(
    conn: &mut Connection,
    hmac_key: &[u8; 32],
    id: &str,
    status: &str,
) -> Result<Case> {
    let valid = matches!(status, "Active" | "Idle" | "Archived");
    if !valid { return Err(Error::Invalid(format!("status '{status}'"))); }
    let ts = now().to_rfc3339();
    let tx = conn.transaction()?;
    let archived_at = if status == "Archived" { Some(ts.clone()) } else { None::<String> };
    let n = tx.execute(
        "UPDATE cases SET status=?1, archived_at=?2, updated_at=?3 WHERE id=?4",
        params![status, archived_at, ts, id],
    )?;
    if n == 0 { return Err(Error::NotFound(format!("case {id}"))); }
    ledger::append(&tx, hmac_key, id, "case.status", ACTOR, &json!({ "status": status }))?;
    tx.commit()?;
    get_case(conn, id)
}

pub fn rename_case(conn: &mut Connection, hmac_key: &[u8; 32], id: &str, title: &str) -> Result<Case> {
    if title.trim().is_empty() { return Err(Error::Invalid("title required".into())); }
    let ts = now().to_rfc3339();
    let tx = conn.transaction()?;
    let n = tx.execute(
        "UPDATE cases SET title=?1, updated_at=?2 WHERE id=?3",
        params![title.trim(), ts, id],
    )?;
    if n == 0 { return Err(Error::NotFound(format!("case {id}"))); }
    ledger::append(&tx, hmac_key, id, "case.rename", ACTOR, &json!({ "title": title }))?;
    tx.commit()?;
    get_case(conn, id)
}

// ─── Entities ───────────────────────────────────────────

pub fn list_entities(conn: &Connection, case_id: &str) -> Result<Vec<Entity>> {
    let mut stmt = conn.prepare(
        "SELECT id, case_id, kind, label, attributes_json, confidence, source,
                first_seen, last_seen, created_at
         FROM entities
         WHERE case_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map(params![case_id], |r| {
        let attrs: String = r.get(4)?;
        Ok(Entity {
            id: r.get(0)?,
            case_id: r.get(1)?,
            kind: r.get(2)?,
            label: r.get(3)?,
            attributes: serde_json::from_str(&attrs).unwrap_or(json!({})),
            confidence: r.get(5)?,
            source: r.get(6)?,
            first_seen: parse_ts(&r.get::<_, String>(7)?),
            last_seen: parse_ts(&r.get::<_, String>(8)?),
            created_at: parse_ts(&r.get::<_, String>(9)?),
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

pub fn create_entity(conn: &mut Connection, hmac_key: &[u8; 32], input: NewEntity) -> Result<Entity> {
    if input.label.trim().is_empty() { return Err(Error::Invalid("label required".into())); }
    let id = new_id();
    let ts = now();
    let ts_str = ts.to_rfc3339();
    let attrs = input.attributes.unwrap_or(json!({}));
    let attrs_str = serde_json::to_string(&attrs)?;
    let confidence = input.confidence.unwrap_or(1.0).clamp(0.0, 1.0);
    let source = input.source.unwrap_or_else(|| "manual".into());

    let tx = conn.transaction()?;
    // case must exist
    tx.query_row("SELECT 1 FROM cases WHERE id = ?1", params![input.case_id], |_| Ok(()))
        .optional()?
        .ok_or_else(|| Error::NotFound(format!("case {}", input.case_id)))?;

    tx.execute(
        "INSERT INTO entities (id, case_id, kind, label, attributes_json, confidence, source,
                               first_seen, last_seen, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?8)",
        params![id, input.case_id, input.kind, input.label.trim(), attrs_str, confidence, source, ts_str],
    )?;
    ledger::append(
        &tx,
        hmac_key,
        &input.case_id,
        "entity.create",
        ACTOR,
        &json!({ "id": id, "kind": input.kind, "label": input.label }),
    )?;
    // Bump case updated_at
    tx.execute("UPDATE cases SET updated_at=?1 WHERE id=?2", params![ts_str, input.case_id])?;
    tx.commit()?;

    Ok(Entity {
        id,
        case_id: input.case_id,
        kind: input.kind,
        label: input.label,
        attributes: attrs,
        confidence,
        source,
        first_seen: ts,
        last_seen: ts,
        created_at: ts,
    })
}

pub fn delete_entity(conn: &mut Connection, hmac_key: &[u8; 32], id: &str) -> Result<()> {
    let ts = now().to_rfc3339();
    let tx = conn.transaction()?;
    let case_id: Option<String> = tx
        .query_row("SELECT case_id FROM entities WHERE id = ?1", params![id], |r| r.get(0))
        .optional()?;
    let case_id = case_id.ok_or_else(|| Error::NotFound(format!("entity {id}")))?;
    tx.execute("UPDATE entities SET deleted_at=?1 WHERE id=?2", params![ts, id])?;
    ledger::append(&tx, hmac_key, &case_id, "entity.delete", ACTOR, &json!({ "id": id }))?;
    tx.commit()?;
    Ok(())
}

// ─── Relations ──────────────────────────────────────────

pub fn list_relations(conn: &Connection, case_id: &str) -> Result<Vec<Relation>> {
    let mut stmt = conn.prepare(
        "SELECT id, case_id, from_entity, to_entity, kind, attributes_json, confidence,
                first_seen, last_seen, created_at
         FROM relations
         WHERE case_id = ?1 AND deleted_at IS NULL
         ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map(params![case_id], |r| {
        let attrs: String = r.get(5)?;
        Ok(Relation {
            id: r.get(0)?,
            case_id: r.get(1)?,
            from_entity: r.get(2)?,
            to_entity: r.get(3)?,
            kind: r.get(4)?,
            attributes: serde_json::from_str(&attrs).unwrap_or(json!({})),
            confidence: r.get(6)?,
            first_seen: parse_ts(&r.get::<_, String>(7)?),
            last_seen: r.get::<_, Option<String>>(8)?.map(|s| parse_ts(&s)),
            created_at: parse_ts(&r.get::<_, String>(9)?),
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

pub fn create_relation(conn: &mut Connection, hmac_key: &[u8; 32], input: NewRelation) -> Result<Relation> {
    let id = new_id();
    let ts = now();
    let ts_str = ts.to_rfc3339();
    let attrs = input.attributes.unwrap_or(json!({}));
    let attrs_str = serde_json::to_string(&attrs)?;

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO relations (id, case_id, from_entity, to_entity, kind, attributes_json,
                                confidence, first_seen, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1.0, ?7, ?7)",
        params![id, input.case_id, input.from_entity, input.to_entity, input.kind, attrs_str, ts_str],
    )?;
    ledger::append(
        &tx,
        hmac_key,
        &input.case_id,
        "relation.create",
        ACTOR,
        &json!({ "id": id, "from": input.from_entity, "to": input.to_entity, "kind": input.kind }),
    )?;
    tx.execute("UPDATE cases SET updated_at=?1 WHERE id=?2", params![ts_str, input.case_id])?;
    tx.commit()?;

    Ok(Relation {
        id,
        case_id: input.case_id,
        from_entity: input.from_entity,
        to_entity: input.to_entity,
        kind: input.kind,
        attributes: attrs,
        confidence: 1.0,
        first_seen: ts,
        last_seen: None,
        created_at: ts,
    })
}

// ─── Events (read-only) ─────────────────────────────────

pub fn list_events(conn: &Connection, case_id: &str) -> Result<Vec<Event>> {
    let mut stmt = conn.prepare(
        "SELECT id, case_id, kind, actor, payload_json, ts, prev_hash, hash
         FROM events WHERE case_id = ?1 ORDER BY id ASC",
    )?;
    let rows = stmt.query_map(params![case_id], |r| {
        let payload: String = r.get(4)?;
        Ok(Event {
            id: r.get(0)?,
            case_id: r.get(1)?,
            kind: r.get(2)?,
            actor: r.get(3)?,
            payload: serde_json::from_str(&payload).unwrap_or(json!({})),
            ts: parse_ts(&r.get::<_, String>(5)?),
            prev_hash: r.get(6)?,
            hash: r.get(7)?,
        })
    })?;
    rows.collect::<rusqlite::Result<Vec<_>>>().map_err(Into::into)
}

// ─── helpers ────────────────────────────────────────────

fn parse_ts(s: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(s)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}
