import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Shield,
  UserSearch,
  Sparkles,
  Diamond,
  FolderOpen,
  Archive,
  RotateCcw,
  Pin,
  PinOff,
  ArrowUpDown,
  Pencil,
  Share2,
  MoreHorizontal,
  Network,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  colors,
  radius,
  shadow,
  accentSurface,
  toVisualAccent,
} from "@/ui/tokens/colors";
import { Display, H3, Eyebrow, Body, BodySmall, Mono } from "@/ui/typography/Type";
import { Card } from "@/ui/primitives/Card";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { IconTile } from "@/ui/primitives/IconTile";
import { Stat } from "@/ui/primitives/Stat";
import { Tooltip } from "@/ui/primitives/Tooltip";
import { Spinner } from "@/ui/primitives/Spinner";
import { ContextMenu, type MenuItem } from "@/ui/primitives/ContextMenu";
import { Orb } from "@/ui/shapes/Shapes";
import { NewCaseModal } from "./NewCaseModal";
import { useCases, sortCases, type SortKey } from "@/lib/casesStore";
import { page } from "@/ui/tokens/layout";
import { useRouter } from "@/app/router";
import { isTauri } from "@/lib/api";
import { toast } from "@/lib/toasts";
import type { Case, CaseStatus } from "@/lib/types";

const STATUS_TONE: Record<CaseStatus, "moss" | "solar" | "neutral"> = {
  Active: "moss",
  Idle: "solar",
  Archived: "neutral",
};

const KIND_ICON: Record<string, LucideIcon> = {
  Cyber: Shield,
  Person: UserSearch,
  Brand: Sparkles,
  Custom: Diamond,
};

const SORT_LABEL: Record<SortKey, string> = {
  updated: "Recently updated",
  alpha: "Alphabetical",
  kind: "Kind",
  size: "Largest first",
};

