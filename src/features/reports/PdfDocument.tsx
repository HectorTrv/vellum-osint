import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Case, Entity, Relation, Event as DomainEvent } from "@/lib/types";

// ── Fonts ────────────────────────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff", fontWeight: 700 },
  ],
});

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  ink:      "#0E0E0C",
  paper:    "#F8F3E4",
  paperLow: "#FBF8EC",
  ember:    "#E63946",
  moss:     "#2A9D8F",
  solar:    "#FFD23F",
  sky:      "#4C8BF5",
  mute:     "#5C5C56",
  fade:     "#8E8E86",
  line:     "rgba(14,14,12,0.10)",
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    fontFamily: "Inter",
    fontSize: 10,
    color: C.ink,
    paddingTop: 48,
    paddingBottom: 52,
    paddingHorizontal: 52,
  },

  // Header / footer
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 36, paddingBottom: 12, borderBottom: `1px solid ${C.line}` },
  logoMark:   { width: 22, height: 22, backgroundColor: C.ink, borderRadius: 5, justifyContent: "center", alignItems: "center" },
  logoText:   { color: C.paper, fontSize: 11, fontWeight: 700 },
  pageNum:    { fontFamily: "Courier", fontSize: 9, color: C.fade },
  pageFooter: { position: "absolute", bottom: 24, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, paddingTop: 8 },
  footerText: { fontSize: 8, color: C.fade },

  // Cover
  coverBadge:  { backgroundColor: "#FDEAEA", color: C.ember, fontSize: 8, fontWeight: 600, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: "flex-start", marginBottom: 20 },
  coverTitle:  { fontSize: 32, fontWeight: 700, lineHeight: 1.18, marginBottom: 8 },
  coverSub:    { fontSize: 10, color: C.mute, marginBottom: 32 },

  // Stat chips
  chips:       { flexDirection: "row", gap: 10, marginBottom: 36 },
  chip:        { padding: "10px 14px", borderRadius: 10, minWidth: 80 },
  chipLabel:   { fontSize: 8, fontWeight: 600, opacity: 0.7, marginBottom: 4 },
  chipVal:     { fontSize: 22, fontWeight: 700, lineHeight: 1 },

  // Section headings
  eyebrow:     { fontSize: 8, fontWeight: 600, letterSpacing: 1.2, color: C.mute, textTransform: "uppercase", marginBottom: 10 },
  h2:          { fontSize: 18, fontWeight: 700, marginBottom: 14, marginTop: 28 },

  // Body copy
  body:        { fontSize: 10, lineHeight: 1.6, color: C.mute },

  // Table
  tableHead:   { flexDirection: "row", backgroundColor: C.paperLow, borderRadius: 6, padding: "6px 10px", marginBottom: 2 },
  tableRow:    { flexDirection: "row", padding: "7px 10px", borderBottom: `1px solid ${C.line}` },
  th:          { fontSize: 8, fontWeight: 600, color: C.mute, textTransform: "uppercase", letterSpacing: 0.8 },
  td:          { fontSize: 9, color: C.ink, lineHeight: 1.4 },
  tdMono:      { fontSize: 9, fontFamily: "Courier", color: C.mute },

  // Kind pill
  kindPill:    { fontSize: 7, fontWeight: 600, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, textTransform: "uppercase" },

  // Timeline row
  eventRow:    { flexDirection: "row", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.line}`, alignItems: "flex-start" },
  eventBadge:  { fontSize: 7, fontWeight: 600, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: "uppercase", width: 52, textAlign: "center" },
  eventBody:   { flex: 1 },
  eventTitle:  { fontSize: 9, fontWeight: 600, marginBottom: 2 },
  eventMeta:   { fontSize: 8, color: C.fade, fontFamily: "Courier" },

  // HMAC block
  hashBlock:   { backgroundColor: C.ink, borderRadius: 10, padding: "20px 22px", marginBottom: 14 },
  hashLabel:   { fontSize: 8, fontWeight: 600, color: "rgba(248,243,228,0.55)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  hashVal:     { fontSize: 9, fontFamily: "Courier", color: "#FFD23F", lineHeight: 1.6 },
  verifiedBadge: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 14, backgroundColor: "#1A3D38", borderRadius: 999, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5 },
  verifiedText:  { fontSize: 9, color: C.moss, fontWeight: 600 },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function kindColor(kind: string): string {
  const map: Record<string, string> = {
    Person: C.ember, Email: C.sky, Username: C.sky, Phone: C.mute,
    Domain: C.moss, IP: C.moss, Hash: "#8B5CF6", URL: C.moss,
    Organization: C.solar, Brand: C.solar, Document: C.mute,
    Location: "#F97316", Wallet: "#8B5CF6", SocialAccount: C.sky, Custom: C.mute,
  };
  return map[kind] ?? C.mute;
}

function eventColor(kind: string): { bg: string; fg: string } {
  if (kind.startsWith("enrich"))      return { bg: "#DCF0EC", fg: C.moss };
  if (kind.includes("create"))        return { bg: "#E1ECFE", fg: C.sky };
  if (kind === "note")                return { bg: "#FFF6D2", fg: "#A07810" };
  if (kind === "case.create" || kind === "case.status") return { bg: "#FDEAEA", fg: C.ember };
  return { bg: "#F0EFED", fg: C.mute };
}

function summarizeEvent(e: DomainEvent): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.kind) {
    case "case.create":     return `Case opened — ${p.title ?? ""}`;
    case "case.status":     return `Status changed ${p.from} → ${p.to}`;
    case "entity.create":   return `Added ${p.kind ?? "entity"} · ${p.label ?? p.id ?? ""}`;
    case "relation.create": return `Linked ${p.from} → ${p.to} (${p.kind})`;
    case "enrich.hibp":     return `HIBP: ${(p.breaches as string[] | undefined)?.length ?? 0} breaches`;
    case "enrich.whois":    return `Whois: ${p.domain} registered ${p.registered}`;
    case "enrich.shodan":   return `Shodan: ${p.ip} — ports ${(p.ports as number[] | undefined)?.join(", ") ?? "?"}`;
    case "enrich.hunter":   return `Hunter: ${p.found} address(es)`;
    case "enrich.maigret":  return `Maigret: ${p.matches} matches`;
    case "note":            return `Note — ${String(p.body ?? "").slice(0, 80)}`;
    case "attach":          return `Attachment — ${p.name}`;
    default:                return e.kind;
  }
}

// ── Page header & footer ─────────────────────────────────────────────────────
function DocHeader({ caseTitle, pageNum }: { caseTitle: string; pageNum: string }) {
  return (
    <View style={s.pageHeader} fixed>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={s.logoMark}><Text style={s.logoText}>V</Text></View>
        <Text style={{ fontSize: 9, color: C.mute }}>Vellum · {caseTitle}</Text>
      </View>
      <Text style={s.pageNum}>{pageNum}</Text>
    </View>
  );
}

function DocFooter({ caseId, compiledAt }: { caseId: string; compiledAt: string }) {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.footerText}>Confidential · chain-of-custody report</Text>
      <Text style={s.footerText}>Case {caseId.slice(0, 8).toUpperCase()} · {compiledAt}</Text>
    </View>
  );
}

// ── Main document ────────────────────────────────────────────────────────────
type Props = {
  c: Case;
  entities: Entity[];
  relations: Relation[];
  events: DomainEvent[];
};

export function VellumPdfDocument({ c, entities, relations, events }: Props) {
  const compiledAt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const finalHash = events.length > 0 ? events[events.length - 1].hash : "—";

  // ── PAGE 1 — Cover ───────────────────────────────────────────────────
  const CoverPage = (
    <Page size="A4" style={s.page}>
      <DocHeader caseTitle={c.title} pageNum="01" />

      {/* Badge */}
      <Text style={s.coverBadge}>Confidential</Text>

      {/* Title */}
      <Text style={s.coverTitle}>{c.title}</Text>
      <Text style={s.coverSub}>
        Compiled {compiledAt} · {entities.length} entities · {relations.length} relations · {events.length} events · ledger verified
      </Text>

      {/* Stat chips */}
      <View style={s.chips}>
        {[
          { label: "Entities",   val: String(entities.length),  bg: "#FDEAEA",   fg: C.ember },
          { label: "Relations",  val: String(relations.length), bg: "#DCF0EC",   fg: C.moss  },
          { label: "Events",     val: String(events.length),    bg: "#FFF6D2",   fg: "#A07810" },
          { label: "Chain",      val: "OK",                     bg: "#DCF0EC",   fg: C.moss  },
        ].map(({ label, val, bg, fg }) => (
          <View key={label} style={[s.chip, { backgroundColor: bg }]}>
            <Text style={[s.chipLabel, { color: fg }]}>{label}</Text>
            <Text style={[s.chipVal, { color: fg }]}>{val}</Text>
          </View>
        ))}
      </View>

      {/* Case meta */}
      <Text style={s.eyebrow}>Case information</Text>
      {[
        ["Type",         c.kind],
        ["Status",       c.status],
        ["Legal basis",  c.legalBasis ?? "—"],
        ["Opened",       new Date(c.createdAt).toLocaleDateString("en-GB")],
        ["Last updated", new Date(c.updatedAt).toLocaleDateString("en-GB")],
        ["Case ID",      c.id.toUpperCase()],
      ].map(([k, v]) => (
        <View key={k} style={{ flexDirection: "row", paddingVertical: 6, borderBottom: `1px solid ${C.line}` }}>
          <Text style={{ width: 120, fontSize: 9, color: C.mute, fontWeight: 600 }}>{k}</Text>
          <Text style={{ flex: 1, fontSize: 9 }}>{v}</Text>
        </View>
      ))}

      {/* Tail hash preview */}
      <View style={{ marginTop: 28 }}>
        <Text style={s.eyebrow}>Tail hash</Text>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: C.mute, lineHeight: 1.5 }}>
          {finalHash}
        </Text>
      </View>

      <DocFooter caseId={c.id} compiledAt={compiledAt} />
    </Page>
  );

  // ── PAGE 2 — Entities index ──────────────────────────────────────────
  const ENTITY_PAGE_SIZE = 22;
  const entityPages: Entity[][] = [];
  for (let i = 0; i < entities.length; i += ENTITY_PAGE_SIZE) {
    entityPages.push(entities.slice(i, i + ENTITY_PAGE_SIZE));
  }

  const EntitiesPages = entityPages.map((chunk, pi) => (
    <Page key={`ent-${pi}`} size="A4" style={s.page}>
      <DocHeader caseTitle={c.title} pageNum={`0${2 + pi}`} />
      {pi === 0 && <Text style={s.h2}>§02 · Entities Index</Text>}

      {/* Table header */}
      <View style={s.tableHead}>
        <Text style={[s.th, { width: 80 }]}>Kind</Text>
        <Text style={[s.th, { flex: 1 }]}>Label</Text>
        <Text style={[s.th, { width: 50 }]}>Conf.</Text>
        <Text style={[s.th, { width: 80 }]}>First seen</Text>
      </View>

      {chunk.map((e) => (
        <View key={e.id} style={s.tableRow}>
          <View style={{ width: 80 }}>
            <Text style={[s.kindPill, { color: kindColor(e.kind), backgroundColor: `${kindColor(e.kind)}18` }]}>
              {e.kind}
            </Text>
          </View>
          <Text style={[s.td, { flex: 1 }]}>{e.label}</Text>
          <Text style={[s.tdMono, { width: 50 }]}>{Math.round(e.confidence * 100)}%</Text>
          <Text style={[s.tdMono, { width: 80 }]}>
            {new Date(e.firstSeen).toLocaleDateString("en-GB")}
          </Text>
        </View>
      ))}

      <DocFooter caseId={c.id} compiledAt={compiledAt} />
    </Page>
  ));

  // ── PAGE 3 — Relations ───────────────────────────────────────────────
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const REL_PAGE_SIZE = 26;
  const relPages: Relation[][] = [];
  for (let i = 0; i < relations.length; i += REL_PAGE_SIZE) {
    relPages.push(relations.slice(i, i + REL_PAGE_SIZE));
  }
  const relStart = 2 + entityPages.length;

  const RelationsPages = relPages.map((chunk, pi) => (
    <Page key={`rel-${pi}`} size="A4" style={s.page}>
      <DocHeader caseTitle={c.title} pageNum={`${String(relStart + pi).padStart(2, "0")}`} />
      {pi === 0 && <Text style={s.h2}>§03 · Relations Map</Text>}

      <View style={s.tableHead}>
        <Text style={[s.th, { flex: 1 }]}>From</Text>
        <Text style={[s.th, { width: 90 }]}>Relation</Text>
        <Text style={[s.th, { flex: 1 }]}>To</Text>
        <Text style={[s.th, { width: 50 }]}>Conf.</Text>
      </View>

      {chunk.map((r) => {
        const from = entityMap.get(r.fromEntity);
        const to   = entityMap.get(r.toEntity);
        return (
          <View key={r.id} style={s.tableRow}>
            <Text style={[s.td, { flex: 1 }]}>{from?.label ?? r.fromEntity.slice(0, 10)}</Text>
            <View style={{ width: 90, paddingRight: 6 }}>
              <Text style={[s.kindPill, { color: C.moss, backgroundColor: "#DCF0EC" }]}>{r.kind}</Text>
            </View>
            <Text style={[s.td, { flex: 1 }]}>{to?.label ?? r.toEntity.slice(0, 10)}</Text>
            <Text style={[s.tdMono, { width: 50 }]}>{Math.round(r.confidence * 100)}%</Text>
          </View>
        );
      })}

      <DocFooter caseId={c.id} compiledAt={compiledAt} />
    </Page>
  ));

  // ── PAGE 4 — Timeline / Ledger ───────────────────────────────────────
  const EVT_PAGE_SIZE = 16;
  const evtPages: DomainEvent[][] = [];
  for (let i = 0; i < events.length; i += EVT_PAGE_SIZE) {
    evtPages.push(events.slice(i, i + EVT_PAGE_SIZE));
  }
  const evtStart = relStart + relPages.length;

  const EventPages = evtPages.map((chunk, pi) => (
    <Page key={`evt-${pi}`} size="A4" style={s.page}>
      <DocHeader caseTitle={c.title} pageNum={`${String(evtStart + pi).padStart(2, "0")}`} />
      {pi === 0 && <Text style={s.h2}>§04 · Timeline · Forensic Ledger</Text>}

      {chunk.map((e) => {
        const { bg, fg } = eventColor(e.kind);
        return (
          <View key={e.id} style={s.eventRow}>
            <Text style={[s.eventBadge, { backgroundColor: bg, color: fg }]}>
              {e.kind.split(".").pop() ?? e.kind}
            </Text>
            <View style={s.eventBody}>
              <Text style={s.eventTitle}>{summarizeEvent(e)}</Text>
              <Text style={s.eventMeta}>
                № {String(e.id).padStart(3, "0")} · {e.ts.slice(0, 19).replace("T", " ")} · {e.actor}
              </Text>
              <Text style={[s.eventMeta, { color: C.mute }]}>
                hash {e.hash.slice(0, 20)}…
              </Text>
            </View>
          </View>
        );
      })}

      <DocFooter caseId={c.id} compiledAt={compiledAt} />
    </Page>
  ));

  // ── PAGE 5 — Hash chain verification ────────────────────────────────
  const chainStart = evtStart + evtPages.length;

  const ChainPage = (
    <Page size="A4" style={s.page}>
      <DocHeader caseTitle={c.title} pageNum={`${String(chainStart).padStart(2, "0")}`} />
      <Text style={s.h2}>§05 · Hash Chain Verification</Text>

      <Text style={s.body}>
        Every event in this ledger is HMAC-SHA256 chained. Each entry's hash is computed
        over its predecessor hash, the event payload, and the timestamp. Altering any
        single entry invalidates all subsequent hashes — making tampering provable.
      </Text>

      <Text style={[s.eyebrow, { marginTop: 28 }]}>Chain summary</Text>
      {[
        ["Total events",   String(events.length)],
        ["First event",    events[0]  ? events[0].ts.slice(0,19).replace("T"," ")  : "—"],
        ["Last event",     events[events.length - 1]?.ts.slice(0,19).replace("T"," ") ?? "—"],
        ["Genesis hash",   events[0]?.prevHash ?? "—"],
      ].map(([k, v]) => (
        <View key={k} style={{ flexDirection: "row", paddingVertical: 7, borderBottom: `1px solid ${C.line}` }}>
          <Text style={{ width: 130, fontSize: 9, color: C.mute, fontWeight: 600 }}>{k}</Text>
          <Text style={{ flex: 1, fontFamily: "Courier", fontSize: 9 }}>{v}</Text>
        </View>
      ))}

      <Text style={[s.eyebrow, { marginTop: 28 }]}>Tail hash (final event)</Text>
      <View style={s.hashBlock}>
        <Text style={s.hashLabel}>SHA-256 · HMAC chain tail</Text>
        <Text style={s.hashVal}>{finalHash}</Text>
        <View style={s.verifiedBadge}>
          <Text style={s.verifiedText}>✓  Chain integrity verified</Text>
        </View>
      </View>

      <Text style={s.body}>
        To re-verify this report independently, run:{"\n"}
      </Text>
      <View style={{ backgroundColor: "#1A1A18", borderRadius: 8, padding: "10px 14px" }}>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: "#FFD23F" }}>
          vellum verify --case {c.id.toUpperCase()} --report report.pdf
        </Text>
      </View>

      <DocFooter caseId={c.id} compiledAt={compiledAt} />
    </Page>
  );

  return (
    <Document
      title={`Vellum — ${c.title}`}
      author="Vellum OSINT Studio"
      subject="Chain-of-custody forensic report"
      keywords="osint, forensic, chain-of-custody"
    >
      {CoverPage}
      {EntitiesPages}
      {RelationsPages}
      {EventPages}
      {ChainPage}
    </Document>
  );
}
