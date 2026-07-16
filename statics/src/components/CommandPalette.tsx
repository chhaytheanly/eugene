import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Command, MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit,
  Settings, Search, ArrowRight, Terminal, Palette, Sparkles
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme, type Theme } from "./ThemeProvider";

const THEME_ORDER: Theme[] = ["green", "amber", "blue", "purple"];

interface Action {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme, toggleMode, mode } = useTheme();

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme);
    setTheme(THEME_ORDER[(idx + 1) % THEME_ORDER.length]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSearch("");
      setActiveIndex(0);
    }
  }, [open]);

  const actions: Action[] = [
    {
      id: "nav-chat", label: "Open Chat", description: "Switch to chat interface",
      icon: MessageSquare, category: "Navigation", shortcut: "Ctrl+1",
      onSelect: () => navigate("/"),
    },
    {
      id: "nav-tasks", label: "Open Tasks", description: "View task list",
      icon: CheckSquare, category: "Navigation", shortcut: "Ctrl+2",
      onSelect: () => navigate("/tasks"),
    },
    {
      id: "nav-notes", label: "Open Notes", description: "Browse notes",
      icon: StickyNote, category: "Navigation", shortcut: "Ctrl+3",
      onSelect: () => navigate("/notes"),
    },
    {
      id: "nav-cal", label: "Open Calendar", description: "View calendar",
      icon: Calendar, category: "Navigation", shortcut: "Ctrl+4",
      onSelect: () => navigate("/calendar"),
    },
    {
      id: "nav-mem", label: "Open Memory", description: "Explore semantic memory",
      icon: BrainCircuit, category: "Navigation", shortcut: "Ctrl+5",
      onSelect: () => navigate("/memory"),
    },
    {
      id: "nav-settings", label: "Open Settings", description: "Developer preferences",
      icon: Settings, category: "Navigation", shortcut: "Ctrl+6",
      onSelect: () => navigate("/settings"),
    },
    {
      id: "new-chat", label: "New Conversation", description: "Start fresh chat",
      icon: Sparkles, category: "Chat",
      onSelect: () => navigate("/"),
    },
    {
      id: "search-notes", label: "Search Notes", description: "Find notes by content",
      icon: Search, category: "Search",
      onSelect: () => { navigate("/notes"); },
    },
    {
      id: "search-memory", label: "Search Memory", description: "Find stored memories",
      icon: Search, category: "Search",
      onSelect: () => { navigate("/memory"); },
    },
    {
      id: "toggle-sidebar", label: "Toggle Sidebar", description: "Show or hide sidebar",
      icon: Terminal, category: "View", shortcut: "Ctrl+B",
      onSelect: () => window.dispatchEvent(new CustomEvent("eugene:toggle-sidebar")),
    },
    {
      id: "theme-cycle", label: "Switch Accent", description: `Current: ${theme}`,
      icon: Palette, category: "Theme", shortcut: "Ctrl+T",
      onSelect: cycleTheme,
    },
    {
      id: "mode-toggle", label: mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      description: "Toggle color scheme",
      icon: Sparkles, category: "Theme",
      onSelect: toggleMode,
    },
  ];

  const filtered = actions.filter(a =>
    search === "" ||
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(search.toLowerCase())) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const flatFiltered = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % flatFiltered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + flatFiltered.length) % flatFiltered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatFiltered[activeIndex]) {
        flatFiltered[activeIndex].onSelect();
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelectorAll("[data-action-item]")[activeIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            className="cmd-palette glass-panel w-full max-w-[680px] rounded-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <Command className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="cmd-palette-input outline-none focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--fg-muted)]" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="cmd-palette-list">
              {flatFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-6 h-6 text-[var(--fg-muted)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--fg-muted)]">No results for &ldquo;{search}&rdquo;</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, actions]) => (
                  <div key={category}>
                    <div className="cmd-palette-section">{category}</div>
                    {actions.map(action => {
                      const globalIdx = flatFiltered.indexOf(action);
                      const isActive = globalIdx === activeIndex;
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          data-action-item
                          onClick={() => { action.onSelect(); setOpen(false); }}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={cn("cmd-palette-item", isActive && "selected")}
                        >
                          <div className="cmd-palette-item-main">
                            <div style={{ color: isActive ? "var(--accent)" : "var(--fg-muted)" }}>
                              <Icon className="cmd-palette-item-icon" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span style={{ color: isActive ? "var(--fg)" : "var(--fg)" }}>{action.label}</span>
                              {action.description && (
                                <p className="cmd-palette-item-desc">{action.description}</p>
                              )}
                            </div>
                          </div>
                          {action.shortcut && (
                            <kbd className="cmd-palette-item-shortcut">{action.shortcut}</kbd>
                          )}
                          {isActive && <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2 text-[10px] text-[var(--fg-muted)]"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-elevated, rgba(0,0,0,0.15))" }}
            >
              <span>
                <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>↑↓</kbd>
                {" "} navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>↵</kbd>
                {" "} select
              </span>
              <span>{flatFiltered.length} commands</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}