export function CasesScreen() {
  const cases = useCases((s) => s.cases);
  const loading = useCases((s) => s.loading);
  const error = useCases((s) => s.error);
  const archive = useCases((s) => s.archive);
  const rename = useCases((s) => s.rename);
  const togglePin = useCases((s) => s.togglePin);
  const isPinned = useCases((s) => s.isPinned);
  const sort = useCases((s) => s.sort);
  const setSort = useCases((s) => s.setSort);
  const density = useCases((s) => s.density);
  const openCase = useRouter((s) => s.openCase);
  const setRoute = useRouter((s) => s.setRoute);

  const [filter, setFilter] = useState<"All" | CaseStatus>("All");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return cases.filter((c) => {
      if (filter !== "All" && c.status !== filter) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cases, filter, query]);

  const pinned = useCases((s) => s.pinned);
  const sorted = useMemo(() => sortCases(filtered, pinned, sort), [filtered, pinned, sort]);

  const counts = useMemo(
    () => ({
      all: cases.length,
      active: cases.filter((c) => c.status === "Active").length,
      idle: cases.filter((c) => c.status === "Idle").length,
      archived: cases.filter((c) => c.status === "Archived").length,
    }),
    [cases]
  );

  const cardMinSize = density === "compact" ? 280 : 320;

  return (
    <div style={{ ...page.standard, position: "relative" }}>
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
      >
        <Orb size={400} color={colors.solar} opacity={0.16} style={{ position: "absolute", right: -100, top: -80 }} />
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <Eyebrow>Folder · open dossiers</Eyebrow>
          <Display style={{ marginTop: 4 }}>Cases</Display>
          <BodySmall style={{ maxWidth: 540, marginTop: 10, color: colors.inkMute }}>
            {isTauri
              ? "Your dossiers — sealed locally in an encrypted vault. Press ⌘N to open a new one, ⌘K to search."
              : "Web preview · running without the Tauri vault. Cases below are mocked in memory."}
          </BodySmall>
        </div>

        {/* Toolbar — single flat row */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {/* Search */}
          <div style={{ width: 260 }}>
            <Input
              placeholder="Search dossiers…"
              leading={<Search size={14} strokeWidth={1.8} />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: colors.hairlineStrong, flexShrink: 0 }} />

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 4 }}>
            <FilterChip active={filter === "All"}      onClick={() => setFilter("All")}      label="All"      count={counts.all} />
            <FilterChip active={filter === "Active"}   onClick={() => setFilter("Active")}   label="Active"   count={counts.active}   tone="moss" />
            <FilterChip active={filter === "Idle"}     onClick={() => setFilter("Idle")}     label="Idle"     count={counts.idle}     tone="solar" />
            <FilterChip active={filter === "Archived"} onClick={() => setFilter("Archived")} label="Archived" count={counts.archived} />
          </div>

          <div style={{ flex: 1 }} />

          {/* Sort + New */}
          <SortMenu
            open={sortMenuOpen}
            setOpen={setSortMenuOpen}
            current={sort}
            onPick={(s) => {
              setSort(s);
              setSortMenuOpen(false);
            }}
          />
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} strokeWidth={2.2} />}
            onClick={() => setModalOpen(true)}
          >
            New case
          </Button>
        </div>

        {error && (
          <Card tone="ember" padding="12px 16px" elevation="none" style={{ marginBottom: 16 }}>
            <Mono style={{ color: colors.ember }}>error · {error}</Mono>
          </Card>
        )}

        {loading && cases.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: colors.inkMute }}>
            <Spinner size={14} />
            <Body style={{ color: colors.inkMute }}>Loading vault…</Body>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState onCreate={() => setModalOpen(true)} hasAny={cases.length > 0} />
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinSize}px, 1fr))`,
              gap: density === "compact" ? 14 : 20,
            }}
          >
            {sorted.map((c) => (
              <CaseCard
                key={c.id}
                c={c}
                density={density}
                pinned={isPinned(c.id)}
                onOpen={() => openCase(c.id)}
                onArchive={() => archive(c.id)}
                onTogglePin={() => togglePin(c.id)}
                onRename={(t) => rename(c.id, t)}
                renaming={renamingId === c.id}
                setRenaming={(v) => setRenamingId(v ? c.id : null)}
                onShare={() => setRoute("reports")}
              />
            ))}
          </motion.div>
        )}

        <NewCaseModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </div>
  );
}

function SortMenu({
  open,
  setOpen,
  current,
  onPick,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  current: SortKey;
  onPick: (s: SortKey) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, setOpen]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Button
        variant="secondary"
        size="md"
        icon={<ArrowUpDown size={14} strokeWidth={1.8} />}
        onClick={() => setOpen(!open)}
      >
        {SORT_LABEL[current]}
      </Button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16 }}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: 220,
            padding: 6,
            background: colors.paperLow,
            border: `1px solid ${colors.hairlineStrong}`,
            borderRadius: radius.md,
            boxShadow: shadow.lg,
            zIndex: 30,
          }}
        >
          {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 10px",
                borderRadius: radius.sm,
                background: s === current ? colors.paperWarm : "transparent",
                color: colors.ink,
                fontFamily: "var(--font-display)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ flex: 1 }}>{SORT_LABEL[s]}</span>
              {s === current && (
                <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.ink }} />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function FilterChip({
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
        height: 36,
        padding: "0 12px",
        background: active ? colors.ink : "transparent",
        color: active ? colors.paper : colors.inkMute,
        border: `1px solid ${active ? colors.ink : colors.hairlineStrong}`,
        borderRadius: radius.pill,
        fontFamily: "var(--font-display)",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "background 140ms, color 140ms, border-color 140ms",
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          padding: "1px 5px",
          borderRadius: 999,
          background: active ? "rgba(128,128,128,0.18)" : tone === "moss" ? colors.mossSoft : tone === "solar" ? colors.solarSoft : colors.paperWarm,
          color: active ? colors.paper : accent,
        }}
      >
        {String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

const cardAction = (bg: string, color: string): React.CSSProperties => ({
  width: 28,
  height: 28,
  display: "grid",
  placeItems: "center",
  borderRadius: 8,
  background: bg,
  color,
  cursor: "pointer",
  flexShrink: 0,
});

type CaseCardProps = {
  c: Case;
  density: "comfortable" | "compact";
  pinned: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onTogglePin: () => void;
  onRename: (t: string) => void | Promise<void>;
  renaming: boolean;
  setRenaming: (v: boolean) => void;
  onShare: () => void;
};

function CaseCard({
  c,
  density,
  pinned,
  onOpen,
  onArchive,
  onTogglePin,
  onRename,
  renaming,
  setRenaming,
  onShare,
}: CaseCardProps) {
  const ratio = c.entityCount > 0 ? Math.round((c.relationCount / c.entityCount) * 100) : 0;
  const tone = toVisualAccent(c.accent);
  const surface = accentSurface[tone];
  const KindIcon = KIND_ICON[c.kind] ?? Diamond;
  const isArchived = c.status === "Archived";

  const menuItems: MenuItem[] = [
    { kind: "item", id: "open",   label: "Open case",                      Icon: Network, onSelect: onOpen, shortcut: "↵" },
    { kind: "item", id: "rename", label: "Rename",                         Icon: Pencil,  onSelect: () => setRenaming(true) },
    { kind: "item", id: "pin",    label: pinned ? "Unpin" : "Pin to top",  Icon: pinned ? PinOff : Pin, onSelect: onTogglePin },
    { kind: "item", id: "share",  label: "Generate report",                Icon: Share2,  onSelect: onShare },
    { kind: "separator", id: "s1" },
    { kind: "item", id: "archive", label: isArchived ? "Restore" : "Archive", Icon: isArchived ? RotateCcw : Archive, onSelect: onArchive },
    { kind: "item", id: "delete",  label: "Delete (V0.3)",                 Icon: Trash2, danger: true, disabled: true, onSelect: () => {} },
  ];

  const pad = density === "compact" ? "16px 20px" : "20px 24px";

  return (
    <ContextMenu items={menuItems}>
      {(open) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
          }}
          onContextMenu={open}
        >
          <Card
            hover
            padding={0}
            rounded="xl"
            style={{
              overflow: "hidden",
              position: "relative",
              borderTop: `2.5px solid ${surface.fg}`,
            }}
          >
            <div style={{ padding: pad }}>
              {/* Header row: icon + meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <IconTile tone={tone} size={36} filled>
                  <KindIcon size={15} strokeWidth={2} />
                </IconTile>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Eyebrow>{c.kind}</Eyebrow>
                    {pinned && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1px 6px", borderRadius: 999,
                        background: colors.ink, color: colors.paper,
                        fontFamily: "var(--font-display)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em",
                      }}>
                        <Pin size={8} strokeWidth={2.2} fill={colors.paper} /> pinned
                      </span>
                    )}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[c.status]} dot={c.status === "Active"}>
                  {c.status}
                </Badge>
              </div>

              {/* Title */}
              {renaming ? (
                <RenameInput
                  initial={c.title}
                  onCommit={async (next) => {
                    if (next && next !== c.title) {
                      await onRename(next);
                      toast.success("Case renamed", next);
                    }
                    setRenaming(false);
                  }}
                  onCancel={() => setRenaming(false)}
                />
              ) : (
                <div onClick={onOpen} style={{ cursor: "pointer" }}>
                  <H3 style={{ fontSize: density === "compact" ? 16 : 17, lineHeight: 1.25 }}>
                    {c.title}
                  </H3>
                </div>
              )}

              {/* Subtitle */}
              <Mono style={{ marginTop: 6, color: colors.inkFade, fontSize: 11.5 }}>
                Updated {relativeTime(c.updatedAt)}
                {c.entityCount > 0 ? ` · ${c.relationCount}/${c.entityCount} relations` : " · empty dossier"}
              </Mono>

              {/* Stats footer */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: `1px solid ${colors.hairline}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Stat label="entities"  value={c.entityCount} />
                <Stat label="relations" value={c.relationCount} />
                <Stat label="ratio"     value={`${ratio}%`} />
                <div style={{ flex: 1 }} />
                <Tooltip label={pinned ? "Unpin" : "Pin to top"} side="top">
                  <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                    aria-label={pinned ? "Unpin" : "Pin"}
                    style={cardAction(pinned ? colors.ink : "transparent", pinned ? colors.paper : colors.inkFade)}
                  >
                    {pinned ? <PinOff size={13} strokeWidth={1.8} /> : <Pin size={13} strokeWidth={1.8} />}
                  </button>
                </Tooltip>
                <Tooltip label="More" side="top">
                  <button
                    onClick={(e) => { e.stopPropagation(); open(e); }}
                    aria-label="More"
                    style={cardAction("transparent", colors.inkFade)}
                  >
                    <MoreHorizontal size={13} strokeWidth={1.8} />
                  </button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </ContextMenu>
  );
}

