import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  RotateCcw,
  Share2,
  Network,
  History,
  Trash2,
  Shield,
  UserSearch,
  Sparkles,
  Diamond,
  type LucideIcon,
} from "lucide-react";
import { colors, radius, accentSurface, toVisualAccent } from "@/ui/tokens/colors";
import { page } from "@/ui/tokens/layout";
import { H1, H3, Eyebrow, Body, BodySmall, Mono } from "@/ui/typography/Type";
import { Card } from "@/ui/primitives/Card";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { IconTile } from "@/ui/primitives/IconTile";
import { Stat } from "@/ui/primitives/Stat";
import { Tooltip } from "@/ui/primitives/Tooltip";
import { Spinner } from "@/ui/primitives/Spinner";
import { EntityQuickInput } from "@/ui/primitives/EntityQuickInput";
import { useRouter } from "@/app/router";
import { useCases } from "@/lib/casesStore";
import { useEntities } from "@/lib/entitiesStore";
import { toast } from "@/lib/toasts";
import { entityColor } from "@/ui/tokens/colors";
import type { Entity } from "@/lib/types";

const KIND_ICON: Record<string, LucideIcon> = {
  Cyber: Shield,
  Person: UserSearch,
  Brand: Sparkles,
  Custom: Diamond,
};

