import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Move,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Network as NetworkIcon,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { colors, radius, shadow, accentSurface, type VisualAccent, entityColor } from "@/ui/tokens/colors";
import { H1, Mono, BodySmall } from "@/ui/typography/Type";
import { Button } from "@/ui/primitives/Button";
import { IconTile } from "@/ui/primitives/IconTile";
import { Tooltip } from "@/ui/primitives/Tooltip";
import { Spinner } from "@/ui/primitives/Spinner";
import { EntityQuickInput } from "@/ui/primitives/EntityQuickInput";
import { PaperGrid } from "@/ui/shapes/Shapes";
import { useRouter } from "@/app/router";
import { useCases } from "@/lib/casesStore";
import { useEntities } from "@/lib/entitiesStore";
import { layout } from "@/lib/graphLayout";
import { toast } from "@/lib/toasts";
import type { Entity, Relation } from "@/lib/types";
import { Inspector } from "./Inspector";

const SVG_W = 1100;
const SVG_H = 600;

export function GraphScreen() {
  const cases = useCases((s) => s.cases);
  const routerCaseId = useRouter((s) => s.caseId);
  const setRoute = useRouter((s) => s.setRoute);
  const openCase = useRouter((s) => s.openCase);
  const byCase = useEntities((s) => s.byCase);
  const loadEntities = useEntities((s) => s.load);
  const createEntity = useEntities((s) => s.createEntity);
  const deleteEntity = useEntities((s) => s.deleteEntity);

  // Resolve current case: explicit id from router OR most-recently-updated active
  const activeCaseId = useMemo(() => {
    if (routerCaseId) return routerCaseId;
    const active = cases.filter((c) => c.status !== "Archived");
    if (active.length === 0) return null;
    return [...active].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].id;
  }, [routerCaseId, cases]);

  const c = activeCaseId ? cases.find((x) => x.id === activeCaseId) : null;
  const bucket = activeCaseId ? byCase[activeCaseId] : undefined;
  const entities = bucket?.entities ?? [];
  const relations = bucket?.relations ?? [];

  useEffect(() => {
    if (activeCaseId) loadEntities(activeCaseId);
  }, [activeCaseId, loadEntities]);

  // Layout — recompute when entity ids change (not on selection)
  const entityIds = entities.map((e) => e.id).join("|");
  const positions = useMemo(() => {
    if (entities.length === 0) return new Map();
    return layout(
      entities.map((e) => ({ id: e.id })),
      relations.map((r) => ({ from: r.fromEntity, to: r.toEntity })),
      SVG_W,
      SVG_H,
      activeCaseId ?? "vellum"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityIds, activeCaseId]);

  // Degree map (used for sizing nodes)
  const degreeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of relations) {
      m.set(r.fromEntity, (m.get(r.fromEntity) ?? 0) + 1);
      m.set(r.toEntity, (m.get(r.toEntity) ?? 0) + 1);
    }
    return m;
  }, [relations]);

  // Filters: visible kinds
  const allKinds = useMemo(() => Array.from(new Set(entities.map((e) => e.kind))).sort(), [entities]);
  const [hiddenKinds, setHiddenKinds] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const isVisible = useCallback((kind: string) => !hiddenKinds.has(kind), [hiddenKinds]);

  const visibleEntities = useMemo(() => entities.filter((e) => isVisible(e.kind)), [entities, isVisible]);
  const visibleEntityIds = useMemo(() => new Set(visibleEntities.map((e) => e.id)), [visibleEntities]);
  const visibleRelations = useMemo(
    () => relations.filter((r) => visibleEntityIds.has(r.fromEntity) && visibleEntityIds.has(r.toEntity)),
    [relations, visibleEntityIds]
  );

  // Selection
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedId(null);
  }, [activeCaseId]);

  const selectedEntity = selectedId ? entities.find((e) => e.id === selectedId) ?? null : null;
  const neighborsById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);

  // Pan + zoom
  const [view, setView] = useState({ tx: 0, ty: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setView((v) => {
      const nextScale = Math.max(0.4, Math.min(2.5, v.scale * (1 + delta)));
      return { ...v, scale: nextScale };
    });
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-node]")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: view.tx, ty: view.ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setView((v) => ({ ...v, tx: dragRef.current!.tx + dx, ty: dragRef.current!.ty + dy }));
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };
  const onBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-node]")) return;
    if (dragRef.current) return;
    setSelectedId(null);
  };

  const fitToView = () => setView({ tx: 0, ty: 0, scale: 1 });
  const zoomIn = () => setView((v) => ({ ...v, scale: Math.min(2.5, v.scale * 1.15) }));
  const zoomOut = () => setView((v) => ({ ...v, scale: Math.max(0.4, v.scale / 1.15) }));

  const focusNode = (id: string) => {
    setSelectedId(id);
    const p = positions.get(id);
    if (p) {
      // Centre the view on the node
      setView((v) => ({
        ...v,
        tx: SVG_W / 2 - p.x * v.scale,
        ty: SVG_H / 2 - p.y * v.scale,
      }));
    }
  };

  // Empty state
  if (!c) {
    return (
      <div style={{ padding: "60px 56px", textAlign: "center" }}>
        <IconTile tone="ember" size={56} style={{ margin: "0 auto" }}>
          <NetworkIcon size={24} strokeWidth={1.6} />
        </IconTile>
        <H1 style={{ marginTop: 16, fontSize: 28 }}>No case to graph</H1>
        <BodySmall style={{ color: colors.inkMute, marginTop: 8 }}>
          Open or create a case from the Cases screen first.
        </BodySmall>
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" size="md" onClick={() => setRoute("cases")}>
            Browse cases
          </Button>
        </div>
      </div>
    );
  }

  const tone = c.accent === "ink" ? "sky" : (c.accent as VisualAccent);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Main column: header + canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        {/* ── Single header bar ──────────────────────────────── */}
        <div
          style={{
            height: 52,
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: `1px solid ${colors.hairline}`,
            background: colors.paper,
            flexShrink: 0,
          }}
        >
          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={13} strokeWidth={1.8} />}
            onClick={() => openCase(c.id)}
          >
            {c.title}
          </Button>

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: colors.hairlineStrong, flexShrink: 0 }} />

          {/* Section label */}
          <Mono style={{ color: colors.inkMute, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Graph
          </Mono>

          {/* Status dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: c.status === "Active" ? colors.moss : c.status === "Idle" ? colors.solar : colors.inkFade,
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }} />

          {/* Entity / relation count */}
          <Mono style={{ color: colors.inkFade, fontSize: 11 }}>
            {visibleEntities.length}e · {visibleRelations.length}r
          </Mono>

          <div style={{ width: 1, height: 18, background: colors.hairline, flexShrink: 0 }} />

          {/* Layout icon buttons */}
          <Tooltip label="Force layout" side="bottom">
            <button style={toolBtn}><Move size={14} strokeWidth={1.8} /></button>
          </Tooltip>
          <Tooltip label="Layer view" side="bottom">
            <button style={toolBtn}><Layers size={14} strokeWidth={1.8} /></button>
          </Tooltip>
          <Tooltip label="Enrich all entities" side="bottom">
            <button style={{ ...toolBtn, color: colors.moss }}><Sparkles size={14} strokeWidth={1.8} /></button>
          </Tooltip>

          <div style={{ width: 1, height: 18, background: colors.hairline, flexShrink: 0 }} />

          {/* Add entity */}
          <Tooltip label="Add entity" side="bottom">
            <button
              style={{
                ...toolBtn,
                background: showAdd ? colors.ink : "transparent",
                color: showAdd ? colors.paper : colors.inkMute,
                borderRadius: radius.sm,
              }}
              onClick={() => setShowAdd((v) => !v)}
            >
              {showAdd ? <X size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            </button>
          </Tooltip>
        </div>

        {/* ── Add-entity drawer (only when open) ─────────────── */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              style={{ overflow: "hidden", borderBottom: `1px solid ${colors.hairline}`, background: colors.paperLow }}
            >
              <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <EntityQuickInput
                  autoFocus
                  placeholder="Paste an email, IP, domain, hash… · Enter to add"
                  onCommit={async (label, kind) => {
                    try {
                      await createEntity({ caseId: c.id, kind, label });
                      toast.success("Entity added", `${kind} · ${label}`);
                      setShowAdd(false);
                    } catch (e) {
                      toast.error("Failed to add entity", String(e));
                    }
                  }}
                />
                <Mono style={{ color: colors.inkFade, fontSize: 11, whiteSpace: "nowrap" }}>↵ add · Esc cancel</Mono>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: colors.paperLow,
            overflow: "hidden",
          }}
          onWheel={onWheel}
        >
          <PaperGrid />

          {bucket?.loading ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: colors.inkMute,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Spinner size={14} />
                <span>Loading graph…</span>
              </div>
            </div>
          ) : entities.length === 0 ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                padding: 40,
              }}
            >
              <div>
                <IconTile tone={tone} size={56} style={{ margin: "0 auto" }}>
                  <NetworkIcon size={24} strokeWidth={1.6} />
                </IconTile>
                <H1 style={{ marginTop: 16, fontSize: 22 }}>This dossier is empty</H1>
                <BodySmall style={{ color: colors.inkMute, marginTop: 6 }}>
                  Drop an email, IP, domain or hash into the toolbar above to plot it on the canvas.
                </BodySmall>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                cursor: dragRef.current ? "grabbing" : "grab",
                userSelect: "none",
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onClick={onBackgroundClick}
            >
              <defs>
                <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="3" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={`translate(${view.tx}, ${view.ty}) scale(${view.scale})`}>
                {/* Edges */}
                {visibleRelations.map((r) => {
                  const isHighlighted =
                    (!!selectedId && (r.fromEntity === selectedId || r.toEntity === selectedId)) ||
                    (!selectedId && !!hoveredId && (r.fromEntity === hoveredId || r.toEntity === hoveredId));
                  const isDimmed =
                    (!!selectedId && r.fromEntity !== selectedId && r.toEntity !== selectedId) ||
                    (!selectedId && !!hoveredId && r.fromEntity !== hoveredId && r.toEntity !== hoveredId);
                  // Hide labels at low zoom for legibility
                  const showLabels = view.scale >= 0.75;
                  return (
                    <EdgeLine
                      key={r.id}
                      rel={r}
                      a={positions.get(r.fromEntity)}
                      b={positions.get(r.toEntity)}
                      highlighted={isHighlighted}
                      dimmed={isDimmed}
                      showLabels={showLabels}
                    />
                  );
                })}
                {/* Nodes */}
                {visibleEntities.map((e) => {
                  const p = positions.get(e.id);
                  if (!p) return null;
                  return (
                    <NodeCircle
                      key={e.id}
                      entity={e}
                      x={p.x}
                      y={p.y}
                      degree={degreeMap.get(e.id) ?? 0}
                      selected={selectedId === e.id}
                      hovered={hoveredId === e.id}
                      dimmed={
                        (!!selectedId && selectedId !== e.id && !isNeighbor(e.id, selectedId, relations)) ||
                        (!selectedId && !!hoveredId && hoveredId !== e.id && !isNeighbor(e.id, hoveredId, relations))
                      }
                      onSelect={() => focusNode(e.id)}
                      onHover={(over) => setHoveredId(over ? e.id : null)}
                    />
                  );
                })}
              </g>
            </svg>
          )}

          {/* Floating zoom controls */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              gap: 6,
              padding: 6,
              background: colors.paperLow,
              border: `1px solid ${colors.hairline}`,
              borderRadius: radius.pill,
              boxShadow: shadow.sm,
            }}
          >
            <Tooltip label="Zoom in" side="top">
              <button onClick={zoomIn} style={iconBtn}><ZoomIn size={14} strokeWidth={1.8} /></button>
            </Tooltip>
            <Tooltip label="Zoom out" side="top">
              <button onClick={zoomOut} style={iconBtn}><ZoomOut size={14} strokeWidth={1.8} /></button>
            </Tooltip>
            <Tooltip label="Fit to view" side="top">
              <button onClick={fitToView} style={iconBtn}><Maximize2 size={14} strokeWidth={1.8} /></button>
            </Tooltip>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: colors.inkMute,
              }}
            >
              {Math.round(view.scale * 100)}%
            </span>
          </div>

          {/* Kind filter legend — floating bottom-left */}
          {allKinds.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                padding: "6px 10px",
                background: colors.paper,
                border: `1px solid ${colors.hairline}`,
                borderRadius: radius.lg,
                boxShadow: shadow.sm,
              }}
            >
              {allKinds.map((k) => {
                const tone = entityColor[k] ?? "ember";
                const surf = accentSurface[tone];
                const hidden = hiddenKinds.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => {
                      const next = new Set(hiddenKinds);
                      if (next.has(k)) next.delete(k);
                      else next.add(k);
                      setHiddenKinds(next);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 2px",
                      background: "transparent",
                      cursor: "pointer",
                      opacity: hidden ? 0.38 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: surf.fg,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: hidden ? colors.inkFade : colors.inkSoft,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {k}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: colors.inkFade,
                        marginLeft: "auto",
                        paddingLeft: 8,
                      }}
                    >
                      {entities.filter((e) => e.kind === k).length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Inspector */}
      <AnimatePresence>
        {selectedEntity && (
          <Inspector
            key={selectedEntity.id}
            entity={selectedEntity}
            relations={relations.filter((r) => r.fromEntity === selectedEntity.id || r.toEntity === selectedEntity.id)}
            neighborsById={neighborsById}
            onClose={() => setSelectedId(null)}
            onSelectNeighbor={(id) => focusNode(id)}
            onCopy={(text) => {
              navigator.clipboard?.writeText(text);
              toast.success("Copied", text);
            }}
            onDelete={async () => {
              try {
                await deleteEntity(selectedEntity.id, c.id);
                setSelectedId(null);
                toast.show("Entity removed", selectedEntity.label);
              } catch (e) {
                toast.error("Could not delete", String(e));
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function isNeighbor(a: string, b: string, relations: Relation[]): boolean {
  return relations.some(
    (r) => (r.fromEntity === a && r.toEntity === b) || (r.fromEntity === b && r.toEntity === a)
  );
}

const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  background: "transparent",
  color: colors.inkMute,
  cursor: "pointer",
};

const toolBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  borderRadius: 8,
  background: "transparent",
  color: colors.inkMute,
  cursor: "pointer",
  flexShrink: 0,
};

function NodeCircle({
  entity,
  x,
  y,
  degree,
  selected,
  hovered,
  dimmed,
  onSelect,
  onHover,
}: {
  entity: Entity;
  x: number;
  y: number;
  degree: number;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  onSelect: () => void;
  onHover: (over: boolean) => void;
}) {
  const tone = entityColor[entity.kind] ?? "ember";
  const surface = accentSurface[tone];
  // Size by degree — keeps lower-density nodes calm, hubs visible
  const r = 18 + Math.min(degree, 8) * 1.4;
  const opacity = dimmed ? 0.32 : 1;
  const fg = tone === "solar" ? colors.ink : colors.paper;
  const labelText = truncate(entity.label, 14);

  return (
    <motion.g
      data-node
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity, scale: selected || hovered ? 1.06 : 1 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Soft halo when selected */}
      {selected && (
        <circle
          cx={x}
          cy={y}
          r={r + 14}
          fill={surface.bg}
          opacity={0.18}
        />
      )}
      {/* Selection ring — solid, brand colour */}
      {(selected || hovered) && (
        <circle
          cx={x}
          cy={y}
          r={r + 5}
          fill="none"
          stroke={surface.fg}
          strokeWidth={selected ? 2.25 : 1.5}
          opacity={selected ? 0.95 : 0.55}
        />
      )}
      {/* Drop shadow */}
      <circle cx={x} cy={y + 2} r={r} fill="rgba(14,14,12,0.18)" />
      {/* Body */}
      <circle cx={x} cy={y} r={r} fill={surface.bg} />
      {/* Label inside */}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="JetBrains Mono"
        fontSize={Math.max(9, Math.min(11, r * 0.36))}
        fontWeight={600}
        fill={fg}
        style={{ pointerEvents: "none", letterSpacing: "-0.005em" }}
      >
        {labelText}
      </text>
      {/* Kind tag below the node */}
      <g style={{ pointerEvents: "none" }} opacity={selected || hovered ? 1 : 0.62}>
        <rect
          x={x - 22}
          y={y + r + 6}
          width={44}
          height={14}
          rx={7}
          fill={colors.paperLow}
          stroke={colors.hairlineStrong}
          strokeWidth={0.6}
        />
        <text
          x={x}
          y={y + r + 13}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Inter"
          fontSize={8.5}
          fontWeight={700}
          fill={surface.fg}
          style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          {entity.kind}
        </text>
      </g>
    </motion.g>
  );
}

function EdgeLine({
  rel,
  a,
  b,
  highlighted,
  dimmed,
  showLabels,
}: {
  rel: Relation;
  a: { x: number; y: number } | undefined;
  b: { x: number; y: number } | undefined;
  highlighted: boolean;
  dimmed: boolean;
  showLabels: boolean;
}) {
  if (!a || !b) return null;
  const stroke = highlighted ? colors.ink : colors.hairlineStrong;
  const baseOpacity = dimmed ? 0.12 : highlighted ? 1 : 0.55;
  const labelOpacity = dimmed ? 0 : highlighted ? 1 : 0.5;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeOpacity={baseOpacity}
        strokeWidth={highlighted ? 1.8 : 1.1}
        strokeLinecap="round"
      />
      {showLabels && (
        <g opacity={labelOpacity}>
          <rect
            x={mx - rel.kind.length * 3.1 - 6}
            y={my - 8}
            width={rel.kind.length * 6.2 + 12}
            height={15}
            rx={4}
            fill={colors.paperLow}
            stroke={highlighted ? colors.ink : "transparent"}
            strokeWidth={0.6}
          />
          <text
            x={mx}
            y={my - 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="JetBrains Mono"
            fontSize={9}
            fontWeight={500}
            fill={highlighted ? colors.ink : colors.inkMute}
            style={{ letterSpacing: "0.02em" }}
          >
            {rel.kind}
          </text>
        </g>
      )}
    </g>
  );
}


function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}
