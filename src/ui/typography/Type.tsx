import type { CSSProperties, ElementType, ReactNode } from "react";
import { typography, type TypoVariant } from "@/ui/tokens/typography";
import { colors } from "@/ui/tokens/colors";

type TypeProps = {
  as?: ElementType;
  variant: TypoVariant;
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

/** Default colour per variant — tones get applied unless explicitly overridden. */
const defaultColor: Partial<Record<TypoVariant, string>> = {
  eyebrow:   colors.inkMute,
  bodySmall: colors.inkSoft,
  caption:   colors.inkMute,
  mono:      colors.inkSoft,
};

export function Type({
  as: Tag = "p",
  variant,
  children,
  color,
  className,
  style,
  title,
}: TypeProps) {
  const merged: CSSProperties = {
    ...(typography[variant] as CSSProperties),
    color: color ?? defaultColor[variant] ?? colors.ink,
    ...style,
  };
  return (
    <Tag className={className} style={merged} title={title}>
      {children}
    </Tag>
  );
}

export const Display     = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="display"     as={p.as ?? "h1"} />;
export const Hero        = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="hero"        as={p.as ?? "h1"} />;
export const H1          = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="h1"          as={p.as ?? "h1"} />;
export const H2          = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="h2"          as={p.as ?? "h2"} />;
export const H3          = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="h3"          as={p.as ?? "h3"} />;
export const Eyebrow     = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="eyebrow"     as={p.as ?? "span"} />;
export const Body        = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="body"        as={p.as ?? "p"} />;
export const BodyStrong  = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="bodyStrong"  as={p.as ?? "p"} />;
export const BodySmall   = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="bodySmall"   as={p.as ?? "p"} />;
export const Caption     = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="caption"     as={p.as ?? "span"} />;
export const Mono        = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="mono"        as={p.as ?? "span"} />;
export const MonoLg      = (p: Omit<TypeProps, "variant">) => <Type {...p} variant="monoLg"      as={p.as ?? "span"} />;
