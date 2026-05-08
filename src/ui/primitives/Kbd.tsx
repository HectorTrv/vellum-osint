import type { CSSProperties } from "react";
import { colors } from "@/ui/tokens/colors";

type Props = { children: string; muted?: boolean; style?: CSSProperties };

export function Kbd({ children, muted, style }: Props) {
  return (
    <kbd
      style={{
        background: muted ? "transparent" : colors.paperWarm,
        color: muted ? colors.inkFade : colors.ink,
        padding: "2px 6px",
        borderRadius: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.01em",
        border: muted ? "none" : `1px solid ${colors.hairline}`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </kbd>
  );
}
