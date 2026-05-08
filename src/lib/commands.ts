import { create } from "zustand";
import type { LucideIcon } from "lucide-react";

export type Command = {
  id: string;
  section: "Navigation" | "Actions" | "Cases" | "Help";
  label: string;
  Icon?: LucideIcon;
  shortcut?: string;
  keywords?: string[];
  run: () => void | Promise<void>;
};

type State = {
  open: boolean;
  commands: Map<string, Command>;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  register: (cmd: Command) => () => void;
  registerMany: (cmds: Command[]) => () => void;
  list: () => Command[];
};

export const useCommands = create<State>((set, get) => ({
  open: false,
  commands: new Map(),
  setOpen: (v) => set({ open: v }),
  toggle: () => set({ open: !get().open }),
  register: (cmd) => {
    const next = new Map(get().commands);
    next.set(cmd.id, cmd);
    set({ commands: next });
    return () => {
      const m = new Map(get().commands);
      m.delete(cmd.id);
      set({ commands: m });
    };
  },
  registerMany: (cmds) => {
    const next = new Map(get().commands);
    for (const c of cmds) next.set(c.id, c);
    set({ commands: next });
    return () => {
      const m = new Map(get().commands);
      for (const c of cmds) m.delete(c.id);
      set({ commands: m });
    };
  },
  list: () => Array.from(get().commands.values()),
}));

/** Tiny fuzzy ranking — case-insensitive substring + token boundary boost. */
export function rankCommands(cmds: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return cmds;
  const tokens = q.split(/\s+/);
  const scored = cmds
    .map((c) => {
      const haystack = [c.label, ...(c.keywords ?? []), c.section].join(" ").toLowerCase();
      let score = 0;
      for (const t of tokens) {
        const idx = haystack.indexOf(t);
        if (idx === -1) {
          score = -1;
          break;
        }
        score += 100 - idx; // earlier match scores higher
        if (idx === 0 || haystack[idx - 1] === " ") score += 30; // word boundary
        if (c.label.toLowerCase().startsWith(t)) score += 50;
      }
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.c);
}