export function CaseDetailScreen() {
  const caseId = useRouter((s) => s.caseId);
  const setRoute = useRouter((s) => s.setRoute);
  const cases = useCases((s) => s.cases);
  const archive = useCases((s) => s.archive);
  const refresh = useCases((s) => s.refresh);
  const entitiesByCase = useEntities((s) => s.byCase);
  const loadEntities = useEntities((s) => s.load);
  const createEntity = useEntities((s) => s.createEntity);
  const deleteEntity = useEntities((s) => s.deleteEntity);

  const c = useMemo(() => cases.find((x) => x.id === caseId), [cases, caseId]);
  const bucket = caseId ? entitiesByCase[caseId] : undefined;
  const entities = bucket?.entities ?? [];
  const relations = bucket?.relations ?? [];
  const events = bucket?.events ?? [];

  useEffect(() => {
    if (caseId) loadEntities(caseId);
  }, [caseId, loadEntities]);

  if (!c || !caseId) {
    return (
      <div style={{ padding: "60px 56px", textAlign: "center" }}>
        <H3>No case selected</H3>
        <BodySmall style={{ color: colors.inkMute, marginTop: 8 }}>
          Pick a dossier from the Cases screen.
        </BodySmall>
        <div style={{ marginTop: 18 }}>
          <Button variant="secondary" size="md" onClick={() => setRoute("cases")} icon={<ArrowLeft size={14} strokeWidth={1.8} />}>
            Back to cases
          </Button>
        </div>
      </div>
    );
  }

  const tone = toVisualAccent(c.accent);
  const surface = accentSurface[tone];
  const KindIcon = KIND_ICON[c.kind] ?? Diamond;
  const isArchived = c.status === "Archived";

  return (
    <div style={{ ...page.standard }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} strokeWidth={1.8} />} onClick={() => setRoute("cases")}>
          All cases
        </Button>
        <span style={{ color: colors.inkFade, fontSize: 12 }}>/</span>
        <Mono style={{ color: colors.inkFade, fontSize: 12 }}>№ {c.id.slice(0, 6).toUpperCase()}</Mono>
      </div>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <Card padding={0} rounded="xl" style={{ overflow: "hidden", marginBottom: 22 }}>
          <div
            style={{
              background: surface.soft,
              padding: "28px 32px",
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <IconTile tone={tone} size={56} filled>
              <KindIcon size={24} strokeWidth={2} />
            </IconTile>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <Eyebrow>{c.kind}</Eyebrow>
                <Badge tone={c.status === "Active" ? "moss" : c.status === "Idle" ? "solar" : "neutral"} dot={c.status === "Active"}>
                  {c.status}
                </Badge>
                {c.legalBasis && <Badge tone="paper">basis · {c.legalBasis}</Badge>}
              </div>
              <H1 style={{ marginBottom: 8 }}>{c.title}</H1>
              <BodySmall style={{ color: colors.inkMute }}>
                Opened {new Date(c.createdAt).toLocaleDateString()} · last updated {relativeTime(c.updatedAt)}
              </BodySmall>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Button variant="secondary" size="md" icon={<Network size={14} strokeWidth={1.8} />} onClick={() => setRoute("graph")}>
                Open graph
              </Button>
              <Tooltip label={isArchived ? "Restore case" : "Archive case"} side="bottom">
                <Button
                  variant="ghost"
                  size="md"
                  icon={isArchived ? <RotateCcw size={14} strokeWidth={1.8} /> : <Archive size={14} strokeWidth={1.8} />}
                  onClick={() => archive(c.id)}
                >
                  {isArchived ? "Restore" : "Archive"}
                </Button>
              </Tooltip>
              <Button variant="primary" size="md" icon={<Share2 size={14} strokeWidth={1.8} />} onClick={() => setRoute("reports")}>
                Report
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              padding: "16px 32px",
              background: colors.paperLow,
              borderTop: `1px solid ${colors.hairline}`,
            }}
          >
            <Stat label="entities"  value={entities.length || c.entityCount} />
            <Stat label="relations" value={relations.length || c.relationCount} />
            <Stat label="events"    value={events.length || "—"} />
            <Stat label="opened"    value={new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
          </div>
        </Card>
      </motion.div>

      {/* Main: 2-up layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Entities column */}
        <Card padding="22px 24px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <H3>Entities</H3>
            <Mono style={{ color: colors.inkFade }}>{entities.length}</Mono>
          </div>

          <div style={{ marginBottom: 16 }}>
            <EntityQuickInput
              autoFocus
              onCommit={async (label, kind) => {
                try {
                  await createEntity({ caseId, kind, label });
                  toast.success("Entity added", `${kind} · ${label}`);
                  // refresh case counts
                  refresh();
                } catch (e) {
                  toast.error("Failed to add entity", String(e));
                }
              }}
            />
            <BodySmall style={{ marginTop: 8, color: colors.inkFade }}>
              Paste any IOC and the kind is detected automatically. Press <Mono>Enter</Mono> to commit.
            </BodySmall>
          </div>

          {bucket?.loading ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", color: colors.inkMute, padding: "16px 0" }}>
              <Spinner size={14} />
              <Body style={{ color: colors.inkMute }}>Loading entities…</Body>
            </div>
          ) : entities.length === 0 ? (
            <div
              style={{
                padding: "40px 18px",
                textAlign: "center",
                color: colors.inkMute,
                borderRadius: radius.md,
                background: colors.paperTile,
              }}
            >
              <BodySmall>No entities yet. Add one above to start the dossier.</BodySmall>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {entities.map((e) => (
                <EntityRow
                  key={e.id}
                  e={e}
                  onDelete={async () => {
                    await deleteEntity(e.id, caseId);
                    toast.show("Entity removed", e.label);
                    refresh();
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity column */}
        <Card padding="22px 24px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <H3>Recent activity</H3>
            <Button variant="ghost" size="sm" onClick={() => setRoute("timeline")} icon={<History size={14} strokeWidth={1.8} />}>
              Full ledger
            </Button>
          </div>
          {events.length === 0 ? (
            <div
              style={{
                padding: "40px 18px",
                textAlign: "center",
                color: colors.inkMute,
                borderRadius: radius.md,
                background: colors.paperTile,
              }}
            >
              <BodySmall>No activity yet. Every action you take is logged here, HMAC-chained.</BodySmall>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {events.slice(-6).reverse().map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 8px",
                    borderRadius: radius.sm,
                    alignItems: "flex-start",
                  }}
                >
                  <Mono style={{ width: 56, color: colors.inkFade, fontSize: 11 }}>
                    №{String(ev.id).padStart(3, "0")}
                  </Mono>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Body style={{ fontSize: 13, fontWeight: 500 }}>{ev.kind}</Body>
                    <Mono style={{ color: colors.inkFade, fontSize: 10.5 }}>{ev.actor} · {ev.ts.slice(11, 19)}</Mono>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function EntityRow({ e, onDelete }: { e: Entity; onDelete: () => void }) {
  const tone = entityColor[e.kind] ?? "ember";
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 10px",
        borderRadius: radius.md,
        background: colors.paperTile,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background:
            tone === "ember" ? colors.ember :
            tone === "moss"  ? colors.moss :
            tone === "solar" ? colors.solar :
                               colors.sky,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: colors.inkMute,
          width: 80,
        }}
      >
        {e.kind}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: colors.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {e.label}
      </span>
      <Tooltip label="Delete entity" side="top">
        <button
          onClick={onDelete}
          aria-label="delete"
          style={{
            width: 26,
            height: 26,
            display: "grid",
            placeItems: "center",
            borderRadius: radius.sm,
            background: "transparent",
            color: colors.inkFade,
            cursor: "pointer",
          }}
          onMouseEnter={(ev) => {
            ev.currentTarget.style.background = colors.emberSoft;
            ev.currentTarget.style.color = colors.ember;
          }}
          onMouseLeave={(ev) => {
            ev.currentTarget.style.background = "transparent";
            ev.currentTarget.style.color = colors.inkFade;
          }}
        >
          <Trash2 size={13} strokeWidth={1.8} />
        </button>
      </Tooltip>
    </motion.div>
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
