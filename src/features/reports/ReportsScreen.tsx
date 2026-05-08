import { motion } from "framer-motion";
import {
  FileSignature,
  Boxes,
  Network,
  History,
  ShieldCheck,
  Paperclip,
  FileDown,
  FileCode,
  Check,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { colors, radius, shadow } from "@/ui/tokens/colors";
import { page } from "@/ui/tokens/layout";
import { H1, H3, Eyebrow, Body, BodySmall, Mono } from "@/ui/typography/Type";
import { Card } from "@/ui/primitives/Card";
import { Button } from "@/ui/primitives/Button";
import { Badge } from "@/ui/primitives/Badge";
import { IconTile } from "@/ui/primitives/IconTile";
import { ListRow } from "@/ui/primitives/ListRow";

const SECTIONS: {
  idx: string;
  title: string;
  Icon: LucideIcon;
  tone: "ember" | "solar" | "moss" | "sky";
  active?: boolean;
}[] = [
  { idx: "01", title: "Cover · Case Summary",       Icon: FileSignature, tone: "ember", active: true },
  { idx: "02", title: "Entities Index",             Icon: Boxes,         tone: "sky" },
  { idx: "03", title: "Relations Map",              Icon: Network,       tone: "moss" },
  { idx: "04", title: "Timeline · Ledger",          Icon: History,       tone: "solar" },
  { idx: "05", title: "Hash Chain Verification",    Icon: ShieldCheck,   tone: "ember" },
  { idx: "06", title: "Appendix · Attachments",     Icon: Paperclip,     tone: "sky" },
];

export function ReportsScreen() {
  return (
    <div style={{ ...page.standard }}>
      <div style={{ marginBottom: 28 }}>
        <Eyebrow>Composer · chain-of-custody report</Eyebrow>
        <H1 style={{ marginTop: 6 }}>Report</H1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 28 }}>
        {/* Editor side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <H3>Sections</H3>
              <Mono style={{ color: colors.inkFade }}>06</Mono>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SECTIONS.map((s) => (
                <ListRow
                  key={s.idx}
                  emphasis={s.active}
                  leading={
                    <IconTile tone={s.tone} size={36} filled={s.active}>
                      <s.Icon size={16} strokeWidth={1.8} />
                    </IconTile>
                  }
                  title={s.title}
                  subtitle={`Section ${s.idx}`}
                  trailing={<MoreHorizontal size={16} strokeWidth={1.8} color={colors.inkFade} />}
                />
              ))}
            </div>
          </Card>

          <Card tone="ink" padding="22px 24px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Eyebrow color={colors.solar}>Export</Eyebrow>
              <Badge tone="moss" dot>Chain verified</Badge>
            </div>
            <Body style={{ color: "rgba(245,239,224,0.85)" }}>
              PDF includes a verification page with the HMAC chain. Re-run via{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: colors.solar }}>
                vellum verify report.pdf
              </span>{" "}
              to confirm integrity.
            </Body>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="ember" size="md" icon={<FileDown size={16} strokeWidth={1.8} />}>
                Generate PDF
              </Button>
              <Button
                variant="ghost"
                size="md"
                icon={<FileCode size={16} strokeWidth={1.8} />}
                style={{
                  background: "rgba(245,239,224,0.08)",
                  color: colors.paper,
                }}
              >
                Markdown
              </Button>
            </div>
          </Card>
        </div>

        {/* A4 preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <div
            style={{
              aspectRatio: "1 / 1.414",
              background: colors.paperLow,
              borderRadius: radius.xl,
              boxShadow: shadow.lg,
              padding: "44px 48px",
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${colors.hairline}`,
            }}
          >
            {/* Page header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 16,
                borderBottom: `1px solid ${colors.hairline}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: colors.ink,
                    color: colors.paper,
                    borderRadius: radius.sm,
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  V
                </div>
                <Eyebrow>Vellum · case file 001</Eyebrow>
              </div>
              <Mono style={{ color: colors.inkFade }}>page 01 / 14</Mono>
            </div>

            {/* Title */}
            <div style={{ marginTop: 32 }}>
              <Badge tone="ember" dot>Confidential</Badge>
              <H1 style={{ marginTop: 12 }}>Threat Actor — Vermilion</H1>
              <BodySmall style={{ marginTop: 8, color: colors.inkMute }}>
                Compiled 2026-04-26 · 142 entities · 88 enrichments · ledger verified.
              </BodySmall>
            </div>

            {/* Stat chips */}
            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Chip tone="ember" Icon={Boxes}       label="142"   sub="entities" />
              <Chip tone="moss"  Icon={Sparkles}    label="88"    sub="enriched" />
              <Chip tone="solar" Icon={History}     label="07"    sub="events" />
              <Chip tone="sky"   Icon={ShieldCheck} label="OK"    sub="chain ok" />
            </div>

            {/* Body sample */}
            <div style={{ marginTop: 28 }}>
              <Eyebrow>§01 · Summary</Eyebrow>
              <Body style={{ marginTop: 8 }}>
                The actor known as Vermilion operates a small constellation of phishing infrastructure
                anchored on{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: colors.ember }}>vermilion.run</span>,
                leveraging short-lived domains rotated weekly. Initial discovery via leaked credentials
                cross-referenced with breach corpora.
              </Body>
            </div>

            {/* Footer chip */}
            <div
              style={{
                position: "absolute",
                left: 48,
                bottom: 28,
                display: "flex",
                gap: 8,
              }}
            >
              <Badge tone="paper">Issue 001</Badge>
              <Badge tone="ember">Confidential</Badge>
            </div>

            {/* Stamp */}
            <div
              style={{
                position: "absolute",
                right: 36,
                bottom: 28,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px 8px 8px",
                background: colors.emberSoft,
                borderRadius: radius.pill,
                border: `1px solid ${colors.ember}`,
              }}
            >
              <IconTile tone="ember" size={26} filled>
                <Check size={12} strokeWidth={2.5} />
              </IconTile>
              <Mono style={{ color: colors.ember, fontSize: 11 }}>HMAC · 0xb103…aae0</Mono>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Chip({
  tone,
  Icon,
  label,
  sub,
}: {
  tone: "ember" | "solar" | "moss" | "sky";
  Icon: LucideIcon;
  label: string;
  sub: string;
}) {
  const bg =
    tone === "ember" ? colors.emberSoft :
    tone === "solar" ? colors.solarSoft :
    tone === "moss"  ? colors.mossSoft  :
                       colors.skySoft;
  const fg =
    tone === "ember" ? colors.ember :
    tone === "solar" ? "#A07810" :
    tone === "moss"  ? colors.moss :
                       colors.sky;
  return (
    <div
      style={{
        background: bg,
        color: fg,
        padding: "12px 14px",
        borderRadius: radius.lg,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 96,
      }}
    >
      <Icon size={14} strokeWidth={2} style={{ opacity: 0.85 }} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", marginTop: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.75 }}>{sub}</span>
    </div>
  );
}
