use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum CaseKind { Person, Cyber, Brand, Custom }

impl CaseKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            CaseKind::Person => "Person",
            CaseKind::Cyber  => "Cyber",
            CaseKind::Brand  => "Brand",
            CaseKind::Custom => "Custom",
        }
    }
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "Person" => Some(Self::Person),
            "Cyber"  => Some(Self::Cyber),
            "Brand"  => Some(Self::Brand),
            "Custom" => Some(Self::Custom),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum CaseStatus { Active, Idle, Archived }

impl CaseStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            CaseStatus::Active   => "Active",
            CaseStatus::Idle     => "Idle",
            CaseStatus::Archived => "Archived",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Case {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub status: String,
    pub legal_basis: Option<String>,
    pub accent: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub archived_at: Option<DateTime<Utc>>,
    pub entity_count: i64,
    pub relation_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewCase {
    pub kind: String,
    pub title: String,
    pub legal_basis: Option<String>,
    pub accent: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entity {
    pub id: String,
    pub case_id: String,
    pub kind: String,
    pub label: String,
    pub attributes: serde_json::Value,
    pub confidence: f64,
    pub source: String,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewEntity {
    pub case_id: String,
    pub kind: String,
    pub label: String,
    pub attributes: Option<serde_json::Value>,
    pub confidence: Option<f64>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Relation {
    pub id: String,
    pub case_id: String,
    pub from_entity: String,
    pub to_entity: String,
    pub kind: String,
    pub attributes: serde_json::Value,
    pub confidence: f64,
    pub first_seen: DateTime<Utc>,
    pub last_seen: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewRelation {
    pub case_id: String,
    pub from_entity: String,
    pub to_entity: String,
    pub kind: String,
    pub attributes: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub id: i64,
    pub case_id: String,
    pub kind: String,
    pub actor: String,
    pub payload: serde_json::Value,
    pub ts: DateTime<Utc>,
    pub prev_hash: String,
    pub hash: String,
}
