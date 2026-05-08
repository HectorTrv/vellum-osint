import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { colors } from "@/ui/tokens/colors";

/* ──────────────────────────────────────────────────────────
   Soft, modern decorative elements.
   The brutalist Wave/HalfDisk/Slash family was retired with
   the Yimgo-style refresh. What remains is calm: an ambient
   gradient orb, simple dots, and a very subtle paper grid.
   ────────────────────────────────────────────────────────── */

type ShapeProps = { size?: number; color?: string; style?: CSSProperties };

/** Gradient orb — soft, glowy, used as accent in headers */
export function Orb({
  size = 320,
  color = colors.ember,
  opacity = 0.55,
  style,
}: { size?: number; color?: string; opacity?: number; style?: CSSProperties }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 65%)`,
        opacity,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

/** Solid pill / dot */
export function Dot({ size = 24, color = colors.ink, style }: ShapeProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: color,
        borderRadius: 999,
        ...style,
      }}
    />
  );
}

/** Soft tile — rounded rectangle, used as a poster element */
export function Tile({
  w = 200,
  h = 120,
  color = colors.paperWarm,
  rounded = 18,
  style,
}: { w?: number; h?: number; color?: string; rounded?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: color,
        borderRadius: rounded,
        ...style,
      }}
    />
  );
}

/** Avatar stack — three small rounded squares with emoji, like the Memoji trio in Yimgo */
export function AvatarStack({
  items,
  size = 64,
  style,
}: {
  items: { bg: string; emoji: string }[];
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {items.map((it, i) => {
        const isCenter = i === Math.floor(items.length / 2);
        const offset = i - Math.floor(items.length / 2);
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size * 1.18,
              background: it.bg,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              fontSize: Math.round(size * 0.5),
              transform: `rotate(${offset * 6}deg) translateX(${offset * -size * 0.18}px)`,
              boxShadow: "0 8px 24px rgba(14,14,12,0.12)",
              zIndex: isCenter ? 2 : 1,
              border: `2px solid ${colors.paperLow}`,
            }}
          >
            {it.emoji}
          </div>
        );
      })}
    </div>
  );
}

/** Subtle paper grid — used inside Graph canvas for orientation */
export function PaperGrid({ style }: { style?: CSSProperties }) {
  // Two-layer grid: bold dots every 96px, faint dots every 24px.
  const faint = "rgba(14, 14, 12, 0.035)";
  const bold  = "rgba(14, 14, 12, 0.08)";
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `radial-gradient(${bold} 1.2px, transparent 1.2px), radial-gradient(${faint} 1px, transparent 1px)`,
        backgroundSize: "96px 96px, 24px 24px",
        backgroundPosition: "0 0, 0 0",
        ...style,
      }}
    />
  );
}
