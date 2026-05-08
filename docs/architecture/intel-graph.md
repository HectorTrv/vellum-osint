# Vellum · Intel Graph — Design Document

> Author: Lead OSINT Engineer · Status: design v1 · Targets Vellum V0.3 → V0.6

This document specifies the graph-based intelligence backbone that powers Vellum's
Graph Studio, enrichers, time-lapse view, and proximity alerts. It is intentionally
agnostic of whether the graph store is **embedded SQLite (local-first)** or
**Neo4j sidecar (power-user mode)** — both are supported by the design (see §6).

---

## 0. Compliance, ethics & engineering guardrails

The system handles personal data and public-source intelligence. Bake the
following in **at the schema level**, not as policy bolted on after:

| Concern | Mechanism |
| --- | --- |
| Legal basis per case | `Case.legal_basis` (enum: journalism, due_diligence, ts_compliant_audit, internal_security, ctf, education) — required, blocking on save |
| ToS compliance | Each connector declares `tos_url`, `rate_limit`, `auth_kind`; pipeline refuses to run a connector without operator-signed acknowledgement (stored in `vault.consents`) |
| Subject pseudonymisation | Personal nodes can be stored hashed-at-rest (`Person.subject_hash` SHA-256) for cases where re-identification needs analyst step-up |
| Audit | All write operations emit a forensic event (already specced in Vellum: `events` table, HMAC-chained) |
| Deletion / GDPR Art. 17 | `entities.deleted_at` (soft) → tombstone propagates to Neo4j on next sync; hard purge job runs nightly |
| Rate limit | All connectors share a token-bucket store keyed on provider; circuit-breaker on consecutive 4xx/5xx |
| Adversarial input | All ingested strings pass through `clean_*` scripts (§4) before hitting the graph |

These columns are part of the **canonical schema**, not optional. A connector
that cannot populate `source`, `fetched_at`, and `confidence` is not allowed to
write.

---

## 1. Tech stack & collection layer

### 1.1 Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Local store | SQLite + SQLCipher (already in Vellum) | Zero-server, encrypted at rest, the canonical truth |
| Graph store | Neo4j 5.x + GDS plugin (optional sidecar) | Cypher, GDS centrality, APOC triggers |
| Visualization | Cytoscape.js (Vellum) + Maltego (export) | In-app native; Maltego export for tactical share |
| Ingestion | Python 3.12 (Pandas, NetworkX, neo4j driver, rapidfuzz, tldextract, phonenumbers, imagehash, h3) | Standard analyst toolchain |
| Pipeline orchestrator | Prefect 3 (or plain `python -m vellum.pipeline.run`) | DAG, retries, observability |
| Scheduler | Tauri command → Python sidecar via `tauri-plugin-shell` | Keeps everything inside the Vellum binary |

### 1.2 Connectors (collectors)

| Provider | Resource | Auth | Cadence | Output |
| --- | --- | --- | --- | --- |
| Social Links / Crystal | Multi-platform social (Twitter/X, Instagram, TikTok, VK, Telegram, dark web forums) | API key | on-demand pivot | `Pseudonym`, `Account`, `SocialPost` |
| WhoisXML | Domain registrations, DNS history, reverse-IP | API key | hourly cron + on-demand | `Domain`, `IP`, `Whois`, `Organization`, `Person` (registrant) |
| ADS-B Exchange | Aircraft live + history | API key | per-aircraft poll 30 s | `Aircraft`, `Sighting`, `Location` |
| MarineTraffic | Vessel AIS history | API key | per-vessel poll 60 s | `Vessel`, `Sighting`, `Location` |
| HaveIBeenPwned | Email breaches | API key | on-demand | `Breach`, `Email -[LEAKED_IN]-> Breach` |
| Hunter.io | Email finder/verifier | API key | on-demand | `Email` (with `verified_status`) |
| Wayback Machine | URL snapshots | none | on-demand | `URL`, `URLSnapshot` |
| Maigret / Sherlock-like | Pseudonym → 350+ sites | none (scraping) | on-demand | `Account` |
| Manual / paste | Operator-curated | n/a | manual | any |

Each connector implements:

