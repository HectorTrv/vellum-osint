import type { Case, Entity, Event, Relation } from "@/lib/types";

/* ──────────────────────────────────────────────────────────
   Rich mock data for the web preview (no Tauri vault).
   Six thematically-coherent cases with believable entities,
   relations and forensic events.
   ────────────────────────────────────────────────────────── */

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
const day = (d: number) => new Date(now - d * 86_400_000).toISOString();

function ent(id: string, caseId: string, kind: string, label: string, opts: Partial<Entity> = {}): Entity {
  return {
    id, caseId, kind, label,
    attributes: opts.attributes ?? {},
    confidence: opts.confidence ?? 0.9,
    source: opts.source ?? "manual",
    firstSeen: opts.firstSeen ?? day(2),
    lastSeen: opts.lastSeen ?? ago(2),
    createdAt: opts.createdAt ?? day(2),
  };
}
function rel(id: string, caseId: string, from: string, to: string, kind: string): Relation {
  return {
    id, caseId,
    fromEntity: from, toEntity: to,
    kind, attributes: {},
    confidence: 0.95,
    firstSeen: day(2), lastSeen: null, createdAt: day(2),
  };
}
function evt(id: number, caseId: string, kind: string, actor: string, h: number, payload: Record<string, unknown>): Event {
  return { id, caseId, kind, actor, payload, ts: ago(h), prevHash: "0x" + (id - 1).toString(16).padStart(8, "0") + "...", hash: "0x" + id.toString(16).padStart(8, "0") + "...d3a4" };
}

/* ─── Case 1 · Vermilion (Cyber) ──────────────────────────── */
const v = "mock-001";
const vermilionEntities: Entity[] = [
  ent("v-1",  v, "Person",   "J. Doe",                  { attributes: { aliases: ["Vermilion", "VRM-99"], country: "FR" }, confidence: 0.85 }),
  ent("v-2",  v, "Email",    "j.doe@x.com",             { attributes: { verified: true } }),
  ent("v-3",  v, "Email",    "vermilion@protonmail.ch", { attributes: { mxDomain: "protonmail.ch" } }),
  ent("v-4",  v, "Username", "@vermilion_99",           { attributes: { platform: "telegram" } }),
  ent("v-5",  v, "Username", "vrm_99",                  { attributes: { platform: "exploit.in" } }),
  ent("v-6",  v, "Domain",   "vermilion.run",           { attributes: { registrar: "Njalla", created: "2024-09-11" } }),
  ent("v-7",  v, "Domain",   "vrm-cdn.tech",            { attributes: { registrar: "Porkbun" } }),
  ent("v-8",  v, "IP",       "185.220.101.42",          { attributes: { asn: "AS208163", country: "DE", ports: [22, 443, 9001] } }),
  ent("v-9",  v, "IP",       "92.118.47.5",             { attributes: { asn: "AS200651", country: "RU" } }),
  ent("v-10", v, "Hash",     "f8a3c4d2…c91d",            { attributes: { algo: "SHA-256", file: "loader.exe" } }),
  ent("v-11", v, "Hash",     "9d83b1ee…4bd2",            { attributes: { algo: "MD5" } }),
  ent("v-12", v, "Wallet",   "0x4F2c…d1Ee",              { attributes: { chain: "ETH", balance: "12.4" } }),
];
const vermilionRelations: Relation[] = [
  rel("vr-1",  v, "v-1",  "v-2",  "owns"),
  rel("vr-2",  v, "v-1",  "v-3",  "owns"),
  rel("vr-3",  v, "v-1",  "v-4",  "owns"),
  rel("vr-4",  v, "v-1",  "v-5",  "owns"),
  rel("vr-5",  v, "v-4",  "v-6",  "registered"),
  rel("vr-6",  v, "v-6",  "v-8",  "resolves_to"),
  rel("vr-7",  v, "v-7",  "v-9",  "resolves_to"),
  rel("vr-8",  v, "v-1",  "v-10", "leaked"),
  rel("vr-9",  v, "v-11", "v-6",  "served_from"),
  rel("vr-10", v, "v-1",  "v-12", "uses"),
];
const vermilionEvents: Event[] = [
  evt(1,  v, "case.create",     "hector@local",     48,   { kind: "Cyber", title: "Threat Actor — Vermilion" }),
  evt(2,  v, "entity.create",   "hector@local",     47,   { id: "v-1",  kind: "Person",   label: "J. Doe" }),
  evt(3,  v, "entity.create",   "hector@local",     47,   { id: "v-2",  kind: "Email",    label: "j.doe@x.com" }),
  evt(4,  v, "entity.create",   "enricher:hibp",    46,   { id: "v-10", kind: "Hash",     label: "f8a3c4d2…c91d" }),
  evt(5,  v, "enrich.hibp",     "enricher:hibp",    46,   { breaches: ["Adobe 2013", "LinkedIn 2012", "Dropbox 2016"] }),
  evt(6,  v, "entity.create",   "hector@local",     45,   { id: "v-4",  kind: "Username", label: "@vermilion_99" }),
  evt(7,  v, "enrich.whois",    "enricher:whoisxml", 44,  { domain: "vermilion.run", registered: "2024-09-11" }),
  evt(8,  v, "relation.create", "hector@local",     43,   { from: "v-4", to: "v-6", kind: "registered" }),
  evt(9,  v, "enrich.shodan",   "enricher:shodan",  42,   { ip: "185.220.101.42", ports: [22, 443, 9001] }),
  evt(10, v, "note",            "hector@local",     30,   { body: "Bulletproof hosting, cross-ref Op. Tide." }),
  evt(11, v, "attach",          "hector@local",     20,   { name: "screenshot_landing.png", sha256: "0c7…" }),
  evt(12, v, "entity.create",   "hector@local",     2,    { id: "v-12", kind: "Wallet", label: "0x4F2c…d1Ee" }),
];

