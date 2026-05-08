import type { CSSProperties } from "react";
import { colors } from "@/ui/tokens/colors";

type Props = {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed";
  inset?: number;
  style?: CSSProperties;
};

export function Divider({
  orientation = "horizontal",
  variant = "solid",
  inset = 0,
  style,
}: Props) {
  const isV = orientation === "vertical";
  const color = colors.hairline;
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      style={{
        width: isV ? 1 : "auto",
        height: isV ? "auto" : 1,
        margin: isV ? `${inset}px 0` : `0 ${inset}px`,
        flexShrink: 0,
        alignSelf: "stretch",
        background:
          variant === "dashed"
            ? `repeating-linear-gradient(${isV ? "0deg" : "90deg"}, ${color} 0 4px, transparent 4px 8px)`
            : color,
        ...style,
      }}
    />
  );
}
