export const colors = {
  // surfaces
  paper: "#F8F3E4",
  paperLow: "#FBF8EC",
  paperWarm: "#F1EAD4",
  paperTile: "#FDFAEF",

  // ink
  ink: "#0E0E0C",
  inkSoft: "#2A2A26",
  inkMute: "#5C5C56",
  inkFade: "#8E8E86",

  // accents (used sparingly)
  ember: "#E63946",
  emberSoft: "#FBE4E5",
  solar: "#FFD23F",
  solarSoft: "#FFF6D2",
  moss: "#2A9D8F",
  mossSoft: "#DCEEEA",
  sky: "#4C8BF5",
  skySoft: "#E1ECFE",

  // hairlines & shadows
  hairline: "rgba(14, 14, 12, 0.06)",
  hairlineStrong: "rgba(14, 14, 12, 0.12)",
  shadowSm: "0 1px 2px rgba(14, 14, 12, 0.05)",
  shadowMd: "0 4px 14px rgba(14, 14, 12, 0.06)",
  shadowLg: "0 14px 40px rgba(14, 14, 12, 0.08)",
} as const;

export type ColorToken = keyof typeof colors;

/** Visual accents available in the design system (UI palette). */
export const visualAccents = ["ember", "solar", "moss", "sky"] as const;
export type VisualAccent = (typeof visualAccents)[number];

/** Backward-compat alias — `Accent` historically meant the visual one in tokens. */
export type Accent = VisualAccent;

export const accentSurface: Record<VisualAccent, { fg: string; bg: string; soft: string }> = {
  ember: { fg: colors.ember, bg: colors.ember, soft: colors.emberSoft },
  solar: { fg: colors.ink,   bg: colors.solar, soft: colors.solarSoft },
  moss:  { fg: colors.moss,  bg: colors.moss,  soft: colors.mossSoft  },
  sky:   { fg: colors.sky,   bg: colors.sky,   soft: colors.skySoft   },
};

/** Map the schema-level accent (which still includes the legacy "ink") to a visual accent. */
export function toVisualAccent(a: string | null | undefined): VisualAccent {
  if (a === "ember" || a === "solar" || a === "moss" || a === "sky") return a;
  if (a === "ink") return "sky";
  return "ember";
}

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  sm: colors.shadowSm,
  md: colors.shadowMd,
  lg: colors.shadowLg,
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