function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (next: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value.trim());
        else if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onCommit(value.trim())}
      style={{
        marginTop: 6,
        background: colors.paperTile,
        border: `1px solid ${colors.hairlineStrong}`,
        borderRadius: radius.sm,
        padding: "6px 10px",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 17,
        color: colors.ink,
        outline: 0,
        width: "100%",
      }}
    />
  );
}

function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <Card padding="56px 24px" rounded="xl" style={{ textAlign: "center" }}>
      <div style={{ display: "grid", placeItems: "center", marginBottom: 18 }}>
        <IconTile tone="ember" size={56}>
          <FolderOpen size={24} strokeWidth={1.6} />
        </IconTile>
      </div>
      <H3>{hasAny ? "No matches" : "Vault is empty"}</H3>
      <BodySmall style={{ color: colors.inkMute, maxWidth: 420, margin: "8px auto 20px" }}>
        {hasAny
          ? "Nothing matches the current filter or search. Try clearing them."
          : "Cases are sealed locally in an encrypted vault. Each action is recorded in a tamper-proof ledger."}
      </BodySmall>
      {!hasAny && (
        <Button variant="primary" size="md" icon={<Plus size={16} strokeWidth={2.2} />} onClick={onCreate}>
          Open your first case
        </Button>
      )}
    </Card>
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