```rust
#[async_trait]
trait Connector {
    fn id(&self) -> &'static str;
    fn tos_url(&self) -> &'static str;
    fn rate_limit(&self) -> RateLimit;
    fn input_kinds(&self) -> &[EntityKind];     // what it can pivot from
    fn output_kinds(&self) -> &[EntityKind];    // what it produces
    async fn fetch(&self, input: &Entity, ctx: &Ctx) -> Result<Vec<Observation>>;
}
```

### 1.3 Auto-pivoting engine

Pivoting rules are declared in YAML, stored in `config/pivot.rules.yaml` (and editable via the Vellum UI in V0.5):

```yaml
version: 1
rules:
  - on: Email
    when: confidence >= 0.6
    discover:
      - kind: Breach
        via: hibp
      - kind: Account
        via: [hunter, social_links]
      - kind: Domain
        rule: extract_after_at
        emit_relation: USES_DOMAIN

  - on: Pseudonym
    discover:
      - kind: Account
        via: [maigret, social_links]
      - kind: Pseudonym
        rule: cross_platform_correlation
        emit_relation: SIMILAR_TO
        min_score: 0.78

  - on: Domain
    discover:
      - kind: IP
        rule: dns_resolve
        emit_relation: RESOLVES_TO
      - kind: Whois
        via: whoisxml
      - kind: URL
        via: wayback
        emit_relation: ARCHIVED_AS

  - on: Aircraft
    discover:
      - kind: Sighting
        via: adsb_exchange
        emit_relation: SEEN_AT

  - on: Vessel
    discover:
      - kind: Sighting
        via: marinetraffic
```

The **Pivot Runner** is a topological scheduler: when a node is created/updated, it
enqueues all rules matching its kind and confidence. New nodes feed back into the
queue, with a **depth budget** per case (default 3 hops) to bound discovery.

---

## 2. Schema mapping

### 2.1 Entities (node labels)

```
Person       (id, full_name, dob, nationality, aliases[], subject_hash, ...)
Pseudonym    (id, handle, normalized_handle, platform, first_seen, last_seen, post_count)
Email        (id, address, normalized, mx_domain, verified_status)
Phone        (id, e164, country, carrier)
Domain       (id, fqdn, etld_plus_one, tld, registrar, created_at, expires_at, ns[], status)
IP           (id, ip, version, asn, asn_org, country, geo_h3)
URL          (id, url, hash, status_code, content_type, last_seen, archived_url)
File         (id, sha256, sha1, md5, mime, size, filename, magic)
Image        (id, sha256, phash, width, height, exif_json)
Wallet       (id, address, chain, kind, label)
Vehicle      (id, kind, make, model, year, plate, vin)
Aircraft     (id, icao24, callsign, registration, model, operator, country)
Vessel       (id, mmsi, imo, name, flag, kind, gross_tonnage)
Location     (id, lat, lng, h3_id, name, kind)
Sighting     (id, ts, accuracy_m, altitude_m, speed_kt, heading_deg, source)
Organization (id, name, registry_id, country, kind)
Account      (id, provider, external_id, profile_url, created_at, follower_count)
Breach       (id, name, breach_date, count, source, classes[])
SocialPost   (id, platform, post_id, ts, content_hash, lang, author_handle)
Document     (id, kind, title, hash, created_at)
Whois        (id, domain_id, registrant_name?, registrant_email?, registrant_org?, raw_hash)
Case         (id, kind, title, status, legal_basis, opened_by, opened_at)
```

**Universal columns on every entity:**

```
case_id, confidence (0..1), first_seen, last_seen, source (enum),
ingested_at, attribution (analyst id), tags[], deleted_at?
```

### 2.2 Relations (typed edges)

