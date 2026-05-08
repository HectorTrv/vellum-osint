import { Lock, ShieldCheck } from "lucide-react";
import { colors } from "@/ui/tokens/colors";

export function StatusBar() {
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  return (
    <div
      style={{
        height: 36,
        background: colors.paperLow,
        borderBottom: `1px solid ${colors.hairline}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: colors.inkMute,
      }}
    >
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <ShieldCheck size={14} strokeWidth={1.8} color={colors.moss} />
          <span style={{ color: colors.ink, fontWeight: 600 }}>Vault</span>
          <span style={{ color: colors.inkMute }}>encrypted · local only</span>
        </span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Lock size={11} strokeWidth={1.8} />
          vlm · {stamp}Z
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, opacity: 0.85 }}>
        <span><kbd style={kbd}>⌘K</kbd> Search</span>
        <span><kbd style={kbd}>⌘N</kbd> New case</span>
        <span><kbd style={kbd}>⇧⌘E</kbd> Export</span>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = {
  background: colors.paperWarm,
  color: colors.ink,
  padding: "2px 6px",
  borderRadius: 6,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  fontWeight: 600,
  marginRight: 4,
};
