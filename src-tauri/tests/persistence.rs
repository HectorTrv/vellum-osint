//! End-to-end persistence test: create case → entities → relations → events,
//! reopen vault, verify everything survived and the ledger chain is intact.

use serde_json::json;
use vellum_lib::domain::{NewCase, NewEntity, NewRelation};
use vellum_lib::ledger;
use vellum_lib::repo;
use vellum_lib::vault::Vault;

#[test]
fn end_to_end_persistence_and_ledger() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("vault.vlm");
    let master = [0xA5u8; 32];

    // ── First boot ────────────────────────────────────────
    let case_id;
    let entity_a;
    let entity_b;
    {
        let v = Vault::open_with_master(path.clone(), master).unwrap();
        let mut conn = v.db.lock();

        // 0 cases initially
        assert_eq!(repo::list_cases(&conn).unwrap().len(), 0);

        // create
        let c = repo::create_case(
            &mut conn,
            &v.hmac_key,
            NewCase { kind: "Cyber".into(), title: "Threat Actor — Vermilion".into(), legal_basis: Some("internal_security".into()), accent: Some("ember".into()) },
        )
        .unwrap();
        case_id = c.id.clone();
        assert_eq!(c.status, "Active");

        // entities
        let e1 = repo::create_entity(
            &mut conn,
            &v.hmac_key,
            NewEntity { case_id: case_id.clone(), kind: "Domain".into(), label: "vermilion.run".into(),
                        attributes: Some(json!({"tld":"run"})), confidence: Some(0.9), source: Some("manual".into()) },
        )
        .unwrap();
        let e2 = repo::create_entity(
            &mut conn,
            &v.hmac_key,
            NewEntity { case_id: case_id.clone(), kind: "IP".into(), label: "185.220.101.42".into(),
                        attributes: None, confidence: None, source: None },
        )
        .unwrap();
        entity_a = e1.id.clone();
        entity_b = e2.id.clone();

        // relation
        repo::create_relation(
            &mut conn,
            &v.hmac_key,
            NewRelation { case_id: case_id.clone(),
                          from_entity: entity_a.clone(), to_entity: entity_b.clone(),
                          kind: "RESOLVES_TO".into(), attributes: None },
        )
        .unwrap();

        // chain: 1 case + 2 entities + 1 relation = 4 events
        let events = repo::list_events(&conn, &case_id).unwrap();
        assert_eq!(events.len(), 4);
        assert_eq!(ledger::verify_chain(&conn, &v.hmac_key, &case_id).unwrap(), 4);
    }

    // ── Reopen ────────────────────────────────────────────
    {
        let v = Vault::open_with_master(path.clone(), master).unwrap();
        let conn = v.db.lock();

        let cases = repo::list_cases(&conn).unwrap();
        assert_eq!(cases.len(), 1);
        assert_eq!(cases[0].id, case_id);
        assert_eq!(cases[0].entity_count, 2);
        assert_eq!(cases[0].relation_count, 1);

        let entities = repo::list_entities(&conn, &case_id).unwrap();
        assert_eq!(entities.len(), 2);
        assert!(entities.iter().any(|e| e.id == entity_a && e.label == "vermilion.run"));
        assert!(entities.iter().any(|e| e.id == entity_b && e.label == "185.220.101.42"));

        let relations = repo::list_relations(&conn, &case_id).unwrap();
        assert_eq!(relations.len(), 1);
        assert_eq!(relations[0].kind, "RESOLVES_TO");

        // chain still intact
        assert_eq!(ledger::verify_chain(&conn, &v.hmac_key, &case_id).unwrap(), 4);
    }

    // ── Tamper detection ──────────────────────────────────
    {
        let v = Vault::open_with_master(path.clone(), master).unwrap();
        let conn = v.db.lock();
        // Disable triggers to inject a tampered row directly (this simulates an attacker
        // that bypasses the app and writes raw SQL).
        conn.execute("DROP TRIGGER IF EXISTS events_no_update", []).unwrap();
        conn.execute(
            "UPDATE events SET payload_json = '{\"tampered\":true}' WHERE id = (SELECT MIN(id) FROM events WHERE case_id = ?1)",
            rusqlite::params![case_id],
        )
        .unwrap();
        let err = ledger::verify_chain(&conn, &v.hmac_key, &case_id).unwrap_err();
        let msg = format!("{err}");
        assert!(msg.contains("hash mismatch"), "expected tamper detection, got: {msg}");
    }
}

#[test]
fn wrong_master_cannot_decrypt() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("vault.vlm");
    {
        let v = Vault::open_with_master(path.clone(), [0x11u8; 32]).unwrap();
        let mut conn = v.db.lock();
        repo::create_case(
            &mut conn,
            &v.hmac_key,
            NewCase { kind: "Person".into(), title: "Test".into(), legal_basis: None, accent: None },
        ).unwrap();
    }
    // Try to reopen with the wrong master — expect failure.
    let res = Vault::open_with_master(path.clone(), [0x22u8; 32]);
    assert!(res.is_err(), "wrong master must not decrypt; got Ok");
}