```
(:Person)         -[:HAS_ALIAS {since}]->         (:Pseudonym)
(:Pseudonym)      -[:OWNS]->                      (:Account)
(:Pseudonym)      -[:SIMILAR_TO {score, method}]->(:Pseudonym)   // cross-platform
(:Account)        -[:LISTED]->                    (:Email)
(:Account)        -[:FOLLOWS {since}]->           (:Account)
(:Account)        -[:MENTIONS {ts, post_id}]->    (:Account)
(:Account)        -[:POSTED]->                    (:SocialPost)
(:SocialPost)     -[:CONTAINS_URL]->              (:URL)
(:URL)            -[:RESOLVES]->                  (:Domain)
(:Email)          -[:LEAKED_IN {breach_date}]->   (:Breach)
(:Email)          -[:USES_DOMAIN]->               (:Domain)
(:Domain)         -[:RESOLVES_TO {first_seen, last_seen, ttl}]-> (:IP)
(:Domain)         -[:REGISTERED_BY]->             (:Person|:Organization)
(:Domain)         -[:HAS_WHOIS]->                 (:Whois)
(:Person)         -[:LIVES_AT]->                  (:Location)
(:Person)         -[:OPERATES]->                  (:Vehicle|:Aircraft|:Vessel)
(:Aircraft)       -[:SEEN_AT {ts, alt, spd, hdg, src}]-> (:Location)
(:Vessel)         -[:SEEN_AT {ts, course, src}]-> (:Location)
(:Person)         -[:USED]->                      (:Wallet)
(:Wallet)         -[:TX {ts, amount, tx_hash}]->  (:Wallet)
(:Image)          -[:SIMILAR_TO {phash_distance}]->(:Image)
(:Case)           -[:CONTAINS]->                  (any node)
(:Event)          -[:OBSERVED]->                  (any node)   // forensic ledger link
```

**Universal edge properties:**

```
first_seen, last_seen, source (enum), confidence (0..1), evidence_id?, attribution
```

### 2.3 Neo4j constraints & indexes (Cypher)

```cypher
CREATE CONSTRAINT person_id  IF NOT EXISTS FOR (n:Person)    REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT email_addr IF NOT EXISTS FOR (n:Email)     REQUIRE n.normalized IS UNIQUE;
CREATE CONSTRAINT domain_fq  IF NOT EXISTS FOR (n:Domain)    REQUIRE n.fqdn IS UNIQUE;
CREATE CONSTRAINT ip_addr    IF NOT EXISTS FOR (n:IP)        REQUIRE n.ip IS UNIQUE;
CREATE CONSTRAINT pseudo_pk  IF NOT EXISTS FOR (n:Pseudonym) REQUIRE (n.platform, n.normalized_handle) IS UNIQUE;
CREATE CONSTRAINT ac_pk      IF NOT EXISTS FOR (n:Aircraft)  REQUIRE n.icao24 IS UNIQUE;
CREATE CONSTRAINT vs_pk      IF NOT EXISTS FOR (n:Vessel)    REQUIRE n.mmsi IS UNIQUE;

CREATE INDEX entity_case      IF NOT EXISTS FOR (n)            ON (n.case_id);
CREATE INDEX rel_first_seen   IF NOT EXISTS FOR ()-[r]-()      ON (r.first_seen);
CREATE INDEX rel_last_seen    IF NOT EXISTS FOR ()-[r]-()      ON (r.last_seen);
CREATE INDEX loc_h3           IF NOT EXISTS FOR (n:Location)   ON (n.h3_id);
CREATE INDEX sighting_ts      IF NOT EXISTS FOR (n:Sighting)   ON (n.ts);
```

---

## 3. Intelligence layer

### 3.1 Centrality (PageRank, Betweenness)

Project the graph for analysis:

```cypher
CALL gds.graph.project(
  'osint',
  ['Person','Pseudonym','Account','Email','Domain','IP','Wallet','Aircraft','Vessel'],
  '*',
  { relationshipProperties: ['confidence'] }
);
```

**PageRank** (influencers, central C2 nodes):

```cypher
CALL gds.pageRank.stream('osint', { relationshipWeightProperty: 'confidence' })
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS n, score
RETURN labels(n)[0] AS kind, coalesce(n.label, n.fqdn, n.ip, n.handle) AS who, score
ORDER BY score DESC LIMIT 25;
```

**Betweenness** (bridging nodes — typical for C2 relays, brokers):