/* ─── Case 2 · Person of Interest J.D. (Person) ───────────── */
const p = "mock-002";
const personEntities: Entity[] = [
  ent("p-1",  p, "Person",        "J. D.",                    { attributes: { dob: "1991-04-08", country: "FR" } }),
  ent("p-2",  p, "Email",         "jdaniel.work@gmail.com",   { attributes: { verified: true } }),
  ent("p-3",  p, "Email",         "j.daniel@oldjob.fr",       { attributes: { verified: false } }),
  ent("p-4",  p, "Phone",         "+33 6 12 34 56 78",        { attributes: { country: "FR", carrier: "Orange" } }),
  ent("p-5",  p, "Username",      "@jdaniel",                 { attributes: { platform: "twitter", followers: 312 } }),
  ent("p-6",  p, "Username",      "jdaniel.fr",               { attributes: { platform: "instagram", followers: 1450 } }),
  ent("p-7",  p, "Username",      "j-daniel-0124",            { attributes: { platform: "linkedin" } }),
  ent("p-8",  p, "Location",      "Lyon · 7e arr.",            { attributes: { lat: 45.74, lng: 4.85 } }),
  ent("p-9",  p, "Organization",  "Helios Co.",               { attributes: { role: "former employee" } }),
];
const personRelations: Relation[] = [
  rel("pr-1", p, "p-1", "p-2", "owns"),
  rel("pr-2", p, "p-1", "p-3", "owns"),
  rel("pr-3", p, "p-1", "p-4", "owns"),
  rel("pr-4", p, "p-1", "p-5", "owns"),
  rel("pr-5", p, "p-1", "p-6", "owns"),
  rel("pr-6", p, "p-1", "p-7", "owns"),
  rel("pr-7", p, "p-1", "p-8", "lives_at"),
  rel("pr-8", p, "p-1", "p-9", "worked_at"),
];
const personEvents: Event[] = [
  evt(1, p, "case.create",   "hector@local", 28, { kind: "Person", title: "Person of Interest · J.D." }),
  evt(2, p, "entity.create", "hector@local", 27, { id: "p-1", kind: "Person", label: "J. D." }),
  evt(3, p, "enrich.hunter", "enricher:hunter", 25, { confidence: 0.92, found: 2 }),
  evt(4, p, "entity.create", "hector@local", 22, { id: "p-7", kind: "Username", label: "j-daniel-0124" }),
  evt(5, p, "enrich.maigret", "enricher:maigret", 20, { matches: 3, sites: ["twitter", "instagram", "linkedin"] }),
  evt(6, p, "note",          "hector@local",   8, { body: "Cross-ref: appears in Vermilion case as former Helios employee." }),
];

