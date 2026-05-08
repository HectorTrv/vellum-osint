import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { colors, radius } from "@/ui/tokens/colors";

type Props = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  emphasis?: boolean;
};

export function ListRow({ leading, title, subtitle, trailing, onClick, emphasis }: Props) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { backgroundColor: emphasis ? colors.paperWarm : colors.paperTile } : undefined}
      transition={{ duration: 0.16 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: radius.md,
        cursor: onClick ? "pointer" : "default",
        background: emphasis ? colors.paperLow : "transparent",
      }}
    >
      {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 15,
            color: colors.ink,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: colors.inkMute,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </motion.div>
  );
}