```cypher
CALL gds.betweenness.stream('osint')
YIELD nodeId, score
WITH gds.util.asNode(nodeId) AS n, score
RETURN labels(n)[0] AS kind, coalesce(n.label, n.fqdn, n.ip, n.handle) AS who, score
ORDER BY score DESC LIMIT 25;
```

**Community detection** (Louvain) — clusters of co-acting actors:

```cypher
CALL gds.louvain.stream('osint') YIELD nodeId, communityId
RETURN communityId, count(*) AS size
ORDER BY size DESC LIMIT 20;
```

Scores are persisted back as node properties (`pagerank`, `betweenness`, `community_id`) so the Vellum UI can colour/size nodes accordingly without re-running GDS.

### 3.2 Time-Lapse Graph

Every relation carries `first_seen` / `last_seen`. The graph at time `t` is:

```cypher
MATCH (a)-[r]-(b)
WHERE r.first_seen <= datetime($t)
  AND (r.last_seen IS NULL OR r.last_seen >= datetime($t))
RETURN a, r, b;
```

UI: a slider in Graph Studio drives `$t`; we keep precomputed snapshots every 6h
(stored as `Snapshot {case_id, ts, payload_hash}`) for instant playback. For full
animation we stream edges in `first_seen` order:

```cypher
MATCH ()-[r]->()
WHERE r.case_id = $cid AND r.first_seen >= datetime($from)
RETURN r ORDER BY r.first_seen ASC;
```

### 3.3 Cross-Platform Pseudonym Correlation

For each pair `(p1, p2)` of `Pseudonym` from different platforms, compute features:

| Feature | Method | Weight |
| --- | --- | --- |
| `name_lev` | `1 - (lev / max(len))` on normalized handles (NFKC, lowercase, strip ZW, transliterate) | 0.30 |
| `name_phonetic` | metaphone(handle1) == metaphone(handle2) → 1 else 0 | 0.05 |
| `bio_cosine` | TF-IDF cosine of bios | 0.15 |
| `avatar_phash` | `1 - (phash_dist/64)` on profile pictures | 0.20 |
| `time_pattern` | KS-test on hour-of-day post histograms | 0.10 |
| `mention_overlap` | Jaccard on mentioned external handles | 0.10 |
| `link_overlap` | Jaccard on shared URLs | 0.10 |

Score = weighted sum → `SIMILAR_TO {score, method:"v1"}` if `score >= 0.78`. Below
that, store as candidate in a `correlation_candidates` table for analyst review.

> ⚠️ Always **analyst-confirmed** before treating a `SIMILAR_TO` link as a hard
> identity assertion in a report. The schema reflects that: edges have
> `confidence` and `attribution`.

### 3.4 Proximity alerts

A **watch rule** = `(case_id, target_pattern, hop_distance, geo_distance_m, geo_anchor?, severity)`.

Triggers on three events:

1. **Graph proximity**: a watched node enters within `hop_distance` of a
   `known_bad: true` node. Implemented as APOC trigger:

```cypher
CALL apoc.trigger.add('proximity_graph', "
  UNWIND $createdRelationships AS r
  WITH startNode(r) AS a, endNode(r) AS b
  MATCH (w:Watched), (k {known_bad: true})
  WHERE (w = a AND shortestPath((b)-[*..3]-(k)) IS NOT NULL)
     OR (w = b AND shortestPath((a)-[*..3]-(k)) IS NOT NULL)
  CREATE (:Alert {kind:'proximity_graph', case_id: w.case_id, ts: datetime(),
                  watched: w.id, neighbor: id(b)})
", {phase:'after'});
```

2. **Geo proximity**: a `Sighting` lands in an H3 cell adjacent to a watched
   `Location`. Resolved by neighbour-cell lookup at ingest time.
3. **Velocity** (rate of new edges): if a watched node accumulates > N new edges in T minutes (defaults: 10 / 60 min), raise a "burst" alert.

Alerts are written to the same forensic ledger (`events` table, kind `alert`),
chained, and surfaced as system-tray notifications by Tauri.

---

## 4. Python ingestion & cleaning scripts

Located at `pipeline/` (separate from Vellum's React/Rust code, packaged as
`vellum-pipeline` and invoked from Rust via `tauri-plugin-shell`).

