import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { colors, radius, shadow } from "@/ui/tokens/colors";
import { rankCommands, useCommands, type Command } from "@/lib/commands";
import { Kbd } from "@/ui/primitives/Kbd";

export function CommandPalette() {
  const { open, setOpen, list } = useCommands();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query and refocus when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const all = list();
  const ranked = useMemo(() => rankCommands(all, query), [all, query]);

  // group by section, preserving order
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of ranked) {
      const s = c.section;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(c);
    }
    return Array.from(map.entries());
  }, [ranked]);

  const flat = ranked;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[active];
      if (cmd) {
        setOpen(false);
        cmd.run();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14,14,12,0.42)",
            backdropFilter: "blur(8px)",
            display: "grid",
            placeItems: "start center",
            paddingTop: "12vh",
            zIndex: 250,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKey}
            style={{
              width: 640,
              maxWidth: "92vw",
              background: colors.paperLow,
              borderRadius: radius.xl,
              boxShadow: shadow.lg,
              border: `1px solid ${colors.hairline}`,
              overflow: "hidden",
            }}
          >
            {/* Search row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 18px",
                borderBottom: `1px solid ${colors.hairline}`,
              }}
            >
              <Search size={16} strokeWidth={1.8} color={colors.inkMute} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search commands, cases, actions…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
              <Kbd muted>esc</Kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: "55vh", overflowY: "auto", padding: 8 }}>
              {flat.length === 0 ? (
                <div
                  style={{
                    padding: "32px 18px",
                    textAlign: "center",
                    color: colors.inkMute,
                    fontSize: 13,
                  }}
                >
                  No matching commands.
                </div>
              ) : (
                groups.map(([section, items]) => (
                  <div key={section} style={{ marginBottom: 6 }}>
                    <div
                      style={{
                        padding: "10px 12px 6px",
                        fontFamily: "var(--font-display)",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: colors.inkFade,
                      }}
                    >
                      {section}
                    </div>
                    {items.map((cmd) => {
                      const idx = flat.indexOf(cmd);
                      const isActive = idx === active;
                      return (
                        <button
                          key={cmd.id}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => {
                            setOpen(false);
                            cmd.run();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            padding: "10px 12px",
                            background: isActive ? colors.paperWarm : "transparent",
                            color: colors.ink,
                            borderRadius: radius.sm,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {cmd.Icon ? (
                            <cmd.Icon size={16} strokeWidth={1.8} color={colors.inkMute} />
                          ) : (
                            <ArrowRight size={14} strokeWidth={1.8} color={colors.inkFade} />
                          )}
                          <span
                            style={{
                              flex: 1,
                              fontFamily: "var(--font-display)",
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                          >
                            {cmd.label}
                          </span>
                          {cmd.shortcut && <Kbd muted>{cmd.shortcut}</Kbd>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderTop: `1px solid ${colors.hairline}`,
                background: colors.paperTile,
                fontSize: 11,
                color: colors.inkMute,
                fontFamily: "var(--font-display)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Kbd muted>↑↓</Kbd> navigate
                <span style={{ marginLeft: 8 }}>
                  <Kbd muted>↵</Kbd> run
                </span>
              </span>
              <span>{flat.length} result{flat.length === 1 ? "" : "s"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