/* ─── Case 3 · Helios Co. brand mentions (Brand) ──────────── */
const h = "mock-003";
const heliosEntities: Entity[] = [
  ent("h-1",  h, "Organization", "Helios Co.",               { attributes: { country: "FR", sector: "energy" } }),
  ent("h-2",  h, "Domain",       "helios.co",                { attributes: { canonical: true } }),
  ent("h-3",  h, "Domain",       "helios-co.shop",           { attributes: { suspect: true, registered: ago(48 * 14) } }),
  ent("h-4",  h, "Domain",       "heliosco-fr.com",          { attributes: { suspect: true } }),
  ent("h-5",  h, "Domain",       "helios.support",           { attributes: { suspect: true, takedown: "requested" } }),
  ent("h-6",  h, "URL",          "https://helios-co.shop/promo", {}),
  ent("h-7",  h, "Email",        "support@helios-co.shop",   { attributes: { verified: false } }),
  ent("h-8",  h, "SocialAccount", "@helios_official_fr",     { attributes: { platform: "instagram", suspect: true } }),
  ent("h-9",  h, "SocialAccount", "@helios.official.deals", { attributes: { platform: "tiktok", suspect: true } }),
  ent("h-10", h, "IP",           "104.21.55.12",             { attributes: { asn: "AS13335", country: "US", cdn: "Cloudflare" } }),
  ent("h-11", h, "IP",           "172.67.198.10",            { attributes: { asn: "AS13335", country: "US", cdn: "Cloudflare" } }),
  ent("h-12", h, "Hash",         "a3c1b2…78fa",               { attributes: { algo: "SHA-256", subject: "logo.png leaked" } }),
  ent("h-13", h, "Document",     "Helios.brand.guidelines",  { attributes: { mime: "pdf" } }),
  ent("h-14", h, "Person",       "C. Andrade",               { attributes: { role: "brand officer" } }),
];
const heliosRelations: Relation[] = [
  rel("hr-1",  h, "h-1",  "h-2",  "owns"),
  rel("hr-2",  h, "h-1",  "h-13", "publishes"),
  rel("hr-3",  h, "h-3",  "h-1",  "impersonates"),
  rel("hr-4",  h, "h-4",  "h-1",  "impersonates"),
  rel("hr-5",  h, "h-5",  "h-1",  "impersonates"),
  rel("hr-6",  h, "h-6",  "h-3",  "served_from"),
  rel("hr-7",  h, "h-3",  "h-10", "resolves_to"),
  rel("hr-8",  h, "h-4",  "h-11", "resolves_to"),
  rel("hr-9",  h, "h-7",  "h-3",  "uses"),
  rel("hr-10", h, "h-8",  "h-1",  "impersonates"),
  rel("hr-11", h, "h-9",  "h-1",  "impersonates"),
];
const heliosEvents: Event[] = [
  evt(1, h, "case.create",       "hector@local",         96, { title: "Brand Mentions — Helios Co." }),
  evt(2, h, "enrich.whois",      "enricher:whoisxml",     90, { domain: "helios-co.shop", registered: day(14) }),
  evt(3, h, "entity.create",     "hector@local",          84, { id: "h-3", kind: "Domain" }),
  evt(4, h, "entity.create",     "hector@local",          80, { id: "h-8", kind: "SocialAccount" }),
  evt(5, h, "note",              "hector@local",          48, { body: "Pattern: 3 squat domains share Cloudflare ASN." }),
  evt(6, h, "case.status",       "hector@local",          24, { from: "Active", to: "Idle" }),
];

