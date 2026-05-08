//! IPC commands — exposed to the React side via `invoke()`.

use crate::domain::*;
use crate::error::Result;
use crate::ledger;
use crate::repo;
use crate::vault::Vault;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub edition: &'static str,
    pub vault_path: String,
}

#[tauri::command]
pub fn app_info(vault: State<'_, Vault>) -> AppInfo {
    AppInfo {
        name: "Vellum",
        version: env!("CARGO_PKG_VERSION"),
        edition: "Issue 001",
        vault_path: vault.vault_path.display().to_string(),
    }
}

#[tauri::command]
pub fn cases_list(vault: State<'_, Vault>) -> Result<Vec<Case>> {
    let conn = vault.db.lock();
    repo::list_cases(&conn)
}

#[tauri::command]
pub fn case_create(vault: State<'_, Vault>, input: NewCase) -> Result<Case> {
    let mut conn = vault.db.lock();
    repo::create_case(&mut conn, &vault.hmac_key, input)
}

#[tauri::command]
pub fn case_get(vault: State<'_, Vault>, id: String) -> Result<Case> {
    let conn = vault.db.lock();
    repo::get_case(&conn, &id)
}

#[tauri::command]
pub fn case_set_status(vault: State<'_, Vault>, id: String, status: String) -> Result<Case> {
    let mut conn = vault.db.lock();
    repo::update_case_status(&mut conn, &vault.hmac_key, &id, &status)
}

#[tauri::command]
pub fn case_rename(vault: State<'_, Vault>, id: String, title: String) -> Result<Case> {
    let mut conn = vault.db.lock();
    repo::rename_case(&mut conn, &vault.hmac_key, &id, &title)
}

#[tauri::command]
pub fn entities_list(vault: State<'_, Vault>, case_id: String) -> Result<Vec<Entity>> {
    let conn = vault.db.lock();
    repo::list_entities(&conn, &case_id)
}

#[tauri::command]
pub fn entity_create(vault: State<'_, Vault>, input: NewEntity) -> Result<Entity> {
    let mut conn = vault.db.lock();
    repo::create_entity(&mut conn, &vault.hmac_key, input)
}

#[tauri::command]
pub fn entity_delete(vault: State<'_, Vault>, id: String) -> Result<()> {
    let mut conn = vault.db.lock();
    repo::delete_entity(&mut conn, &vault.hmac_key, &id)
}

#[tauri::command]
pub fn relations_list(vault: State<'_, Vault>, case_id: String) -> Result<Vec<Relation>> {
    let conn = vault.db.lock();
    repo::list_relations(&conn, &case_id)
}

#[tauri::command]
pub fn relation_create(vault: State<'_, Vault>, input: NewRelation) -> Result<Relation> {
    let mut conn = vault.db.lock();
    repo::create_relation(&mut conn, &vault.hmac_key, input)
}

#[tauri::command]
pub fn events_list(vault: State<'_, Vault>, case_id: String) -> Result<Vec<Event>> {
    let conn = vault.db.lock();
    repo::list_events(&conn, &case_id)
}

#[tauri::command]
pub fn ledger_verify(vault: State<'_, Vault>, case_id: String) -> Result<usize> {
    let conn = vault.db.lock();
    ledger::verify_chain(&conn, &vault.hmac_key, &case_id)
}
