import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { colors, radius, shadow } from "@/ui/tokens/colors";
import { Display, H3, Body, Eyebrow, BodySmall, Mono } from "@/ui/typography/Type";
import { Button } from "@/ui/primitives/Button";
import { IconTile } from "@/ui/primitives/IconTile";
import { Spinner } from "@/ui/primitives/Spinner";
import { Orb } from "@/ui/shapes/Shapes";
import { useCases } from "@/lib/casesStore";
import { createDemoCase } from "@/lib/demoCase";
import { toast } from "@/lib/toasts";
import { useRouter } from "@/app/router";

const STORAGE_KEY = "vellum.onboarded.v1";

export function Onboarding() {
  const cases = useCases((s) => s.cases);
  const initialized = useCases((s) => s.initialized);
  const setRoute = useRouter((s) => s.setRoute);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show only when: vault has no cases AND user hasn't seen onboarding before.
  useEffect(() => {
    if (!initialized) return;
    const seen = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    if (!seen && cases.length === 0) setShow(true);
  }, [initialized, cases.length]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setShow(false);
  };

  const startDemo = async () => {
    setBusy(true);
    try {
      const c = await createDemoCase();
      toast.success("Demo case ready", `“${c.title}” — explore the graph and ledger.`);
      dismiss();
      setRoute("cases");
    } catch (e) {
      toast.error("Could not create demo", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "fixed",
            inset: 0,
            background: colors.paper,
            display: "grid",
            placeItems: "center",
            zIndex: 300,
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <Orb size={680} color={colors.ember} opacity={0.18} style={{ position: "absolute", left: -200, top: -200 }} />
            <Orb size={520} color={colors.solar} opacity={0.20} style={{ position: "absolute", right: -120, top: 100 }} />
            <Orb size={420} color={colors.moss}  opacity={0.12} style={{ position: "absolute", left: "30%", bottom: -180 }} />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: 720,
              width: "calc(100% - 64px)",
              padding: "44px 44px 36px",
              background: colors.paperLow,
              borderRadius: radius.xl,
              boxShadow: shadow.lg,
              border: `1px solid ${colors.hairline}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radius.md,
                  background: colors.ink,
                  color: colors.paper,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                V
              </div>
              <Eyebrow>Welcome to Vellum</Eyebrow>
            </div>

            <Display>
              An OSINT studio<br />
              <span style={{ color: colors.inkMute }}>built like a vault.</span>
            </Display>

            <BodySmall style={{ marginTop: 18, color: colors.inkMute, maxWidth: 560 }}>
              Three things you should know before opening your first case.
            </BodySmall>

            <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <Pillar
                Icon={Lock}
                tone="ember"
                label="Encrypted at rest"
                desc="Your vault is sealed with a master key in the OS keychain. SQLCipher AES-256."
              />
              <Pillar
                Icon={ShieldCheck}
                tone="moss"
                label="Forensic ledger"
                desc="Every action is HMAC-chained. Tamper one row, the chain breaks — provably."
              />
              <Pillar
                Icon={Sparkles}
                tone="solar"
                label="Local-first"
                desc="Nothing leaves your machine without your signed consent. Cloud is opt-in, never default."
              />
            </div>

            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: `1px solid ${colors.hairline}`,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="primary"
                size="lg"
                onClick={startDemo}
                disabled={busy}
                icon={busy ? <Spinner size={14} color={colors.paper} /> : <Sparkles size={16} strokeWidth={2} />}
              >
                {busy ? "Preparing demo…" : "Try the demo case"}
              </Button>
              <Button variant="ghost" size="lg" onClick={dismiss} disabled={busy}>
                Start fresh
              </Button>
              <div style={{ flex: 1 }} />
              <Mono style={{ color: colors.inkFade }}>v0.2 · Issue 001</Mono>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pillar({
  Icon,
  tone,
  label,
  desc,
}: {
  Icon: typeof Lock;
  tone: "ember" | "moss" | "solar" | "sky";
  label: string;
  desc: string;
}) {
  return (
    <div
      style={{
        padding: "20px 18px",
        background: colors.paperTile,
        borderRadius: radius.lg,
        border: `1px solid ${colors.hairline}`,
      }}
    >
      <IconTile tone={tone} size={36}>
        <Icon size={16} strokeWidth={1.8} />
      </IconTile>
      <H3 style={{ marginTop: 14, fontSize: 15 }}>{label}</H3>
      <Body style={{ marginTop: 6, color: colors.inkMute, fontSize: 13 }}>{desc}</Body>
    </div>
  );
}
