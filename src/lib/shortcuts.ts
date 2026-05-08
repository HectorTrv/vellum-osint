import { useEffect } from "react";

/**
 * Tiny keyboard shortcut hook.
 * Combo grammar: tokens separated by `+`, case-insensitive.
 *   - `mod`        — Cmd on macOS, Ctrl elsewhere
 *   - `shift`, `alt`, `ctrl`, `meta`
 *   - any single key (`k`, `n`, `escape`, `?`, `/`, `arrowup`…)
 * Examples: "mod+k", "mod+n", "shift+mod+e", "escape", "/".
 */
export function useShortcut(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const want = parse(combo);
    const onKey = (e: KeyboardEvent) => {
      if (matches(e, want)) {
        // Don't trap shortcuts when user is in a text field, except Escape & explicit allowlist
        const tag = (e.target as HTMLElement | null)?.tagName;
        const isField = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
        const allowInField = want.key === "escape" || want.mod;
        if (isField && !allowInField) return;
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, handler, enabled]);
}

type Parsed = { mod: boolean; shift: boolean; alt: boolean; ctrl: boolean; meta: boolean; key: string };

function parse(combo: string): Parsed {
  const tokens = combo.toLowerCase().split("+").map((t) => t.trim());
  const out: Parsed = { mod: false, shift: false, alt: false, ctrl: false, meta: false, key: "" };
  for (const t of tokens) {
    if (t === "mod") out.mod = true;
    else if (t === "shift") out.shift = true;
    else if (t === "alt" || t === "option") out.alt = true;
    else if (t === "ctrl" || t === "control") out.ctrl = true;
    else if (t === "meta" || t === "cmd") out.meta = true;
    else out.key = t;
  }
  return out;
}

function matches(e: KeyboardEvent, w: Parsed): boolean {
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modActive = isMac ? e.metaKey : e.ctrlKey;
  if (w.mod && !modActive) return false;
  if (w.shift !== e.shiftKey) return false;
  if (w.alt !== e.altKey) return false;
  if (!w.mod) {
    if (w.ctrl !== e.ctrlKey) return false;
    if (w.meta !== e.metaKey) return false;
  }
  const k = e.key.toLowerCase();
  if (w.key !== k) return false;
  return true;
}
