import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { colors } from "@/ui/tokens/colors";

type Props = {
  size?: number;
  color?: string;
  thickness?: number;
  style?: CSSProperties;
};

export function Spinner({ size = 16, color = colors.ink, thickness = 2, style }: Props) {
  const r = size / 2 - thickness;
  const c = 2 * Math.PI * r;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
      style={style}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeOpacity={0.18}
        strokeWidth={thickness}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * 0.7}
      />
    </motion.svg>
  );
}