```
pipeline/
├── pyproject.toml
├── vellum_pipeline/
│   ├── cleaners/
│   │   ├── clean_emails.py            # RFC validation, normalization, MX, disposables
│   │   ├── clean_domains.py           # punycode, eTLD+1, IDN homograph detection
│   │   ├── clean_handles.py           # NFKC, lowercase, transliterate, canonical key
│   │   ├── clean_phones.py            # phonenumbers → E.164
│   │   ├── clean_urls.py              # canonicalize, strip tracking params, hash
│   │   ├── clean_wallets.py           # checksum addresses (EIP-55), chain detection
│   │   └── clean_locations.py         # geocode → H3 cell, Nominatim cache
│   ├── correlate/
│   │   ├── pseudonyms.py              # §3.3 features → SIMILAR_TO edges
│   │   ├── images.py                  # imagehash pHash → SIMILAR_TO edges
│   │   └── writeprint.py              # post-timing fingerprint (KS test)
│   ├── enrich/
│   │   ├── hibp.py                    # breach lookup → :Breach
│   │   ├── hunter.py                  # email finder/verifier
│   │   ├── whoisxml.py                # registrant + DNS history
│   │   ├── adsb.py                    # ADSB-Exchange → :Sighting
│   │   ├── marinetraffic.py           # AIS → :Sighting
│   │   ├── wayback.py                 # archive.org snapshots
│   │   └── maigret.py                 # username → :Account list
│   ├── graph/
│   │   ├── load_to_neo4j.py           # bulk upsert via neo4j driver
│   │   ├── load_to_sqlite.py          # local-first store (Vellum)
│   │   ├── centrality_report.py       # NetworkX PageRank/Betweenness on subgraph
│   │   ├── timelapse_snapshots.py     # 6h snapshot generator
│   │   └── export_maltego.py          # write .mtgx for tactical viz
│   ├── pivot/
│   │   ├── runner.py                  # YAML rules → enricher dispatch
│   │   └── rules_loader.py
│   ├── dedupe/
│   │   ├── entities.py                # rapidfuzz on name fields, blocking on case_id
│   │   └── merge.py                   # canonicalize survivor + reassign edges
│   ├── validate/
│   │   ├── schema.py                  # pydantic models, refuse partial nodes
│   │   └── time_normalize.py          # all timestamps → UTC ISO 8601
│   └── cli.py                         # entrypoint: vellum-pipeline <cmd>
└── tests/
```

**Minimal sketches** (full implementations in V0.4):

```python
# cleaners/clean_emails.py
import re, idna
from email_validator import validate_email, EmailNotValidError
from typing import TypedDict

DISPOSABLE = set(open('data/disposable.txt').read().split())

class CleanedEmail(TypedDict):
    raw: str
    normalized: str | None
    mx_domain: str | None
    is_disposable: bool
    valid: bool

def clean(raw: str) -> CleanedEmail:
    try:
        v = validate_email(raw, check_deliverability=False)
        local, domain = v.local_part.lower(), v.ascii_domain.lower()
        return {
            "raw": raw,
            "normalized": f"{local}@{domain}",
            "mx_domain": domain,
            "is_disposable": domain in DISPOSABLE,
            "valid": True,
        }
    except EmailNotValidError:
        return {"raw": raw, "normalized": None, "mx_domain": None,
                "is_disposable": False, "valid": False}
```

