import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, AlertTriangle, X } from "lucide-react";
import { colors, radius, shadow } from "@/ui/tokens/colors";
import { useToasts } from "@/lib/toasts";

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 420,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "12px 14px",
              background: colors.ink,
              color: colors.paper,
              borderRadius: radius.md,
              boxShadow: shadow.lg,
              pointerEvents: "auto",
              minWidth: 280,
              border: `1px solid ${colors.inkSoft}`,
            }}
          >
            <ToastIcon variant={t.variant} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 13.5,
                  letterSpacing: "-0.005em",
                }}
              >
                {t.title}
              </div>
              {t.description && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "rgba(245,239,224,0.72)",
                    marginTop: 2,
                  }}
                >
                  {t.description}
                </div>
              )}
            </div>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 12,
                  color: colors.solar,
                  padding: "4px 10px",
                  borderRadius: radius.pill,
                  background: "rgba(255,210,63,0.12)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              aria-label="dismiss"
              style={{
                width: 22,
                height: 22,
                display: "grid",
                placeItems: "center",
                color: "rgba(245,239,224,0.5)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastIcon({ variant }: { variant?: string }) {
  const c =
    variant === "success" ? colors.moss :
    variant === "error"   ? colors.ember :
    variant === "info"    ? colors.sky :
                            colors.solar;
  const Icon =
    variant === "success" ? Check :
    variant === "error"   ? AlertTriangle :
                            Info;
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        background: `${c}33`,
        color: c,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={14} strokeWidth={2.2} />
    </div>
  );
}
