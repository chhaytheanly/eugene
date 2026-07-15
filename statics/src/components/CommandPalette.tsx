import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Command, MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
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

  const actions = [
    { id: "nav-chat", label: "Go to Chat", icon: MessageSquare, onSelect: () => navigate("/") },
    { id: "nav-tasks", label: "Go to Tasks", icon: CheckSquare, onSelect: () => navigate("/tasks") },
    { id: "nav-notes", label: "Go to Notes", icon: StickyNote, onSelect: () => navigate("/notes") },
    { id: "nav-cal", label: "Go to Calendar", icon: Calendar, onSelect: () => navigate("/calendar") },
    { id: "nav-mem", label: "Go to Memory", icon: BrainCircuit, onSelect: () => navigate("/memory") },
    { id: "theme-green", label: "Theme: Green", icon: Moon, onSelect: () => setTheme("green") },
    { id: "theme-amber", label: "Theme: Amber", icon: Moon, onSelect: () => setTheme("amber") },
    { id: "theme-blue", label: "Theme: Blue", icon: Moon, onSelect: () => setTheme("blue") },
    { id: "theme-purple", label: "Theme: Purple", icon: Moon, onSelect: () => setTheme("purple") },
  ];

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        filtered[activeIndex].onSelect();
        setOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl overflow-hidden font-mono"
          >
            <div className="flex items-center px-4 py-3 border-b border-[var(--border)]">
              <Command className="w-4 h-4 text-[var(--muted-foreground)] mr-3 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
              <span className="text-[10px] text-[var(--muted-foreground)] border border-[var(--border)] px-1.5 py-0.5 rounded ml-2">ESC</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-[var(--muted-foreground)]">No results found.</div>
              ) : (
                filtered.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onSelect();
                      setOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center px-4 py-2.5 text-[13px] transition-colors ${
                      i === activeIndex ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <action.icon className={`w-4 h-4 mr-3 shrink-0 ${i === activeIndex ? "text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)]"}`} />
                    {action.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