/* ─── Case 4 · Operation Tide (Cyber) ─────────────────────── */
const t = "mock-004";
const tideEntities: Entity[] = [
  ent("t-1",  t, "Organization", "Op. Tide ring",            { attributes: { count: 14, region: "EU" } }),
  ent("t-2",  t, "Domain",       "tide-secure.click",        { attributes: { suspect: true } }),
  ent("t-3",  t, "Domain",       "tide-login.support",       { attributes: { suspect: true } }),
  ent("t-4",  t, "Domain",       "tide-update.online",       { attributes: { suspect: true } }),
  ent("t-5",  t, "IP",           "45.95.169.101",            { attributes: { asn: "AS49870" } }),
  ent("t-6",  t, "IP",           "45.95.169.187",            { attributes: { asn: "AS49870" } }),
  ent("t-7",  t, "Hash",         "phish_kit_v3.zip",          { attributes: { algo: "SHA-256", size: "1.4MB" } }),
  ent("t-8",  t, "Email",        "newsletter@tide-secure.click", {}),
  ent("t-9",  t, "URL",          "https://tide-secure.click/login", {}),
  ent("t-10", t, "Wallet",       "bc1qjy…aax",                { attributes: { chain: "BTC", balance: "0.83" } }),
  ent("t-11", t, "Person",       "Unknown Operator",          { attributes: { confidence: 0.4 } }),
];
const tideRelations: Relation[] = [
  rel("tr-1", t, "t-1", "t-2", "operates"),
  rel("tr-2", t, "t-1", "t-3", "operates"),
  rel("tr-3", t, "t-1", "t-4", "operates"),
  rel("tr-4", t, "t-2", "t-5", "resolves_to"),
  rel("tr-5", t, "t-3", "t-5", "resolves_to"),
  rel("tr-6", t, "t-4", "t-6", "resolves_to"),
  rel("tr-7", t, "t-7", "t-2", "served_from"),
  rel("tr-8", t, "t-1", "t-10", "uses"),
];

/* ─── Case 5 · Internal Audit Q1 (Custom · Archived) ─────── */
const a = "mock-005";
const auditEntities: Entity[] = [
  ent("a-1", a, "Organization", "Internal · Q1 audit",  {}),
  ent("a-2", a, "Document",     "audit_report_q1.pdf",  { attributes: { mime: "pdf" } }),
  ent("a-3", a, "Document",     "vendor_list.xlsx",     { attributes: { mime: "xlsx" } }),
  ent("a-4", a, "Person",       "M. Lefevre",           { attributes: { role: "auditor" } }),
  ent("a-5", a, "Person",       "S. Okonkwo",           { attributes: { role: "vendor lead" } }),
  ent("a-6", a, "Email",        "audit-q1@helios.co",   {}),
];
const auditRelations: Relation[] = [
  rel("ar-1", a, "a-1", "a-2", "publishes"),
  rel("ar-2", a, "a-1", "a-3", "publishes"),
  rel("ar-3", a, "a-4", "a-1", "leads"),
  rel("ar-4", a, "a-5", "a-1", "contributes"),
];

