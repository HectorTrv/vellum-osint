//! Vellum — editorial OSINT studio.
//!
//! V0.2 wiring: encrypted vault (SQLCipher) + cases/entities/relations CRUD +
//! HMAC-chained forensic ledger.

pub mod domain;
pub mod error;
pub mod ipc;
pub mod ledger;
pub mod repo;
pub mod vault;

use vault::Vault;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let vault = Vault::open().expect("failed to open vault");
    tracing::info!(path = %vault.vault_path.display(), "vault opened");

    tauri::Builder::default()
        .manage(vault)
        .invoke_handler(tauri::generate_handler![
            ipc::app_info,
            ipc::cases_list,
            ipc::case_create,
            ipc::case_get,
            ipc::case_set_status,
            ipc::case_rename,
            ipc::entities_list,
            ipc::entity_create,
            ipc::entity_delete,
            ipc::relations_list,
            ipc::relation_create,
            ipc::events_list,
            ipc::ledger_verify,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Vellum");
}
