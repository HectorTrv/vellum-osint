import type { ReactNode } from "react";
import { colors, radius } from "@/ui/tokens/colors";

type Tone = "ink" | "ember" | "solar" | "moss" | "sky" | "paper" | "neutral";
type Size = "xs" | "sm";

const map = {
  ink:     { bg: colors.ink,        fg: colors.paper, soft: false },
  ember:   { bg: colors.emberSoft,  fg: colors.ember, soft: true },
  solar:   { bg: colors.solarSoft,  fg: "#A07810",    soft: true },
  moss:    { bg: colors.mossSoft,   fg: colors.moss,  soft: true },
  sky:     { bg: colors.skySoft,    fg: colors.sky,   soft: true },
  paper:   { bg: colors.paperWarm,  fg: colors.ink,   soft: true },
  neutral: { bg: colors.paperWarm,  fg: colors.inkMute, soft: true },
} as const;

export function Badge({
  tone = "neutral",
  size = "sm",
  dot,
  children,
}: {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  children: ReactNode;
}) {
  const { bg, fg } = map[tone];
  const pad = size === "xs" ? "2px 8px" : "4px 10px";
  const fz = size === "xs" ? 10 : 11;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: fg,
        padding: pad,
        fontFamily: "var(--font-display)",
        fontSize: fz,
        fontWeight: 600,
        letterSpacing: "0.02em",
        borderRadius: radius.pill,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: tone === "ink" ? colors.paper : fg,
          }}
        />
      )}
      {children}
    </span>
  );
}