/* ─── Case 6 · Counterfeit Storefronts (Brand) ───────────── */
const cf = "mock-006";
const counterfeitEntities: Entity[] = [
  ent("c-1",  cf, "Organization", "Helios Co.",             {}),
  ent("c-2",  cf, "Domain",       "helios-store-fr.com",    { attributes: { suspect: true } }),
  ent("c-3",  cf, "Domain",       "buy-helios.shop",        { attributes: { suspect: true } }),
  ent("c-4",  cf, "Domain",       "helioshop.outlet",       { attributes: { suspect: true } }),
  ent("c-5",  cf, "URL",          "https://buy-helios.shop/sale-90", {}),
  ent("c-6",  cf, "Email",        "orders@buy-helios.shop", {}),
  ent("c-7",  cf, "SocialAccount", "@helios.outlet.eu",     { attributes: { platform: "facebook" } }),
  ent("c-8",  cf, "Wallet",       "0x9aB3…c1f2",             { attributes: { chain: "ETH" } }),
];
const counterfeitRelations: Relation[] = [
  rel("cr-1", cf, "c-2", "c-1", "impersonates"),
  rel("cr-2", cf, "c-3", "c-1", "impersonates"),
  rel("cr-3", cf, "c-4", "c-1", "impersonates"),
  rel("cr-4", cf, "c-5", "c-3", "served_from"),
  rel("cr-5", cf, "c-6", "c-3", "uses"),
  rel("cr-6", cf, "c-7", "c-1", "impersonates"),
];

/* ─── Cases summary (for casesStore) ──────────────────────── */
export const MOCK_CASES: Case[] = [
  {
    id: "mock-001",
    kind: "Cyber",
    title: "Threat Actor — Vermilion",
    status: "Active",
    legalBasis: "internal_security",
    accent: "ember",
    createdAt: day(2),
    updatedAt: ago(2),
    archivedAt: null,
    entityCount: vermilionEntities.length,
    relationCount: vermilionRelations.length,
  },
  {
    id: "mock-002",
    kind: "Person",
    title: "Person of Interest · J.D.",
    status: "Active",
    legalBasis: "due_diligence",
    accent: "ink",
    createdAt: day(1),
    updatedAt: ago(8),
    archivedAt: null,
    entityCount: personEntities.length,
    relationCount: personRelations.length,
  },
  {
    id: "mock-003",
    kind: "Brand",
    title: "Brand Mentions — Helios Co.",
    status: "Idle",
    legalBasis: "brand_protection",
    accent: "solar",
    createdAt: day(4),
    updatedAt: day(1),
    archivedAt: null,
    entityCount: heliosEntities.length,
    relationCount: heliosRelations.length,
  },
  {
    id: "mock-004",
    kind: "Cyber",
    title: "Phishing Kit — Operation Tide",
    status: "Active",
    legalBasis: "internal_security",
    accent: "moss",
    createdAt: day(3),
    updatedAt: ago(5),
    archivedAt: null,
    entityCount: tideEntities.length,
    relationCount: tideRelations.length,
  },
  {
    id: "mock-005",
    kind: "Custom",
    title: "Internal Audit · Q1",
    status: "Archived",
    legalBasis: "ts_compliant_audit",
    accent: "ink",
    createdAt: day(45),
    updatedAt: day(40),
    archivedAt: day(38),
    entityCount: auditEntities.length,
    relationCount: auditRelations.length,
  },
  {
    id: "mock-006",
    kind: "Brand",
    title: "Counterfeit Storefronts",
    status: "Active",
    legalBasis: "brand_protection",
    accent: "ember",
    createdAt: day(2),
    updatedAt: day(1),
    archivedAt: null,
    entityCount: counterfeitEntities.length,
    relationCount: counterfeitRelations.length,
  },
];

export const MOCK_ENTITIES: Record<string, Entity[]> = {
  "mock-001": vermilionEntities,
  "mock-002": personEntities,
  "mock-003": heliosEntities,
  "mock-004": tideEntities,
  "mock-005": auditEntities,
  "mock-006": counterfeitEntities,
};
export const MOCK_RELATIONS: Record<string, Relation[]> = {
  "mock-001": vermilionRelations,
  "mock-002": personRelations,
  "mock-003": heliosRelations,
  "mock-004": tideRelations,
  "mock-005": auditRelations,
  "mock-006": counterfeitRelations,
};
export const MOCK_EVENTS: Record<string, Event[]> = {
  "mock-001": vermilionEvents,
  "mock-002": personEvents,
  "mock-003": heliosEvents,
};