```python
# correlate/pseudonyms.py
import pandas as pd
from rapidfuzz.distance import Levenshtein
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

WEIGHTS = dict(name=0.30, phonetic=0.05, bio=0.15, avatar=0.20,
               time=0.10, mention=0.10, link=0.10)

def correlate(df: pd.DataFrame) -> pd.DataFrame:
    """df: one row per (platform, handle) with bio, avatar_phash, hour_hist, mentions, urls"""
    pairs = []
    by_platform = dict(tuple(df.groupby("platform")))
    platforms = list(by_platform.keys())
    for i, pa in enumerate(platforms):
        for pb in platforms[i+1:]:
            la, lb = by_platform[pa], by_platform[pb]
            for _, ra in la.iterrows():
                for _, rb in lb.iterrows():
                    s = score(ra, rb)
                    if s >= 0.78:
                        pairs.append({"a": ra.id, "b": rb.id, "score": s})
    return pd.DataFrame(pairs)

def score(a, b) -> float:
    name = 1 - Levenshtein.normalized_distance(a.handle, b.handle)
    # bio cosine (precompute TF-IDF outside)
    bio = a.bio_vec @ b.bio_vec.T
    avatar = 1 - (a.phash_dist_to(b) / 64) if a.avatar_phash and b.avatar_phash else 0
    time = a.hour_hist_corr(b.hour_hist)
    mention = jaccard(a.mentions, b.mentions)
    link = jaccard(a.urls, b.urls)
    phonetic = 1.0 if metaphone(a.handle) == metaphone(b.handle) else 0.0
    return (WEIGHTS["name"]*name + WEIGHTS["phonetic"]*phonetic +
            WEIGHTS["bio"]*bio + WEIGHTS["avatar"]*avatar +
            WEIGHTS["time"]*time + WEIGHTS["mention"]*mention +
            WEIGHTS["link"]*link)
```

```python
# graph/centrality_report.py
import networkx as nx
import pandas as pd
from neo4j import GraphDatabase

def run(driver, case_id: str) -> pd.DataFrame:
    with driver.session() as s:
        rows = s.run("""
            MATCH (a)-[r]->(b) WHERE a.case_id=$c AND b.case_id=$c
            RETURN id(a) AS a, id(b) AS b, coalesce(r.confidence,1.0) AS w,
                   labels(a)[0] AS la, coalesce(a.label,a.fqdn,a.handle,a.ip) AS na
        """, c=case_id).data()
    g = nx.DiGraph()
    for r in rows:
        g.add_edge(r["a"], r["b"], weight=r["w"])
    pr = nx.pagerank(g, weight="weight")
    bw = nx.betweenness_centrality(g, weight="weight")
    df = pd.DataFrame([
        {"node": n, "pagerank": pr.get(n,0), "betweenness": bw.get(n,0)}
        for n in g.nodes
    ]).sort_values("pagerank", ascending=False)
    return df
```

```python
# pivot/runner.py
import yaml, asyncio
from .. import enrich

class PivotRunner:
    def __init__(self, rules_path: str, depth_budget: int = 3):
        self.rules = yaml.safe_load(open(rules_path))["rules"]
        self.depth_budget = depth_budget

    async def fire(self, entity, case_id, depth=0):
        if depth >= self.depth_budget:
            return
        for rule in self.rules:
            if rule["on"] != entity.kind: continue
            for d in rule["discover"]:
                results = await self._dispatch(entity, d)
                for r in results:
                    yield r
                    async for sub in self.fire(r, case_id, depth+1):
                        yield sub
```

### Suggested execution order on a fresh case

```
validate.schema  → cleaners.*  → enrich.{whoisxml, hibp, hunter, wayback}
                                    │
                          dedupe.entities (within case)
                                    │
                  correlate.{pseudonyms, images, writeprint}
                                    │
                       graph.load_to_neo4j  (or load_to_sqlite)
                                    │
                  graph.centrality_report   →   write back as node props
                                    │
                graph.timelapse_snapshots (every 6h)
```

---

## 5. Architecture (component diagram)

```
   ┌──────────────────────────────────────────────────────────┐
   │                       Vellum (Tauri)                      │
   │                                                            │
   │  React UI ──► Rust commands ──► tauri-plugin-shell ──┐    │
   │     ▲                                                 │    │
   │     │                                                 ▼    │
   │     │                           ┌──────────────────────┐   │
   │     │                           │  vellum-pipeline      │   │
   │     │                           │  (Python sidecar)     │   │
   │     │                           │                       │   │
   │     │                           │  cleaners → enrich    │   │
   │     │                           │  → dedupe → correlate │   │
   │     │                           │  → load_to_neo4j      │   │
   │     │                           │  → centrality_report  │   │
   │     │                           └─────────┬─────────────┘   │
   │     │                                     │                  │
   │     │   ┌──────────┐         ┌────────────▼─────────────┐    │
   │     └───┤  SQLite  │◄───sync─┤        Neo4j 5.x         │    │
   │         │  (vault) │         │   (Docker sidecar, opt)  │    │
   │         └──────────┘         └─────────────┬────────────┘    │
   │                                             │                 │
   │                              alerts via APOC│ trigger          │
   │                                             ▼                 │
   │                                   System-tray notif           │
   └──────────────────────────────────────────────────────────────┘
                          │
                          ▼ (export only, on demand)
                       Maltego (.mtgx)
```

