import type { ReactNode } from "react";
import { colors } from "@/ui/tokens/colors";

type Props = {
  label: string;
  value: ReactNode;
  size?: "sm" | "md";
  align?: "start" | "center";
};

export function Stat({ label, value, size = "sm", align = "start" }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
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
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: size === "md" ? 18 : 14,
          fontWeight: 600,
          color: colors.ink,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </span>
    </div>
  );
}
