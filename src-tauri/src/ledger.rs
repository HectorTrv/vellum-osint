//! Forensic ledger — append-only, HMAC-chained per case.
//!
//! Each event's `hash = HMAC_SHA256(hmac_key, prev_hash || ts || kind || actor || payload_json)`.
//! `prev_hash` for the first event in a case is 64 zero hex chars.
//!
//! Tampering with any past row breaks the chain — `verify_chain` recomputes and fails on mismatch.

use crate::domain::Event;
use crate::error::{Error, Result};
use chrono::Utc;
use hmac::{Hmac, Mac};
use rusqlite::{params, Connection};
use sha2::Sha256;

const ZERO_HASH: &str = "0000000000000000000000000000000000000000000000000000000000000000";

pub fn append(
    conn: &Connection,
    hmac_key: &[u8; 32],
    case_id: &str,
    kind: &str,
    actor: &str,
    payload: &serde_json::Value,
) -> Result<Event> {
    let payload_json = serde_json::to_string(payload)?;
    let ts = Utc::now();
    let ts_str = ts.to_rfc3339();

    let prev_hash: String = conn
        .query_row(
            "SELECT hash FROM events WHERE case_id = ?1 ORDER BY id DESC LIMIT 1",
            params![case_id],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| ZERO_HASH.to_string());

    let hash = compute(hmac_key, &prev_hash, &ts_str, kind, actor, &payload_json);

    let id = conn.query_row(
        "INSERT INTO events (case_id, kind, actor, payload_json, ts, prev_hash, hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING id",
        params![case_id, kind, actor, payload_json, ts_str, prev_hash, hash],
        |r| r.get::<_, i64>(0),
    )?;

    Ok(Event {
        id,
        case_id: case_id.to_string(),
        kind: kind.to_string(),
        actor: actor.to_string(),
        payload: payload.clone(),
        ts,
        prev_hash,
        hash,
    })
}

pub fn verify_chain(conn: &Connection, hmac_key: &[u8; 32], case_id: &str) -> Result<usize> {
    let mut stmt = conn.prepare(
        "SELECT ts, kind, actor, payload_json, prev_hash, hash
         FROM events WHERE case_id = ?1 ORDER BY id ASC",
    )?;
    let rows = stmt.query_map(params![case_id], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, String>(2)?,
            r.get::<_, String>(3)?,
            r.get::<_, String>(4)?,
            r.get::<_, String>(5)?,
        ))
    })?;

    let mut expected_prev = ZERO_HASH.to_string();
    let mut count = 0usize;
    for row in rows {
        let (ts, kind, actor, payload_json, prev_hash, hash) = row?;
        if prev_hash != expected_prev {
            return Err(Error::LedgerBroken(format!(
                "prev_hash mismatch at event #{} (case {})",
                count + 1,
                case_id
            )));
        }
        let recomputed = compute(hmac_key, &prev_hash, &ts, &kind, &actor, &payload_json);
        if recomputed != hash {
            return Err(Error::LedgerBroken(format!(
                "hash mismatch at event #{} (case {})",
                count + 1,
                case_id
            )));
        }
        expected_prev = hash;
        count += 1;
    }
    Ok(count)
}

fn compute(
    hmac_key: &[u8; 32],
    prev_hash: &str,
    ts: &str,
    kind: &str,
    actor: &str,
    payload_json: &str,
) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(hmac_key).expect("hmac key");
    mac.update(prev_hash.as_bytes());
    mac.update(b"|");
    mac.update(ts.as_bytes());
    mac.update(b"|");
    mac.update(kind.as_bytes());
    mac.update(b"|");
    mac.update(actor.as_bytes());
    mac.update(b"|");
    mac.update(payload_json.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}
