/**
 * Layout tokens — page widths, paddings, section gaps.
 * Use these to keep every screen on the same rhythm.
 */

import type { CSSProperties } from "react";

export const page = {
  /** Standard work page (Cover, Cases, Reports, Case Detail). */
  standard: {
    padding: "32px 48px 64px",
    maxWidth: 1240,
    margin: "0 auto",
  } satisfies CSSProperties,
  /** Reading-focused page (Settings, Timeline). */
  reading: {
    padding: "32px 48px 64px",
    maxWidth: 880,
    margin: "0 auto",
  } satisfies CSSProperties,
  /** Tool / canvas page (Graph) — full bleed, no inner padding. */
  tool: {
    padding: 0,
    maxWidth: "100%",
    margin: 0,
  } satisfies CSSProperties,
};

export const gap = {
  hero: 24,        // Eyebrow → Title → Sub
  section: 32,     // between major sections
  group: 16,       // grouped elements
  inline: 8,
} as const;

/** Reusable card padding presets. */
export const cardPad = {
  sm: "16px 18px",
  md: "20px 22px",
  lg: "24px 26px",
} as const;
