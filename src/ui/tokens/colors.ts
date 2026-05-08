/* All values reference CSS custom properties defined in global.css.
   Dark mode is handled by [data-theme="dark"] on <html>. */

export const colors = {
  // ── Surfaces ────────────────────────────────────────────────
  paper:     "var(--paper)",
  paperLow:  "var(--paper-low)",
  paperWarm: "var(--paper-warm)",
  paperWarmHover: "var(--paper-warm-hover)",
  paperTile: "var(--paper-tile)",

  // ── Ink / text ───────────────────────────────────────────────
  ink:       "var(--ink)",
  inkSoft:   "var(--ink-soft)",
  inkMute:   "var(--ink-mute)",
  inkFade:   "var(--ink-fade)",

  // ── Accents ──────────────────────────────────────────────────
  ember:     "var(--ember)",
  emberSoft: "var(--ember-soft)",
  solar:     "var(--solar)",
  solarSoft: "var(--solar-soft)",
  moss:      "var(--moss)",
  mossSoft:  "var(--moss-soft)",
  sky:       "var(--sky)",
  skySoft:   "var(--sky-soft)",

  // ── Structural ───────────────────────────────────────────────
  hairline:       "var(--hairline)",
  hairlineStrong: "var(--hairline-strong)",
  backdrop:       "var(--backdrop)",
  focusRing:      "var(--focus-ring)",

  // ── Static — never flip with theme ───────────────────────────
  // Used for text/fg on accent-colored surfaces (buttons, badges, icons)
  // where contrast must be guaranteed regardless of theme.
  onAccent: "#F8F3E4",   // cream — legible on ember/moss/solar/sky/ink surfaces
} as const;

export type ColorToken = keyof typeof colors;

/** Visual accents available in the design system. */
export const visualAccents = ["ember", "solar", "moss", "sky"] as const;
export type VisualAccent = (typeof visualAccents)[number];

/** Legacy alias */
export type Accent = VisualAccent;

export const accentSurface: Record<VisualAccent, { fg: string; bg: string; soft: string }> = {
  ember: { fg: colors.ember, bg: colors.ember, soft: colors.emberSoft },
  solar: { fg: colors.ink,   bg: colors.solar, soft: colors.solarSoft },
  moss:  { fg: colors.moss,  bg: colors.moss,  soft: colors.mossSoft  },
  sky:   { fg: colors.sky,   bg: colors.sky,   soft: colors.skySoft   },
};

/** Map the schema-level accent to a visual accent. */
export function toVisualAccent(a: string | null | undefined): VisualAccent {
  if (a === "ember" || a === "solar" || a === "moss" || a === "sky") return a;
  if (a === "ink") return "sky";
  return "ember";
}

export const radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  pill: 999,
} as const;

export const shadow = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

export const entityColor: Record<string, Accent> = {
  Person: "ember",
  Email: "moss",
  Username: "moss",
  Phone: "moss",
  Domain: "solar",
  IP: "solar",
  Hash: "sky",
  URL: "solar",
  Organization: "ember",
  Brand: "ember",
  Document: "sky",
  Location: "moss",
  Wallet: "sky",
  SocialAccount: "ember",
  Custom: "sky",
};
