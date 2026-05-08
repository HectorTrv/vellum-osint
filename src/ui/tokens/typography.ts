/**
 * Typography — geometric sans (Inter), tightened pro scale.
 *
 * Hierarchy:
 *   Display  →  hero / cover poster (rare, 1 per page max)
 *   Hero     →  big section header (rare)
 *   H1       →  page title
 *   H2       →  section title
 *   H3       →  card / subsection
 *   Eyebrow  →  meta label above title (uppercase, muted by default)
 *   Body     →  default body
 *   Body Sm  →  secondary body
 *   Caption  →  small chrome text
 *   Mono     →  data, IDs, hashes
 */

export const typography = {
  display: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "clamp(40px, 4.5vw, 60px)",
    lineHeight: 1.04,
    letterSpacing: "-0.025em",
  },
  hero: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "clamp(30px, 3.4vw, 44px)",
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
  },
  h1: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "clamp(24px, 2.6vw, 32px)",
    lineHeight: 1.18,
    letterSpacing: "-0.018em",
  },
  h2: {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "20px",
    lineHeight: 1.3,
    letterSpacing: "-0.012em",
  },
  h3: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: 1.35,
    letterSpacing: "-0.008em",
  },
  eyebrow: {
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: "11px",
    lineHeight: 1.2,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  body: {
    fontFamily: "var(--font-body)",
    fontWeight: 400,
    fontSize: "14.5px",
    lineHeight: 1.55,
  },
  bodyStrong: {
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: "14.5px",
    lineHeight: 1.55,
  },
  bodySmall: {
    fontFamily: "var(--font-body)",
    fontWeight: 400,
    fontSize: "13px",
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: "11.5px",
    lineHeight: 1.4,
    letterSpacing: "0.005em",
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontWeight: 500,
    fontSize: "12px",
    lineHeight: 1.45,
    letterSpacing: "-0.005em",
  },
  monoLg: {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: 1.4,
  },
} as const;

export type TypoVariant = keyof typeof typography;
