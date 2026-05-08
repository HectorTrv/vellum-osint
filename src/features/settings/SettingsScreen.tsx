import { useEffect, useState } from "react";
import {
  HardDrive,
  KeyRound,
  Sliders,
  Moon,
  AlertTriangle,
  Copy,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { colors, radius } from "@/ui/tokens/colors";
import { page } from "@/ui/tokens/layout";
import { H1, H3, Eyebrow, BodySmall, Mono } from "@/ui/typography/Type";
import { Card } from "@/ui/primitives/Card";
import { Button } from "@/ui/primitives/Button";
import { IconTile } from "@/ui/primitives/IconTile";
import { Badge } from "@/ui/primitives/Badge";
import { useCases } from "@/lib/casesStore";
import { api, isTauri } from "@/lib/api";
import { toast } from "@/lib/toasts";

export function SettingsScreen() {
  const density = useCases((s) => s.density);
  const setDensity = useCases((s) => s.setDensity);
  const [vaultPath, setVaultPath] = useState<string>("—");
  const [version, setVersion] = useState<string>("v0.2");

  useEffect(() => {
    if (!isTauri) return;
    api.appInfo()
      .then((info) => {
        setVaultPath(info.vaultPath);
        setVersion(info.version);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ ...page.reading }}>
      <div style={{ marginBottom: 32 }}>
        <Eyebrow>Preferences · vault · keys</Eyebrow>
        <H1 style={{ marginTop: 6 }}>Settings</H1>
        <BodySmall style={{ marginTop: 8, color: colors.inkMute, maxWidth: 540 }}>
          Configure how Vellum looks, where the vault lives, and which connectors are wired up.
        </BodySmall>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Vault */}
        <Card padding="22px 24px">
          <Section
            Icon={HardDrive}
            tone="ember"
            title="Vault"
            sub="Your encrypted local store. Master key in OS keychain."
          />
          <Row label="Location">
            <Mono style={{ color: colors.inkMute, fontSize: 12, wordBreak: "break-all" }}>{vaultPath}</Mono>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy size={12} strokeWidth={1.8} />}
              onClick={() => {
                navigator.clipboard?.writeText(vaultPath);
                toast.success("Path copied");
              }}
            >
              Copy
            </Button>
          </Row>
          <Row label="Cipher">
            <Badge tone="moss" dot>SQLCipher · AES-256 · WAL · FK ON</Badge>
          </Row>
          <Row label="Version">
            <Mono>{version}</Mono>
            <Badge tone="paper">Schema v1</Badge>
          </Row>
        </Card>

        {/* Appearance */}
        <Card padding="22px 24px">
          <Section
            Icon={Sliders}
            tone="solar"
            title="Appearance"
            sub="Density and theme. Dark mode is queued for V0.3."
          />
          <Row label="Density">
            <DensityToggle current={density} onChange={setDensity} />
          </Row>
          <Row label="Theme">
            <Badge tone="paper">Cream · Light</Badge>
            <Badge tone="neutral"><Moon size={11} strokeWidth={1.8} style={{ marginRight: 4, verticalAlign: "-1px" }} /> Dark · soon</Badge>
          </Row>
        </Card>

        {/* Connectors */}
        <Card padding="22px 24px">
          <Section
            Icon={Sparkles}
            tone="moss"
            title="Connectors"
            sub="API keys for V0.4 enrichers — stored encrypted at rest in the vault."
          />
          {[
            { name: "HaveIBeenPwned", purpose: "email breach lookup" },
            { name: "Hunter.io",      purpose: "email finder & verifier" },
            { name: "WhoisXML",       purpose: "whois & DNS history" },
            { name: "Shodan",         purpose: "host & IP intel" },
            { name: "Wayback",        purpose: "archived snapshots" },
            { name: "Maigret",        purpose: "pseudonym → 350+ sites" },
          ].map((c) => (
            <Row key={c.name} label={c.name}>
              <BodySmall style={{ color: colors.inkMute, flex: 1 }}>{c.purpose}</BodySmall>
              <Badge tone="paper">Not configured</Badge>
              <Button variant="ghost" size="sm" icon={<KeyRound size={12} strokeWidth={1.8} />} disabled>
                Add key
              </Button>
            </Row>
          ))}
        </Card>

        {/* Forensic */}
        <Card padding="22px 24px">
          <Section
            Icon={ShieldCheck}
            tone="sky"
            title="Forensic ledger"
            sub="The HMAC chain that proves your case file is untampered."
          />
          <Row label="Status">
            <Badge tone="moss" dot>Chain integrity verified</Badge>
          </Row>
          <Row label="Verify">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                if (!isTauri) {
                  toast.show("Web preview", "Verification runs in the desktop app.");
                  return;
                }
                toast.show("Verification queued", "Pick a case to verify its chain.");
              }}
            >
              Run verification
            </Button>
          </Row>
        </Card>

        {/* Danger zone */}
        <Card padding="22px 24px" style={{ borderColor: colors.emberSoft }}>
          <Section
            Icon={AlertTriangle}
            tone="ember"
            title="Danger zone"
            sub="Destructive actions. Always reversible only if your last backup is recent."
          />
          <Row label="Rotate master key">
            <BodySmall style={{ color: colors.inkMute, flex: 1 }}>
              Re-derive the vault key. Requires re-entering passphrase. Coming V0.3.
            </BodySmall>
            <Button variant="danger" size="sm" disabled>
              Rotate
            </Button>
          </Row>
          <Row label="Wipe vault">
            <BodySmall style={{ color: colors.inkMute, flex: 1 }}>
              Delete every case, entity, and ledger event. Cannot be undone.
            </BodySmall>
            <Button variant="danger" size="sm" disabled>
              Wipe
            </Button>
          </Row>
        </Card>
      </div>
    </div>
  );
}

function Section({
  Icon,
  tone,
  title,
  sub,
}: {
  Icon: typeof HardDrive;
  tone: "ember" | "solar" | "moss" | "sky";
  title: string;
  sub: string;
}) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
      <IconTile tone={tone} size={36}>
        <Icon size={16} strokeWidth={1.8} />
      </IconTile>
      <div>
        <H3>{title}</H3>
        <BodySmall style={{ color: colors.inkMute, marginTop: 2 }}>{sub}</BodySmall>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderTop: `1px solid ${colors.hairline}`,
      }}
    >
      <span style={{ width: 140, color: colors.inkMute, fontSize: 13, fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

function DensityToggle({
  current,
  onChange,
}: {
  current: "comfortable" | "compact";
  onChange: (d: "comfortable" | "compact") => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 3,
        background: colors.paperWarm,
        borderRadius: radius.pill,
      }}
    >
      {(["comfortable", "compact"] as const).map((d) => {
        const active = current === d;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            style={{
              padding: "5px 14px",
              borderRadius: radius.pill,
              background: active ? colors.ink : "transparent",
              color: active ? colors.paper : colors.inkMute,
              fontFamily: "var(--font-display)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

