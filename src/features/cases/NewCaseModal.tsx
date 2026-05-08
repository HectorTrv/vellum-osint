import { useState } from "react";
import { Shield, UserSearch, Sparkles, Diamond, type LucideIcon } from "lucide-react";
import { Modal } from "@/ui/primitives/Modal";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { IconTile } from "@/ui/primitives/IconTile";
import { Spinner } from "@/ui/primitives/Spinner";
import { colors, radius, accentSurface, type VisualAccent } from "@/ui/tokens/colors";
import { Eyebrow, BodySmall } from "@/ui/typography/Type";
import { useCases } from "@/lib/casesStore";
import type { CaseKind } from "@/lib/types";

const KINDS: {
  id: CaseKind;
  label: string;
  sub: string;
  accent: VisualAccent;
  Icon: LucideIcon;
}[] = [
  { id: "Cyber",  label: "Cyber",  sub: "IOCs · domains · breach intel",        accent: "ember", Icon: Shield },
  { id: "Person", label: "Person", sub: "investigation on a subject",           accent: "sky",   Icon: UserSearch },
  { id: "Brand",  label: "Brand",  sub: "mentions · counterfeits · reputation", accent: "solar", Icon: Sparkles },
  { id: "Custom", label: "Custom", sub: "free-form dossier",                    accent: "moss",  Icon: Diamond },
];

export function NewCaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCases((s) => s.create);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CaseKind>("Cyber");
  const [accent, setAccent] = useState<VisualAccent>("ember");
  const [legal, setLegal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return setErr("Title required");
    setBusy(true);
    setErr(null);
    try {
      const dbAccent = accent === "sky" ? "ink" : accent;
      await create({ kind, title, accent: dbAccent, legalBasis: legal.trim() || null });
      setTitle("");
      setLegal("");
      onClose();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Open a new case" width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Input
          label="Title"
          autoFocus
          placeholder="Threat Actor — Vermilion"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <div>
          <Eyebrow style={{ display: "block", marginBottom: 10 }}>Kind</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {KINDS.map((k) => {
              const active = kind === k.id;
              const surface = accentSurface[k.accent];
              return (
                <button
                  key={k.id}
                  onClick={() => {
                    setKind(k.id);
                    setAccent(k.accent);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    textAlign: "left",
                    background: active ? surface.soft : colors.paperLow,
                    color: colors.ink,
                    border: `1.5px solid ${active ? surface.fg : colors.hairline}`,
                    borderRadius: radius.lg,
                    transition: "all 160ms",
                    cursor: "pointer",
                  }}
                >
                  <IconTile tone={k.accent} size={36} filled={active}>
                    <k.Icon size={16} strokeWidth={2} />
                  </IconTile>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: colors.inkMute, marginTop: 2 }}>{k.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Legal basis (optional)"
          placeholder="journalism · due_diligence · internal_security · ctf"
          value={legal}
          onChange={(e) => setLegal(e.target.value)}
        />

        {err && <BodySmall style={{ color: colors.ember }}>{err}</BodySmall>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <Button variant="ghost" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={busy}
            icon={busy ? <Spinner size={14} color={colors.paper} /> : undefined}
          >
            {busy ? "Sealing…" : "Open case"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
