//! Vault — opens (or initializes) the encrypted SQLite vault.
//!
//! The master secret is stored in the OS keychain. We derive **two** keys from it:
//! - `sqlcipher_key` for SQLCipher PRAGMA key
//! - `hmac_key` for the forensic ledger chain
//!
//! That way, even if the SQLCipher key were exfiltrated (cold-boot, swap), the HMAC
//! key proves whether the ledger was tampered with.

use crate::error::{Error, Result};
use directories::ProjectDirs;
use hmac::{Hmac, Mac};
use rand::RngCore;
use rusqlite::Connection;
use sha2::Sha256;
use std::path::PathBuf;
use std::sync::Arc;
use parking_lot::Mutex;

const KEYRING_SERVICE: &str = "studio.vellum.app";
const KEYRING_USER: &str = "master";
const SCHEMA: &str = include_str!("../schema.sql");

pub type Db = Arc<Mutex<Connection>>;

pub struct Vault {
    pub db: Db,
    pub hmac_key: [u8; 32],
    pub vault_path: PathBuf,
}

impl Vault {
    pub fn open() -> Result<Self> {
        let dirs = ProjectDirs::from("studio", "Vellum", "Vellum")
            .ok_or_else(|| Error::Invalid("no app dir".into()))?;
        std::fs::create_dir_all(dirs.data_dir())?;
        let vault_path = dirs.data_dir().join("vault.vlm");
        let master = load_or_create_master()?;
        Self::open_with_master(vault_path, master)
    }

    /// Open (or initialize) a vault with a caller-provided master key.
    /// Used by tests and CLI tools that don't go through the OS keychain.
    pub fn open_with_master(vault_path: PathBuf, master: [u8; 32]) -> Result<Self> {
        let sqlcipher_key = derive(&master, b"sqlcipher.v1");
        let hmac_key = derive(&master, b"ledger.v1");

        let conn = Connection::open(&vault_path)?;
        let key_hex = hex::encode(sqlcipher_key);
        conn.pragma_update(None, "key", format!("x'{}'", key_hex))?;
        conn.pragma_update(None, "cipher_compatibility", 4)?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;

        // Sanity check: a SELECT must succeed before we touch schema.
        conn.query_row("SELECT count(*) FROM sqlite_master", [], |r| r.get::<_, i64>(0))?;

        // Run schema (idempotent)
        conn.execute_batch(SCHEMA)?;

        Ok(Self {
            db: Arc::new(Mutex::new(conn)),
            hmac_key,
            vault_path,
        })
    }
}

fn load_or_create_master() -> Result<[u8; 32]> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)?;
    match entry.get_password() {
        Ok(hex_str) => {
            let bytes = hex::decode(hex_str)?;
            let mut out = [0u8; 32];
            if bytes.len() != 32 {
                return Err(Error::Invalid("master key length".into()));
            }
            out.copy_from_slice(&bytes);
            Ok(out)
        }
        Err(keyring::Error::NoEntry) => {
            let mut out = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut out);
            entry.set_password(&hex::encode(out))?;
            Ok(out)
        }
        Err(e) => Err(e.into()),
    }
}

fn derive(master: &[u8; 32], domain: &[u8]) -> [u8; 32] {
    let mut mac = Hmac::<Sha256>::new_from_slice(master).expect("hmac key");
    mac.update(domain);
    let r = mac.finalize().into_bytes();
    let mut out = [0u8; 32];
    out.copy_from_slice(&r);
    out
}
