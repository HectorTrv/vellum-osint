import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { colors, radius, shadow } from "@/ui/tokens/colors";

type Variant = "primary" | "secondary" | "ghost" | "ember" | "solar" | "moss" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
};

const PADS: Record<Size, string> = {
  sm: "0 14px",
  md: "0 18px",
  lg: "0 22px",
};
const FONT_SIZES: Record<Size, number> = { sm: 13, md: 14, lg: 15 };
const HEIGHTS: Record<Size, number> = { sm: 32, md: 40, lg: 48 };

function paint(variant: Variant) {
  switch (variant) {
    case "primary":
      return { bg: colors.ink,        fg: colors.paper, hoverBg: colors.inkSoft };
    case "secondary":
      return { bg: colors.paperWarm,  fg: colors.ink,   hoverBg: "#E7DFC4" };
    case "ember":
      return { bg: colors.ember,      fg: colors.paper, hoverBg: "#D32F3D" };
    case "solar":
      return { bg: colors.solar,      fg: colors.ink,   hoverBg: "#F2C436" };
    case "moss":
      return { bg: colors.moss,       fg: colors.paper, hoverBg: "#258C7F" };
    case "danger":
      return { bg: colors.emberSoft,  fg: colors.ember, hoverBg: "#F8D6D8" };
    case "ghost":
    default:
      return { bg: "transparent",     fg: colors.ink,   hoverBg: colors.hairline };
  }
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  trailing,
  block,
  children,
  style,
  disabled,
  ...rest
}: Props) {
  const { bg, fg, hoverBg } = paint(variant);
  return (
    <motion.button
      whileHover={!disabled ? { backgroundColor: hoverBg } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
      {...(rest as Record<string, unknown>)}
      disabled={disabled}
      style={{
        display: block ? "flex" : "inline-flex",
        width: block ? "100%" : "auto",
        height: HEIGHTS[size],
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: PADS[size],
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: FONT_SIZES[size],
        letterSpacing: "-0.005em",
        background: bg,
        color: fg,
        border: 0,
        borderRadius: radius.pill,
        boxShadow: variant === "ghost" ? "none" : shadow.sm,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        outline: "none",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.ink}1F, ${variant === "ghost" ? "none" : shadow.sm}`;
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = variant === "ghost" ? "none" : shadow.sm;
        rest.onBlur?.(e);
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      {children && <span>{children}</span>}
      {trailing && <span style={{ display: "inline-flex", marginLeft: 4 }}>{trailing}</span>}
    </motion.button>
  );
}

/** Icon-only button — square rounded, sized for a 16px Lucide icon */
type IconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "secondary" | "primary";
  size?: 28 | 32 | 36 | 40;
  children: ReactNode;
};

export function IconButton({
  variant = "ghost",
  size = 32,
  children,
  style,
  disabled,
  ...rest
}: IconBtnProps) {
  const { bg, fg, hoverBg } = paint(variant === "primary" ? "primary" : variant === "secondary" ? "secondary" : "ghost");
  return (
    <motion.button
      whileHover={!disabled ? { backgroundColor: hoverBg } : undefined}
      whileTap={!disabled ? { scale: 0.94 } : undefined}
      transition={{ duration: 0.14 }}
      {...(rest as Record<string, unknown>)}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        background: bg,
        color: fg,
        border: 0,
        borderRadius: Math.max(8, Math.round(size * 0.3)),
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
