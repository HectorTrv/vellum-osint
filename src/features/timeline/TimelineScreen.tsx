import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FilePlus2,
  Sparkles,
  Pencil,
  Paperclip,
  Link2,
  Upload,
  ShieldCheck,
  History,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { colors, radius } from "@/ui/tokens/colors";
import { page } from "@/ui/tokens/layout";
import { H1, Eyebrow, Mono, Body, BodySmall } from "@/ui/typography/Type";
import { Badge } from "@/ui/primitives/Badge";
import { Card } from "@/ui/primitives/Card";
import { Button } from "@/ui/primitives/Button";
import { IconTile } from "@/ui/primitives/IconTile";
import { useRouter } from "@/app/router";
import { useCases } from "@/lib/casesStore";
import { useEntities } from "@/lib/entitiesStore";
import type { Event as DomainEvent } from "@/lib/types";

const KIND_META: Record<string, { tone: "ember" | "moss" | "solar" | "sky"; Icon: LucideIcon; pretty: string }> = {
  "case.create":     { tone: "ember", Icon: FilePlus2, pretty: "create" },
  "case.status":     { tone: "ember", Icon: FilePlus2, pretty: "status" },
  "entity.create":   { tone: "sky",   Icon: Link2,    pretty: "entity" },
  "relation.create": { tone: "sky",   Icon: Link2,    pretty: "link" },
  "enrich":          { tone: "moss",  Icon: Sparkles, pretty: "enrich" },
  "enrich.hibp":     { tone: "moss",  Icon: Sparkles, pretty: "hibp" },
  "enrich.whois":    { tone: "moss",  Icon: Sparkles, pretty: "whois" },
  "enrich.shodan":   { tone: "moss",  Icon: Sparkles, pretty: "shodan" },
  "enrich.hunter":   { tone: "moss",  Icon: Sparkles, pretty: "hunter" },
  "enrich.maigret":  { tone: "moss",  Icon: Sparkles, pretty: "maigret" },
  note:              { tone: "solar", Icon: Pencil,   pretty: "note" },
  attach:            { tone: "sky",   Icon: Paperclip, pretty: "attach" },
  link:              { tone: "sky",   Icon: Link2,    pretty: "link" },
  export:            { tone: "ember", Icon: Upload,   pretty: "export" },
};

function metaFor(kind: string) {
  return KIND_META[kind] ?? { tone: "ember" as const, Icon: History, pretty: kind };
}

export function TimelineScreen() {
  const cases = useCases((s) => s.cases);
  const routerCaseId = useRouter((s) => s.caseId);
  const setRoute = useRouter((s) => s.setRoute);
  const openCase = useRouter((s) => s.openCase);
  const byCase = useEntities((s) => s.byCase);
  const loadEntities = useEntities((s) => s.load);

  // Pick case: explicit OR most-recent active
  const activeCaseId = useMemo(() => {
    if (routerCaseId) return routerCaseId;
    const active = cases.filter((c) => c.status !== "Archived");
    if (active.length === 0) return null;
    return [...active].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].id;
  }, [routerCaseId, cases]);

  const c = activeCaseId ? cases.find((x) => x.id === activeCaseId) : null;
  const bucket = activeCaseId ? byCase[activeCaseId] : undefined;
  const events = bucket?.events ?? [];

  useEffect(() => {
    if (activeCaseId) loadEntities(activeCaseId);
  }, [activeCaseId, loadEntities]);

  const [filter, setFilter] = useState<"all" | "create" | "enrich" | "note">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    if (filter === "create") return events.filter((e) => e.kind.includes("create"));
    if (filter === "enrich") return events.filter((e) => e.kind.startsWith("enrich"));
    return events.filter((e) => e.kind === "note");
  }, [events, filter]);

  const counts = useMemo(() => ({
    all: events.length,
    create: events.filter((e) => e.kind.includes("create")).length,
    enrich: events.filter((e) => e.kind.startsWith("enrich")).length,
    note: events.filter((e) => e.kind === "note").length,
  }), [events]);

  if (!c) {
    return (
      <div style={{ padding: "60px 56px", textAlign: "center" }}>
        <IconTile tone="solar" size={56} style={{ margin: "0 auto" }}>
          <History size={24} strokeWidth={1.6} />
        </IconTile>
        <H1 style={{ marginTop: 16, fontSize: 28 }}>No ledger to show</H1>
        <BodySmall style={{ color: colors.inkMute, marginTop: 8 }}>
          Open a case from the Cases screen to view its forensic ledger.
        </BodySmall>
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" size="md" onClick={() => setRoute("cases")}>
            Browse cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...page.reading }}>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} strokeWidth={1.8} />} onClick={() => openCase(c.id)} style={{ marginBottom: 16 }}>
        Back to case
      </Button>

      <div style={{ marginBottom: 28 }}>
        <Eyebrow>Ledger · forensic timeline · append-only · HMAC-chained</Eyebrow>
        <H1 style={{ marginTop: 6 }}>{c.title}</H1>
        <BodySmall style={{ marginTop: 10, color: colors.inkMute, maxWidth: 600 }}>
          Every action against this case is recorded, hash-chained, and exportable.
          Tamper with one entry and the chain breaks — provably.
        </BodySmall>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <FilterPill active={filter === "all"}    onClick={() => setFilter("all")}    label="All"      count={counts.all} />
        <FilterPill active={filter === "create"} onClick={() => setFilter("create")} label="Creates"  count={counts.create} />
        <FilterPill active={filter === "enrich"} onClick={() => setFilter("enrich")} label="Enrich"   count={counts.enrich} tone="moss" />
        <FilterPill active={filter === "note"}   onClick={() => setFilter("note")}   label="Notes"    count={counts.note} tone="solar" />
        <div style={{ flex: 1 }} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: colors.mossSoft,
            color: colors.moss,
            borderRadius: radius.pill,
            fontFamily: "var(--font-display)",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={12} strokeWidth={2} />
          Chain integrity verified
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card padding="40px 24px" rounded="xl" style={{ textAlign: "center" }}>
          <BodySmall style={{ color: colors.inkMute }}>
            No events match this filter. Try "All".
          </BodySmall>
        </Card>
      ) : (
        <Card padding="8px 12px" rounded="xl">
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filtered.map((e, i) => (
              <EventRow key={e.id} event={e} index={i} last={i === filtered.length - 1} />
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "moss" | "solar";
}) {
  const accent = tone === "moss" ? colors.moss : tone === "solar" ? "#A07810" : colors.ink;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        background: active ? colors.ink : "transparent",
        color: active ? colors.paper : colors.inkMute,
        border: `1px solid ${active ? colors.ink : colors.hairlineStrong}`,
        borderRadius: radius.pill,
        fontFamily: "var(--font-display)",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {label}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: active ? colors.paper : accent }}>
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

