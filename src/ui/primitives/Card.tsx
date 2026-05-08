import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { colors, radius, shadow } from "@/ui/tokens/colors";

type Tone = "paper" | "tile" | "warm" | "ink" | "ember" | "solar" | "moss" | "sky";

type Props = {
  tone?: Tone;
  children: ReactNode;
  style?: CSSProperties;
  hover?: boolean;
  onClick?: () => void;
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: number | string;
  rounded?: keyof typeof radius;
};

function tones(tone: Tone) {
  switch (tone) {
    case "ink":   return { bg: colors.ink,         fg: colors.paper };
    case "ember": return { bg: colors.emberSoft,   fg: colors.ink   };
    case "solar": return { bg: colors.solarSoft,   fg: colors.ink   };
    case "moss":  return { bg: colors.mossSoft,    fg: colors.ink   };
    case "sky":   return { bg: colors.skySoft,     fg: colors.ink   };
    case "tile":  return { bg: colors.paperTile,   fg: colors.ink   };
    case "warm":  return { bg: colors.paperWarm,   fg: colors.ink   };
    case "paper":
    default:      return { bg: colors.paperLow,    fg: colors.ink   };
  }
}

export function Card({
  tone = "paper",
  children,
  style,
  hover,
  onClick,
  elevation = "sm",
  padding,
  rounded = "lg",
}: Props) {
  const { bg, fg } = tones(tone);
  const ringShadow = elevation === "none" ? "none" : shadow[elevation];
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: shadow.md } : undefined}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      onClick={onClick}
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${colors.hairline}`,
        borderRadius: radius[rounded],
        boxShadow: ringShadow,
        cursor: onClick ? "pointer" : "default",
        padding,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
