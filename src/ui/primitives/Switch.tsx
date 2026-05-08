import { motion } from "framer-motion";
import { colors } from "@/ui/tokens/colors";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function Switch({ checked, onChange, label, disabled, size = "md" }: Props) {
  const w = size === "sm" ? 32 : 40;
  const h = size === "sm" ? 18 : 22;
  const knob = h - 4;
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: w,
        height: h,
        borderRadius: 999,
        background: checked ? colors.ink : colors.paperWarm,
        border: `1px solid ${checked ? colors.ink : colors.hairlineStrong}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 200ms, border-color 200ms",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: checked ? w - knob - 4 : 1 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: "absolute",
          top: (h - knob) / 2 - 1,
          width: knob,
          height: knob,
          borderRadius: 999,
          background: colors.paper,
          boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
        }}
      />
    </button>
  );
}
