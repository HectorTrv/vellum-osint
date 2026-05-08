import type { CSSProperties } from "react";
import { colors, accentSurface, type VisualAccent } from "@/ui/tokens/colors";

type Props = {
  initials: string;
  size?: number;
  tone?: VisualAccent;
  rotate?: number;
  style?: CSSProperties;
};

export function Avatar({ initials, size = 40, tone = "ember", rotate = 0, style }: Props) {
  const surface = accentSurface[tone];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(8, Math.round(size * 0.28)),
        background: surface.soft,
        color: surface.fg,
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "-0.01em",
        flexShrink: 0,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        border: `2px solid ${colors.paperLow}`,
        ...style,
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

type StackProps = {
  members: { initials: string; tone: VisualAccent }[];
  size?: number;
};

export function AvatarStack({ members, size = 56 }: StackProps) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {members.map((m, i) => {
        const offset = i - (members.length - 1) / 2;
        return (
          <Avatar
            key={i}
            initials={m.initials}
            tone={m.tone}
            size={size}
            rotate={offset * 6}
            style={{
              marginLeft: i === 0 ? 0 : -size * 0.32,
              boxShadow: "0 6px 18px rgba(14,14,12,0.10)",
              zIndex: i === Math.floor(members.length / 2) ? 2 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
