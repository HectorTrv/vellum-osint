import type { ReactNode } from "react";
import { NavRail } from "./NavRail";
import { StatusBar } from "./StatusBar";
import { colors } from "@/ui/tokens/colors";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: colors.paper,
        color: colors.ink,
        overflow: "hidden",
      }}
    >
      <NavRail />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <StatusBar />
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>{children}</div>
      </main>
    </div>
  );
}
