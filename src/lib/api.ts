// Typed wrappers around Tauri `invoke()`.
// All commands match #[tauri::command] handlers in src-tauri/src/ipc.rs.

import { invoke } from "@tauri-apps/api/core";
import type {
  AppInfo,
  Case,
  Entity,
  Event,
  NewCase,
  NewEntity,
  NewRelation,
  Relation,
} from "@/lib/types";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const api = {
  appInfo: () => invoke<AppInfo>("app_info"),

  // cases
  casesList: () => invoke<Case[]>("cases_list"),
  caseGet: (id: string) => invoke<Case>("case_get", { id }),
  caseCreate: (input: NewCase) => invoke<Case>("case_create", { input }),
  caseSetStatus: (id: string, status: Case["status"]) =>
    invoke<Case>("case_set_status", { id, status }),
  caseRename: (id: string, title: string) =>
    invoke<Case>("case_rename", { id, title }),

  // entities
  entitiesList: (caseId: string) => invoke<Entity[]>("entities_list", { caseId }),
  entityCreate: (input: NewEntity) => invoke<Entity>("entity_create", { input }),
  entityDelete: (id: string) => invoke<void>("entity_delete", { id }),

  // relations
  relationsList: (caseId: string) => invoke<Relation[]>("relations_list", { caseId }),
  relationCreate: (input: NewRelation) =>
    invoke<Relation>("relation_create", { input }),

  // events / ledger
  eventsList: (caseId: string) => invoke<Event[]>("events_list", { caseId }),
  ledgerVerify: (caseId: string) => invoke<number>("ledger_verify", { caseId }),
};
