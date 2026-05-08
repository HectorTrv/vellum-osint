import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  toggle: () => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light" as ThemeMode,
      toggle: () =>
        set((s) => ({ mode: s.mode === "light" ? "dark" : "light" })),
    }),
    { name: "vellum.theme.v1" }
  )
);

/** Apply the current theme to the document root (call on mount and on change). */
export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
}