function EventRow({ event, index, last }: { event: DomainEvent; index: number; last: boolean }) {
  const { tone, Icon, pretty } = metaFor(event.kind);
  const summary = useMemo(() => summarize(event), [event]);
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.03, ease: [0.32, 0.72, 0, 1] }}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 14,
        padding: "16px 12px",
        borderBottom: last ? "none" : `1px solid ${colors.hairline}`,
        alignItems: "flex-start",
      }}
    >
      <IconTile tone={tone} size={36}>
        <Icon size={15} strokeWidth={1.8} />
      </IconTile>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
          <Badge tone={tone} size="xs">{pretty}</Badge>
          <Mono style={{ color: colors.inkFade, fontSize: 11 }}>№ {String(event.id).padStart(3, "0")} · {event.ts.slice(11, 19)}</Mono>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: colors.inkMute,
              background: colors.paperWarm,
              padding: "2px 8px",
              borderRadius: radius.pill,
            }}
          >
            {event.actor}
          </span>
        </div>
        <Body style={{ fontWeight: 500 }}>{summary}</Body>
        <Mono style={{ marginTop: 6, color: colors.inkFade, fontSize: 11 }}>
          hash {event.hash.slice(0, 16)}…
        </Mono>
      </div>
    </motion.li>
  );
}

function summarize(e: DomainEvent): string {
  const p = e.payload as Record<string, unknown>;
  switch (e.kind) {
    case "case.create":     return `Case opened — ${p.title ?? ""}`;
    case "case.status":     return `Status changed · ${p.from} → ${p.to}`;
    case "entity.create":   return `Added ${p.kind ?? "entity"} · ${p.label ?? p.id ?? ""}`;
    case "relation.create": return `Linked ${p.from} → ${p.to} (${p.kind})`;
    case "enrich.hibp":     return `HIBP: ${(p.breaches as string[] | undefined)?.length ?? 0} breaches found`;
    case "enrich.whois":    return `Whois resolved · ${p.domain} registered ${p.registered}`;
    case "enrich.shodan":   return `Shodan · ${p.ip} ports ${(p.ports as number[] | undefined)?.join(", ") ?? "?"}`;
    case "enrich.hunter":   return `Hunter found ${p.found} address(es) · confidence ${Math.round(((p.confidence as number | undefined) ?? 0) * 100)}%`;
    case "enrich.maigret":  return `Maigret: ${p.matches} matches across ${(p.sites as string[] | undefined)?.join(", ") ?? "?"}`;
    case "note":            return `Note · ${p.body ?? ""}`;
    case "attach":          return `Attachment · ${p.name} (sha256 ${(p.sha256 as string | undefined)?.slice(0, 8) ?? "?"})`;
    default:                return e.kind;
  }
}
