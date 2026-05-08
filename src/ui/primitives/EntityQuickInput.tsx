import { useMemo, useState, type KeyboardEvent } from "react";
import {
  Mail,
  Globe,
  Hash,
  Wallet,
  Phone,
  Link2,
  AtSign,
  User,
  HelpCircle,
  Server,
  type LucideIcon,
} from "lucide-react";
import { detectKind, type DetectedKind } from "@/lib/kindDetect";
import { colors, radius, type VisualAccent } from "@/ui/tokens/colors";
import { IconTile } from "@/ui/primitives/IconTile";

const META: Record<DetectedKind, { Icon: LucideIcon; tone: VisualAccent }> = {
  Email:    { Icon: Mail,       tone: "moss"  },
  IP:       { Icon: Server,     tone: "solar" },
  URL:      { Icon: Link2,      tone: "solar" },
  Domain:   { Icon: Globe,      tone: "solar" },
  Hash:     { Icon: Hash,       tone: "sky"   },
  Wallet:   { Icon: Wallet,     tone: "sky"   },
  Phone:    { Icon: Phone,      tone: "moss"  },
  Username: { Icon: AtSign,     tone: "moss"  },
  Person:   { Icon: User,       tone: "ember" },
  Custom:   { Icon: HelpCircle, tone: "ember" },
};

type Props = {
  onCommit: (value: string, kind: DetectedKind) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * EntityQuickInput — paste anything (email, IP, hash, wallet, URL…) and the kind
 * is auto-detected on the fly. Press Enter to commit.
 */
export function EntityQuickInput({ onCommit, placeholder = "Paste an email, domain, IP, hash…", autoFocus }: Props) {
  const [value, setValue] = useState("");
  const detection = useMemo(() => detectKind(value), [value]);
  const meta = META[detection.kind];

  const submit = () => {
    if (!value.trim()) return;
    onCommit(value.trim(), detection.kind);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 8,
        background: colors.paperTile,
        border: `1px solid ${colors.hairlineStrong}`,
        borderRadius: radius.lg,
        boxShadow: detection.confidence > 0.6 ? `0 0 0 4px ${colors.skySoft}` : "none",
        transition: "box-shadow 200ms",
      }}
    >
      <IconTile tone={meta.tone} size={32}>
        <meta.Icon size={15} strokeWidth={1.8} />
      </IconTile>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "transparent",
          border: 0,
          outline: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 13.5,
          color: colors.ink,
        }}
      />
      {value && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: detection.confidence > 0.6 ? colors.mossSoft : colors.paperWarm,
            color: detection.confidence > 0.6 ? colors.moss : colors.inkMute,
            fontFamily: "var(--font-display)",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {detection.kind}
          {detection.hint && (
            <span style={{ color: colors.inkFade, fontWeight: 500 }}>· {detection.hint}</span>
          )}
        </span>
      )}
    </div>
  );
}
