import { motion } from "framer-motion";
import {
  Home,
  Folders,
  Network,
  History,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { colors, radius } from "@/ui/tokens/colors";
import { useRouter, type Route } from "@/app/router";
import { Tooltip } from "@/ui/primitives/Tooltip";

const ITEMS: { id: Route; label: string; Icon: LucideIcon }[] = [
  { id: "cover",    label: "Home",   Icon: Home },
  { id: "cases",    label: "Cases",  Icon: Folders },
  { id: "graph",    label: "Graph",  Icon: Network },
  { id: "timeline", label: "Ledger", Icon: History },
  { id: "reports",  label: "Report", Icon: FileText },
];

export function NavRail() {
  const route = useRouter((s) => s.route);
  const setRoute = useRouter((s) => s.setRoute);
  const isCaseDetail = route === "caseDetail";
  return (
    <aside
      style={{
        width: 88,
        background: colors.paperLow,
        borderRight: `1px solid ${colors.hairline}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 18px",
        gap: 4,
      }}
    >
      {/* Mark */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            background: colors.ink,
            borderRadius: radius.md,
            display: "grid",
            placeItems: "center",
            color: colors.paper,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "-0.02em",
          }}
        >
          V
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: colors.inkMute,
          }}
        >
          Vellum
        </span>
      </div>

      {/* Items */}
      {ITEMS.map(({ id, label, Icon }) => {
        const active = route === id || (isCaseDetail && id === "cases");
        return (
          <Tooltip key={id} label={label} side="bottom" delay={500}>
            <button
              onClick={() => setRoute(id)}
              aria-label={label}
              style={{
                position: "relative",
                width: 60,
                padding: "10px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                borderRadius: radius.md,
                background: active ? colors.paperWarm : "transparent",
                color: active ? colors.ink : colors.inkMute,
                transition: "background 200ms, color 200ms",
              }}
            >
              {active && (
                <motion.div
                  layoutId="navMarker"
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 12,
                    bottom: 12,
                    width: 3,
                    borderRadius: "0 4px 4px 0",
                    background: colors.ink,
                  }}
                />
              )}
              <Icon size={18} strokeWidth={1.8} />
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.005em",
                }}
              >
                {label}
              </span>
            </button>
          </Tooltip>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Settings */}
      <Tooltip label="Settings" side="top">
        <button
          onClick={() => setRoute("settings")}
          aria-label="Settings"
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            borderRadius: radius.md,
            background: route === "settings" ? colors.paperWarm : "transparent",
            color: route === "settings" ? colors.ink : colors.inkMute,
            cursor: "pointer",
            marginBottom: 8,
          }}
        >
          <Settings size={16} strokeWidth={1.8} />
        </button>
      </Tooltip>

      {/* Vault status pip */}
      <Tooltip label="Vault online · encrypted" side="top">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            color: colors.inkMute,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.sm,
              background: colors.mossSoft,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ width: 8, height: 8, background: colors.moss, borderRadius: 999 }} />
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            local
          </span>
        </div>
      </Tooltip>
    </aside>
  );
}
