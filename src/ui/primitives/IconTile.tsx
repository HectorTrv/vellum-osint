import type { CSSProperties, ReactNode } from "react";
import { colors, accentSurface, type VisualAccent } from "@/ui/tokens/colors";

type Tone = VisualAccent | "ink" | "neutral";

type Props = {
  tone?: Tone;
  size?: number;
  filled?: boolean;
  shape?: "square" | "circle";
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * IconTile — soft, rounded-square container for an icon.
 *
 * Radii are bucketed to align with the global token system:
 *   ≤24 → 8 (xs)
 *   ≤32 → 10 (sm)
 *   ≤44 → 12
 *   ≤56 → 14 (md)
 *   else → 16
 */
function bucketRadius(size: number): number {
  if (size <= 24) return 8;
  if (size <= 32) return 10;
  if (size <= 44) return 12;
  if (size <= 56) return 14;
  return 16;
}

export function IconTile({
  tone = "neutral",
  size = 36,
  filled = false,
  shape = "square",
  children,
  style,
}: Props) {
  let bg: string = colors.paperWarm;
  let fg: string = colors.ink;

  if (tone === "ink") {
    bg = filled ? colors.ink : colors.paperWarm;
    fg = filled ? colors.paper : colors.ink;
  } else if (tone !== "neutral") {
    const a = accentSurface[tone];
    bg = filled ? a.bg : a.soft;
    fg = filled ? colors.paper : a.fg;
    if (tone === "solar" && filled) fg = colors.ink;
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: shape === "circle" ? 999 : bucketRadius(size),
        background: bg,
        color: fg,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Backward-compat alias for the previous circular component. Prefer IconTile. */
export const SoftIcon = IconTile;
