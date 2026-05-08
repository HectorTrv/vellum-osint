import { motion } from "framer-motion";
import {
  Copy,
  Trash2,
  Sparkles,
  X,
  Mail,
  Globe,
  Hash as HashIcon,
  Wallet,
  Phone,
  AtSign,
  User,
  Server,
  Link2,
  HelpCircle,
  Building2,
  MapPin,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { colors, radius, accentSurface, type VisualAccent, entityColor } from "@/ui/tokens/colors";
import { H3, Eyebrow, BodySmall, Mono } from "@/ui/typography/Type";
import { Button } from "@/ui/primitives/Button";
import { Badge } from "@/ui/primitives/Badge";
import { IconTile } from "@/ui/primitives/IconTile";
import type { Entity, Relation } from "@/lib/types";

const KIND_ICON: Record<string, LucideIcon> = {
  Person: User,
  Email: Mail,
  Username: AtSign,
  Phone: Phone,
  Domain: Globe,
  IP: Server,
  URL: Link2,
  Hash: HashIcon,
  Wallet: Wallet,
  Organization: Building2,
  Brand: Building2,
  Location: MapPin,
  SocialAccount: AtSign,
  Document: FileText,
  Custom: HelpCircle,
};

type Props = {
  entity: Entity;
  relations: Relation[];
  neighborsById: Map<string, Entity>;
  onClose: () => void;
  onDelete: () => void;
  onSelectNeighbor: (id: string) => void;
  onCopy: (text: string) => void;
};

export function Inspector({ entity, relations, neighborsById, onClose, onDelete, onSelectNeighbor, onCopy }: Props) {
  const tone = (entityColor[entity.kind] ?? "ember") as VisualAccent;
  const Icon = KIND_ICON[entity.kind] ?? HelpCircle;
  const surface = accentSurface[tone];

  const incoming = relations.filter((r) => r.toEntity === entity.id);
  const outgoing = relations.filter((r) => r.fromEntity === entity.id);
  const attrEntries = Object.entries(entity.attributes ?? {});

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      style={{
        width: 360,
        background: colors.paperLow,
        borderLeft: `1px solid ${colors.hairline}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: surface.soft,
          padding: "20px 22px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
          <IconTile tone={tone} size={42} filled style={{ flexShrink: 0 }}>
            <Icon size={18} strokeWidth={2} />
          </IconTile>
          <div style={{ minWidth: 0 }}>
            <Eyebrow>{entity.kind}</Eyebrow>
            <div
              style={{
                marginTop: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                fontWeight: 600,
                color: colors.ink,
                wordBreak: "break-all",
              }}
            >
              {entity.label}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            width: 28,
            height: 28,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            background: colors.paperLow,
            color: colors.inkMute,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
        {/* Meta */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge tone="paper">conf · {Math.round(entity.confidence * 100)}%</Badge>
          <Badge tone="paper">src · {entity.source}</Badge>
        </div>

        {/* Attributes */}
        {attrEntries.length > 0 && (
          <Section title="Attributes">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {attrEntries.map(([k, val]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    padding: "6px 10px",
                    background: colors.paperTile,
                    borderRadius: radius.sm,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.inkMute,
                      width: 90,
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {k}
                  </span>
                  <Mono
                    style={{
                      flex: 1,
                      color: colors.ink,
                      fontSize: 12,
                      wordBreak: "break-all",
                    }}
                  >
                    {Array.isArray(val) ? val.join(", ") : String(val)}
                  </Mono>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Relations */}
        <Section title={`Relations · ${incoming.length + outgoing.length}`}>
          {[...outgoing, ...incoming].length === 0 ? (
            <BodySmall style={{ color: colors.inkFade }}>No connections yet.</BodySmall>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {outgoing.map((r) => (
                <RelRow
                  key={r.id}
                  direction="out"
                  relKind={r.kind}
                  other={neighborsById.get(r.toEntity)}
                  onClick={() => onSelectNeighbor(r.toEntity)}
                />
              ))}
              {incoming.map((r) => (
                <RelRow
                  key={r.id}
                  direction="in"
                  relKind={r.kind}
                  other={neighborsById.get(r.fromEntity)}
                  onClick={() => onSelectNeighbor(r.fromEntity)}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Timestamps */}
        <Section title="Timestamps">
          <BodySmall style={{ color: colors.inkMute }}>
            <Mono>first seen {entity.firstSeen.slice(0, 19).replace("T", " ")}</Mono>
          </BodySmall>
          <BodySmall style={{ color: colors.inkMute }}>
            <Mono>last seen  {entity.lastSeen.slice(0, 19).replace("T", " ")}</Mono>
          </BodySmall>
        </Section>
      </div>

      {/* Action bar */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: `1px solid ${colors.hairline}`,
          display: "flex",
          gap: 8,
          background: colors.paperLow,
        }}
      >
        <Button
          size="sm"
          variant="primary"
          icon={<Sparkles size={14} strokeWidth={2} />}
          style={{ flex: 1 }}
          onClick={() => {}}
        >
          Enrich
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Copy size={13} strokeWidth={1.8} />}
          onClick={() => onCopy(entity.label)}
        >
          Copy
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<Trash2 size={13} strokeWidth={1.8} />}
          onClick={onDelete}
        />
      </div>
    </motion.aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <H3 style={{ fontSize: 12, color: colors.inkMute, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </H3>
      {children}
    </div>
  );
}

function RelRow({
  direction,
  relKind,
  other,
  onClick,
}: {
  direction: "in" | "out";
  relKind: string;
  other: Entity | undefined;
  onClick: () => void;
}) {
  if (!other) return null;
  const tone = (entityColor[other.kind] ?? "ember") as VisualAccent;
  const surface = accentSurface[tone];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px",
        background: "transparent",
        borderRadius: radius.sm,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 140ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = colors.paperTile)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: surface.fg,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: colors.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {other.label}
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 10,
              fontWeight: 600,
              color: colors.inkFade,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {direction === "out" ? "→" : "←"} {relKind}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 10,
              fontWeight: 600,
              color: surface.fg,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {other.kind}
          </span>
        </span>
      </span>
    </button>
  );
}
