import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colors, radius } from "@/ui/tokens/colors";

type Props = {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
  delay?: number;
};

export function Tooltip({ label, children, side = "top", delay = 350 }: Props) {
  const [open, setOpen] = useState(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const show = () => {
    timer = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer) clearTimeout(timer);
    setOpen(false);
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              [side]: "calc(100% + 6px)" as never,
              padding: "5px 9px",
              background: colors.ink,
              color: colors.paper,
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.005em",
              borderRadius: radius.sm,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 50,
              boxShadow: "0 4px 12px rgba(14,14,12,0.18)",
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
