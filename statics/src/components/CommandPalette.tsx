import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Command, MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit,
  Settings, Palette, PanelLeft, Search, ArrowRight
} from "lucide-react";

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
      id: "nav-chat", label: "Open Chat", description: "Go to the chat interface",
      icon: MessageSquare, category: "Navigation", shortcut: "1",
      onSelect: () => navigate("/"),
    },
    {
      id: "nav-tasks", label: "Open Tasks", description: "View your task list",
      icon: CheckSquare, category: "Navigation", shortcut: "2",
      onSelect: () => navigate("/tasks"),
    },
    {
      id: "nav-notes", label: "Open Notes", description: "Browse your notes",
      icon: StickyNote, category: "Navigation", shortcut: "3",
      onSelect: () => navigate("/notes"),
    },
    {
      id: "nav-cal", label: "Open Calendar", description: "View upcoming events",
      icon: Calendar, category: "Navigation", shortcut: "4",
      onSelect: () => navigate("/calendar"),
    },
    {
      id: "nav-mem", label: "Open Memory", description: "Explore semantic memory",
      icon: BrainCircuit, category: "Navigation", shortcut: "5",
      onSelect: () => navigate("/memory"),
    },
    {
      id: "nav-settings", label: "Open Settings", description: "Developer preferences",
      icon: Settings, category: "Navigation",
      onSelect: () => navigate("/settings"),
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
      id: "new-task", label: "New Task", description: "Create a new task",
      icon: CheckSquare, category: "Create",
      onSelect: () => navigate("/tasks"),
    },
    {
      id: "toggle-sidebar", label: "Toggle Sidebar", description: "Show or hide sidebar",
      icon: PanelLeft, category: "View",
      onSelect: () => {},
    },
    {
      id: "theme-neo", label: "Switch Theme: Neo Dark", description: "Current: Neo Dark",
      icon: Palette, category: "Theme",
      onSelect: () => {},
    },
  ];

  const filtered = actions.filter(a =>
    search === "" ||
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    (a.description && a.description.toLowerCase().includes(search.toLowerCase())) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  // Flat index for keyboard navigation
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

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelectorAll("[data-action-item]")[activeIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="command-palette relative w-full max-w-[560px] overflow-hidden"
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <Command className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--muted-foreground)]"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
              {flatFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-6 h-6 text-[var(--muted-foreground)] opacity-30 mb-3" />
                  <p className="text-sm text-[var(--muted-foreground)]">No results for "{search}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, actions]) => (
                  <div key={category} className="py-1">
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                        {category}
                      </span>
                    </div>
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
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{
                              background: isActive ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                              borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                            }}
                        >
                          <div style={{ color: isActive ? "var(--accent)" : "var(--muted-foreground)" }}>
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span style={{ color: isActive ? "var(--foreground)" : "var(--foreground)" }}>{action.label}</span>
                            {action.description && (
                              <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                                {action.description}
                              </p>
                            )}
                          </div>
                          {action.shortcut && (
                            <kbd className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono"
                              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
                              {action.shortcut}
                            </kbd>
                          )}
                          {isActive && (
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2 text-[10px] text-[var(--muted-foreground)]"
              style={{ borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}
            >
              <span>
                <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>↑↓</kbd>
                {" "} navigate
              </span>
              <span>
                <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>↵</kbd>
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
