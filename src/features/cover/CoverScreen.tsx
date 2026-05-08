import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Activity,
  Boxes,
  Link2,
  Fingerprint,
  Plus,
  Search,
  FileText,
  Network,
  ArrowRight,
  Shield,
  UserSearch,
  Diamond,
  type LucideIcon,
} from "lucide-react";
import { colors, radius, accentSurface, toVisualAccent } from "@/ui/tokens/colors";
import { page } from "@/ui/tokens/layout";
import { Display, Eyebrow, H3, Body, BodySmall, Mono } from "@/ui/typography/Type";
import { Button } from "@/ui/primitives/Button";
import { Card } from "@/ui/primitives/Card";
import { Badge } from "@/ui/primitives/Badge";
import { IconTile } from "@/ui/primitives/IconTile";
import { ListRow } from "@/ui/primitives/ListRow";
import { Orb } from "@/ui/shapes/Shapes";
import { useRouter } from "@/app/router";
import { useCases } from "@/lib/casesStore";
import { useCommands } from "@/lib/commands";
import type { Case } from "@/lib/types";

const KIND_ICON: Record<string, LucideIcon> = {
  Cyber: Shield,
  Person: UserSearch,
  Brand: Sparkles,
  Custom: Diamond,
};

export function CoverScreen() {
  const setRoute = useRouter((s) => s.setRoute);
  const openCase = useRouter((s) => s.openCase);
  const cases = useCases((s) => s.cases);
  const setCmdOpen = useCommands((s) => s.setOpen);

  const totals = {
    cases: cases.length,
    active: cases.filter((c) => c.status === "Active").length,
    entities: cases.reduce((acc, c) => acc + c.entityCount, 0),
    relations: cases.reduce((acc, c) => acc + c.relationCount, 0),
  };

  const recent = useMemo(
    () =>
      [...cases]
        .filter((c) => c.status !== "Archived")
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4),
    [cases]
  );

  return (
    <div style={{ ...page.standard, position: "relative" }}>
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <Orb size={520} color={colors.ember} opacity={0.16} style={{ position: "absolute", left: -120, top: -120 }} />
        <Orb size={420} color={colors.solar} opacity={0.20} style={{ position: "absolute", right: -80, top: 60 }} />
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Hello strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconTile tone="ember" size={36} filled>
              <Sparkles size={16} strokeWidth={2} />
            </IconTile>
            <div>
              <Eyebrow>Vellum · Issue 001</Eyebrow>
              <BodySmall style={{ marginTop: 2 }}>
                Editorial OSINT studio · local-first · forensic
              </BodySmall>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge tone="moss" dot>Vault online</Badge>
            <Badge tone="paper">v0.2</Badge>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
        >
          <Display>
            Hello.<br />
            <span style={{ color: colors.inkMute }}>What are we investigating today?</span>
          </Display>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <Button size="lg" variant="primary" icon={<Plus size={16} strokeWidth={2.2} />} onClick={() => setRoute("cases")}>
            Open cases
          </Button>
          <Button size="lg" variant="secondary" icon={<Search size={16} strokeWidth={1.8} />} onClick={() => setCmdOpen(true)}>
            Quick search · ⌘K
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setRoute("graph")}>
            Graph studio
          </Button>
        </motion.div>

        {/* KPI cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <KpiCard tone="ember" label="Active cases" value={totals.active} sub={`of ${totals.cases} open dossiers`} icon={<Activity size={16} strokeWidth={2} />} />
          <KpiCard tone="solar" label="Entities"     value={totals.entities} sub="across all cases" icon={<Boxes size={16} strokeWidth={2} />} />
          <KpiCard tone="moss"  label="Relations"    value={totals.relations} sub="links between entities" icon={<Link2 size={16} strokeWidth={2} />} />
          <KpiCard tone="sky"   label="Ledger"       value={"—"} sub="HMAC-chained · verifiable" icon={<Fingerprint size={16} strokeWidth={2} />} />
        </motion.div>

        {/* Quick actions + Recent cases */}
        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 24,
          }}
        >
          <Card padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
              <H3>Quick actions</H3>
              <Eyebrow>Shortcuts</Eyebrow>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <ListRow
                leading={<IconTile tone="ember" size={36}><Plus size={16} strokeWidth={2.2} /></IconTile>}
                title="Open a new case"
                subtitle="Cyber · Person · Brand · Custom"
                trailing={<Mono style={{ color: colors.inkFade }}>⌘N</Mono>}
                onClick={() => setRoute("cases")}
              />
              <ListRow
                leading={<IconTile tone="moss" size={36}><Search size={16} strokeWidth={2} /></IconTile>}
                title="Search across the vault"
                subtitle="entities · cases · pseudonyms · IOCs"
                trailing={<Mono style={{ color: colors.inkFade }}>⌘K</Mono>}
                onClick={() => setCmdOpen(true)}
              />
              <ListRow
                leading={<IconTile tone="solar" size={36}><FileText size={16} strokeWidth={2} /></IconTile>}
                title="Generate a chain-of-custody report"
                subtitle="PDF with HMAC verification"
                trailing={<Mono style={{ color: colors.inkFade }}>⇧⌘E</Mono>}
                onClick={() => setRoute("reports")}
              />
              <ListRow
                leading={<IconTile tone="sky" size={36}><Network size={16} strokeWidth={2} /></IconTile>}
                title="Open the graph studio"
                subtitle="Visualize entities and relations"
                trailing={<ArrowRight size={14} strokeWidth={2} color={colors.inkFade} />}
                onClick={() => setRoute("graph")}
              />
            </div>
          </Card>

          <Card padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
              <H3>Recent cases</H3>
              <Button variant="ghost" size="sm" onClick={() => setRoute("cases")}>
                View all
              </Button>
            </div>
            {recent.length === 0 ? (
              <div
                style={{
                  padding: "28px 18px",
                  textAlign: "center",
                  color: colors.inkMute,
                  borderRadius: radius.md,
                  background: colors.paperTile,
                }}
              >
                <BodySmall>No cases yet. Open one to get started.</BodySmall>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {recent.map((c) => (
                  <RecentCaseRow key={c.id} c={c} onClick={() => openCase(c.id)} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 28,
            borderTop: `1px solid ${colors.hairline}`,
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 32,
          }}
        >
          <div>
            <Eyebrow>Manifesto</Eyebrow>
            <Body style={{ marginTop: 8, color: colors.inkSoft, maxWidth: 460 }}>
              OSINT tools shouldn't look like 2008 forum software. Vellum is calm by design,
              forensic by default, and yours alone — your vault never leaves your machine
              without your signed consent.
            </Body>
          </div>
          <div>
            <Eyebrow>Stack</Eyebrow>
            <Mono style={{ marginTop: 8, display: "block", lineHeight: 1.7, color: colors.inkSoft }}>
              tauri 2 · rust · sqlcipher
              <br />
              react 18 · typescript · inter
              <br />
              cytoscape · framer-motion
            </Mono>
          </div>
          <div>
            <Eyebrow>Modules</Eyebrow>
            <Mono style={{ marginTop: 8, display: "block", lineHeight: 1.7, color: colors.ember }}>
              · graph studio
              <br />· timeline ledger
              <br />· enrichers (V0.4)
              <br />· report composer
            </Mono>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentCaseRow({ c, onClick }: { c: Case; onClick: () => void }) {
  const tone = toVisualAccent(c.accent);
  const surface = accentSurface[tone];
  const KindIcon = KIND_ICON[c.kind] ?? Diamond;
  return (
    <ListRow
      leading={
        <div
          style={{
            width: 36,
            height: 36,
            background: surface.soft,
            color: surface.fg,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <KindIcon size={16} strokeWidth={1.8} />
        </div>
      }
      title={c.title}
      subtitle={`${c.kind} · ${c.entityCount} entities · updated ${relTime(c.updatedAt)}`}
      trailing={<ArrowRight size={14} strokeWidth={2} color={colors.inkFade} />}
      onClick={onClick}
    />
  );
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function KpiCard({
  tone,
  label,
  value,
  sub,
  icon,
}: {
  tone: "ember" | "solar" | "moss" | "sky";
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card padding="20px 22px" rounded="lg">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>{label}</Eyebrow>
        <IconTile tone={tone} size={32}>
          {icon}
        </IconTile>
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 36,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          color: colors.ink,
        }}
      >
        {value}
      </div>
      <BodySmall style={{ marginTop: 4 }}>{sub}</BodySmall>
    </Card>
  );
}