**Key design choices:**

- **SQLite is the truth.** Neo4j is an optional analytical mirror. If the user
  has no Neo4j running, the pipeline's `load_to_sqlite` produces equivalent rows,
  and centrality runs against `NetworkX` on a SQLite-derived edge list. This
  preserves Vellum's local-first guarantee while letting power users plug in GDS.
- **Python sidecar** is shipped alongside the Tauri binary in a venv folder
  (`resources/python/`). The Rust side calls it via `tauri-plugin-shell` with
  stdin/stdout JSON, avoiding any IPC framework.
- **Pivot rules are data, not code.** Operators tune them per case without
  rebuilding the app.

---

## 6. Mapping onto the Vellum roadmap

| Roadmap milestone | Intel-graph deliverable |
| --- | --- |
| **V0.2** Cases CRUD + SQLCipher | `entities/relations/events` tables already match §2.1/2.2 universal cols |
| **V0.3** Cytoscape graph + ledger | Render `entities`+`relations` from SQLite. Time slider reads `first_seen`/`last_seen`. |
| **V0.4** Enrichers | Implements connectors §1.2 + Pivot Runner §1.3 + cleaners §4 |
| **V0.5** Reports + ⌘K | PDF embeds centrality + community + timeline snapshots |
| **V0.6** Templates per CaseKind | Pivot rules YAML shipped per `CaseKind` (Cyber, Person, Brand, Custom) |
| **V0.7 (new)** Neo4j sidecar | Optional Docker compose; on first launch, "Connect to Neo4j?" wizard |
| **V0.8 (new)** Alerts service | APOC triggers + system-tray notifications |

---

## 7. Open questions (to validate before V0.4)

1. **Neo4j deployment**: bundled Docker (auto-managed by Vellum) or operator-managed? The first is more user-friendly, the second is cleaner for an audit-grade tool.
2. **Social Links / Crystal API**: is the budget there? It's the most expensive connector. Maigret + Sherlock-like cover ~80% of the username-pivoting use case for free.
3. **Subject hashing default**: should `Person.subject_hash` be on by default for all `kind=Person` cases, with cleartext only behind step-up auth? More privacy-friendly but slower workflow.
4. **Pipeline as separate repo**: keep `vellum-pipeline` in this monorepo for atomic releases, or split for independent versioning? Recommendation: monorepo.
5. **Maltego export**: priority? Most analysts who want Maltego already have it; export-on-demand to `.mtgx` is enough.

---

## Appendix A — Sample Cypher pivot path queries

```cypher
// All paths from a given email to any IP within 4 hops
MATCH p = (e:Email {normalized:$email})-[*..4]-(ip:IP)
WHERE all(r in relationships(p) WHERE r.confidence >= 0.6)
RETURN p ORDER BY length(p) ASC LIMIT 10;

// Find pseudonyms linked across ≥3 platforms via SIMILAR_TO
MATCH (p:Pseudonym)-[:SIMILAR_TO*]-(q:Pseudonym)
WITH p, collect(distinct q.platform) AS plats
WHERE size(plats) >= 3
RETURN p.handle, plats;

// Watched node entered the 2-hop neighbourhood of a known C2
MATCH (w:Pseudonym {watched:true})-[*1..2]-(c {known_bad:true})
RETURN w, c;

// Time-bounded subgraph for a case
MATCH (a {case_id:$cid})-[r]->(b {case_id:$cid})
WHERE r.first_seen <= datetime($t)
  AND (r.last_seen IS NULL OR r.last_seen >= datetime($t))
RETURN a, r, b;
```
