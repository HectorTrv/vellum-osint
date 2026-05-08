import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  Network,
  History,
  FileText,
  Home,
  Folders,
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/app/shell/AppShell";
import { useRouter } from "@/app/router";
import { CoverScreen } from "@/features/cover/CoverScreen";
import { CasesScreen } from "@/features/cases/CasesScreen";
import { CaseDetailScreen } from "@/features/caseDetail/CaseDetailScreen";
import { GraphScreen } from "@/features/graph/GraphScreen";
import { TimelineScreen } from "@/features/timeline/TimelineScreen";
import { ReportsScreen } from "@/features/reports/ReportsScreen";
import { SettingsScreen } from "@/features/settings/SettingsScreen";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { Toaster } from "@/ui/primitives/Toaster";

import { useCases } from "@/lib/casesStore";
import { useCommands, type Command } from "@/lib/commands";
import { useShortcut } from "@/lib/shortcuts";
import { createDemoCase } from "@/lib/demoCase";
import { toast } from "@/lib/toasts";
import { api, isTauri } from "@/lib/api";

export function App() {
  const route = useRouter((s) => s.route);
  const setRoute = useRouter((s) => s.setRoute);
  const openCase = useRouter((s) => s.openCase);
  const refresh = useCases((s) => s.refresh);
  const cases = useCases((s) => s.cases);
  const archive = useCases((s) => s.archive);
  const togglePin = useCases((s) => s.togglePin);

  const setCmdOpen = useCommands((s) => s.setOpen);
  const toggleCmd = useCommands((s) => s.toggle);
  const registerMany = useCommands((s) => s.registerMany);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Register global commands (navigation + actions)
  useEffect(() => {
    const navCommands: Command[] = [
      { id: "nav.home",     section: "Navigation", label: "Go to Home",          Icon: Home,           shortcut: "⌘1", run: () => setRoute("cover") },
      { id: "nav.cases",    section: "Navigation", label: "Go to Cases",         Icon: Folders,        shortcut: "⌘2", run: () => setRoute("cases") },
      { id: "nav.graph",    section: "Navigation", label: "Open Graph Studio",   Icon: Network,        shortcut: "⌘3", run: () => setRoute("graph") },
      { id: "nav.timeline", section: "Navigation", label: "Open Ledger",         Icon: History,        shortcut: "⌘4", run: () => setRoute("timeline") },
      { id: "nav.reports",  section: "Navigation", label: "Open Report Composer", Icon: FileText,      shortcut: "⌘5", run: () => setRoute("reports") },
      { id: "nav.settings", section: "Navigation", label: "Open Settings",       Icon: SettingsIcon,   shortcut: "⌘,", run: () => setRoute("settings") },
    ];
    const actionCommands: Command[] = [
      {
        id: "action.new-case",
        section: "Actions",
        label: "New case…",
        Icon: Plus,
        shortcut: "⌘N",
        keywords: ["create", "open", "investigation"],
        run: () => {
          setRoute("cases");
          // Focus the toolbar's "+ New case" via a soft hint — for now toast invites click
          setTimeout(() => toast.show("Click + New case", "or right-click any card for actions"), 200);
        },
      },
      {
        id: "action.demo",
        section: "Actions",
        label: "Create demo case",
        Icon: Sparkles,
        shortcut: "⌘D",
        keywords: ["sample", "tutorial", "vermilion"],
        run: async () => {
          try {
            const c = await createDemoCase();
            toast.success("Demo case ready", c.title);
            openCase(c.id);
          } catch (e) {
            toast.error("Demo failed", String(e));
          }
        },
      },
      {
        id: "action.search",
        section: "Actions",
        label: "Search vault…",
        Icon: Search,
        shortcut: "⌘K",
        run: () => setCmdOpen(true),
      },
      {
        id: "action.report",
        section: "Actions",
        label: "Generate report",
        Icon: FileText,
        shortcut: "⇧⌘E",
        run: () => setRoute("reports"),
      },
      {
        id: "action.verify-ledger",
        section: "Actions",
        label: "Verify ledger integrity",
        Icon: ShieldCheck,
        keywords: ["hmac", "chain", "tamper"],
        run: async () => {
          if (!isTauri) {
            toast.show("Web preview", "Verification runs in the desktop app.");
            return;
          }
          try {
            const last = cases[0];
            if (!last) {
              toast.show("No case to verify", "Open a case first.");
              return;
            }
            const n = await api.ledgerVerify(last.id);
            toast.success("Chain verified", `${n} events · case ${last.title}`);
          } catch (e) {
            toast.error("Chain broken", String(e));
          }
        },
      },
    ];

    // Per-case commands: open + pin + archive
    const caseCommands: Command[] = cases.flatMap((c) => [
      {
        id: `case.open.${c.id}`,
        section: "Cases",
        label: `Open · ${c.title}`,
        Icon: Folders,
        keywords: [c.kind, c.status, c.id],
        run: () => openCase(c.id),
      },
      {
        id: `case.pin.${c.id}`,
        section: "Cases",
        label: `Pin · ${c.title}`,
        keywords: ["favorite"],
        run: () => {
          togglePin(c.id);
          toast.show("Pin toggled", c.title);
        },
      },
      {
        id: `case.archive.${c.id}`,
        section: "Cases",
        label: `${c.status === "Archived" ? "Restore" : "Archive"} · ${c.title}`,
        run: () => archive(c.id),
      },
    ]);

    const helpCommands: Command[] = [
      {
        id: "help.shortcuts",
        section: "Help",
        label: "Keyboard shortcuts",
        run: () => {
          toast.show(
            "Shortcuts",
            "⌘K palette · ⌘N new case · ⌘D demo · ⌘1-5 nav · ⌘, settings · Esc close"
          );
        },
      },
    ];

    const dispose = registerMany([...navCommands, ...actionCommands, ...caseCommands, ...helpCommands]);
    return dispose;
  }, [registerMany, setRoute, openCase, archive, togglePin, cases, setCmdOpen]);

  // Global keyboard shortcuts
  useShortcut("mod+k", () => toggleCmd());
  useShortcut("mod+n", () => {
    setRoute("cases");
    toast.show("New case", "Click the + button or use the right-click menu");
  });
  useShortcut("mod+d", async () => {
    try {
      const c = await createDemoCase();
      toast.success("Demo case ready", c.title);
      openCase(c.id);
    } catch (e) {
      toast.error("Demo failed", String(e));
    }
  });
  useShortcut("mod+1", () => setRoute("cover"));
  useShortcut("mod+2", () => setRoute("cases"));
  useShortcut("mod+3", () => setRoute("graph"));
  useShortcut("mod+4", () => setRoute("timeline"));
  useShortcut("mod+5", () => setRoute("reports"));
  useShortcut("mod+,", () => setRoute("settings"));

  return (
    <>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            style={{
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {route === "cover"      && <CoverScreen />}
            {route === "cases"      && <CasesScreen />}
            {route === "caseDetail" && <CaseDetailScreen />}
            {route === "graph"      && <GraphScreen />}
            {route === "timeline"   && <TimelineScreen />}
            {route === "reports"    && <ReportsScreen />}
            {route === "settings"   && <SettingsScreen />}
          </motion.div>
        </AnimatePresence>
      </AppShell>

      <CommandPalette />
      <Toaster />
      <Onboarding />
    </>
  );
}
