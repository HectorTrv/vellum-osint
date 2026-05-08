import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { colors, radius, shadow } from "@/ui/tokens/colors";

export type MenuItem =
  | { kind: "item"; id: string; label: string; Icon?: LucideIcon; danger?: boolean; disabled?: boolean; shortcut?: string; onSelect: () => void }
  | { kind: "separator"; id: string };

type AnchorState = { x: number; y: number } | null;

type Props = {
  items: MenuItem[];
  children: (open: (e: React.MouseEvent) => void) => ReactNode;
  width?: number;
};

/**
 * ContextMenu — wrap a target with a render-prop that exposes an `open(event)`
 * handler. Designed for right-click but works as a "more" button menu too.
 */
export function ContextMenu({ items, children, width = 220 }: Props) {
  const [anchor, setAnchor] = useState<AnchorState>(null);
  const ref = useRef<HTMLDivElement>(null);

  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchor({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!anchor) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAnchor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAnchor(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor]);

  // Clamp to viewport
  const pos = anchor
    ? {
        x: Math.min(anchor.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - width - 8),
        y: Math.min(anchor.y, (typeof window !== "undefined" ? window.innerHeight : 800) - items.length * 36 - 16),
      }
    : null;

  return (
    <>
      {children(open)}
      <AnimatePresence>
        {pos && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -2 }}
            transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y,
              width,
              padding: 6,
              background: colors.paperLow,
              border: `1px solid ${colors.hairlineStrong}`,
              borderRadius: radius.md,
              boxShadow: shadow.lg,
              zIndex: 400,
              fontFamily: "var(--font-display)",
            }}
          >
            {items.map((it) => {
              if (it.kind === "separator") {
                return (
                  <div
                    key={it.id}
                    style={{
                      height: 1,
                      margin: "4px 6px",
                      background: colors.hairline,
                    }}
                  />
                );
              }
              return (
                <button
                  key={it.id}
                  disabled={it.disabled}
                  onClick={() => {
                    setAnchor(null);
                    it.onSelect();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "7px 9px",
                    borderRadius: radius.sm,
                    background: "transparent",
                    color: it.danger ? colors.ember : it.disabled ? colors.inkFade : colors.ink,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: it.disabled ? "not-allowed" : "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!it.disabled) e.currentTarget.style.background = it.danger ? colors.emberSoft : colors.paperWarm;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {it.Icon && <it.Icon size={14} strokeWidth={1.8} />}
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.shortcut && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        color: colors.inkFade,
                      }}
                    >
                      {it.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
