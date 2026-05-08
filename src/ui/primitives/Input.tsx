import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { colors, radius } from "@/ui/tokens/colors";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, leading, trailing, invalid, hint, style, ...rest },
  ref
) {
  const ring = invalid ? colors.ember : "transparent";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.02em",
            color: colors.inkMute,
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: colors.paperTile,
          border: `1px solid ${invalid ? colors.ember : colors.hairlineStrong}`,
          borderRadius: radius.md,
          padding: "11px 14px",
          transition: "border-color 160ms",
          boxShadow: invalid ? `0 0 0 4px ${colors.emberSoft}` : "none",
        }}
      >
        {leading && <span style={{ color: colors.inkFade, display: "inline-flex" }}>{leading}</span>}
        <input
          ref={ref}
          {...rest}
          style={{
            background: "transparent",
            border: 0,
            outline: 0,
            width: "100%",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: colors.ink,
            ...style,
          }}
        />
        {trailing && <span style={{ color: colors.inkFade, display: "inline-flex" }}>{trailing}</span>}
        {/* keep var to silence unused */}
        <span style={{ display: "none" }}>{ring}</span>
      </span>
      {hint && (
        <span style={{ fontSize: 12, color: invalid ? colors.ember : colors.inkMute }}>
          {hint}
        </span>
      )}
    </label>
  );
});
