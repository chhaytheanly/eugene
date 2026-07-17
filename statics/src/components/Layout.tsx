import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit, Settings,
  MessageSquareDot, CheckSquare2, BookOpen, CalendarDays, Brain, SettingsIcon,
  PanelLeftClose, PanelLeftOpen, Terminal, Code2, Code
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";
import { CommandPalette } from "./CommandPalette";
import { StatusBar } from "./StatusBar";
import { motion, AnimatePresence } from "framer-motion";

type ActivitySection = "chat" | "tasks" | "notes" | "calendar" | "memory" | "settings" | "developer";

interface NavItem {
  id: ActivitySection;
  path: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  FilledIcon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  shortKey: string;
}

const navItems: NavItem[] = [
  { id: "chat", path: "/", label: "Chat", Icon: MessageSquare, FilledIcon: MessageSquareDot, tooltip: "Chat", shortKey: "1" },
  { id: "tasks", path: "/tasks", label: "Tasks", Icon: CheckSquare, FilledIcon: CheckSquare2, tooltip: "Tasks", shortKey: "2" },
  { id: "notes", path: "/notes", label: "Notes", Icon: StickyNote, FilledIcon: BookOpen, tooltip: "Notes", shortKey: "3" },
  { id: "calendar", path: "/calendar", label: "Calendar", Icon: Calendar, FilledIcon: CalendarDays, tooltip: "Calendar", shortKey: "4" },
  { id: "memory", path: "/memory", label: "Memory", Icon: BrainCircuit, FilledIcon: Brain, tooltip: "Memory", shortKey: "5" },
  { id: "settings", path: "/settings", label: "Settings", Icon: Settings, FilledIcon: SettingsIcon, tooltip: "Settings", shortKey: "6" },
  { id: "developer", path: "/developer", label: "Developer", Icon: Code, FilledIcon: Code2, tooltip: "Developer", shortKey: "7" },
];

function pathToSection(path: string): ActivitySection {
  if (path === "/") return "chat";
  if (path.startsWith("/tasks")) return "tasks";
  if (path.startsWith("/notes")) return "notes";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/memory")) return "memory";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/developer")) return "developer";
  return "chat";
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActivitySection>(pathToSection(location.pathname));
  const [barOpen, setBarOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setBarOpen(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onToggle = () => setBarOpen(o => !o);
    window.addEventListener("eugene:toggle-sidebar", onToggle);
    return () => window.removeEventListener("eugene:toggle-sidebar", onToggle);
  }, []);

  const handleNavClick = (item: NavItem) => {
    setActiveSection(item.id);
    if (item.id !== "settings") {
      navigate(item.path);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSection(pathToSection(location.pathname));
  }, [location.pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "7") {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      if (navItems[idx]) {
        handleNavClick(navItems[idx]);
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      setBarOpen(o => !o);
    }
  };

  return (
    <>
      <CommandPalette />

      <div
        className="relative flex flex-col overflow-hidden"
        style={{ height: "100dvh", background: "transparent", zIndex: 1 }}
        onKeyDown={handleKeyDown}
      >
        <div className="ambient-glow" />

        <div className="flex flex-1 min-h-0 relative">
          {/* ===================== ACTIVITY BAR ===================== */}
          <AnimatePresence initial={false}>
            {barOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 64, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col items-center py-3 gap-1.5 shrink-0 border-r border-[var(--border)] relative z-30 overflow-hidden"
              >
                <div className="activity-bar-logo flex items-center justify-center w-8 h-8 rounded-md mb-2"
                  style={{ background: "var(--accent-dim)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                  <Terminal className="w-4 h-4" style={{ color: "var(--accent)" }} />
                </div>

                <div className="flex flex-col items-center gap-0.5 flex-1 overflow-hidden">
                  {navItems.map(item => {
                    const isActive = activeSection === item.id;
                    const Icon = isActive ? item.FilledIcon : item.Icon;
                    return (
                      <div key={item.id} className="relative group">
                        <button
                          onClick={() => handleNavClick(item)}
                          className={cn("activity-bar-item", isActive && "active")}
                          title={`${item.tooltip} (Ctrl+${item.shortKey})`}
                          aria-label={`${item.tooltip} (Ctrl+${item.shortKey})`}
                          aria-current={isActive}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                        <div className="activity-tooltip">
                          <span>{item.tooltip}</span>
                          <kbd>Ctrl+{item.shortKey}</kbd>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setBarOpen(false)}
                  className="p-1.5 rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors mt-2"
                  title="Hide navigation (Ctrl+B)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ===================== MAIN WORKSPACE ===================== */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>

          {!barOpen && (
            <button
              onClick={() => setBarOpen(true)}
              className="absolute top-3 left-3 z-30 p-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors shadow-soft"
              title="Show navigation (Ctrl+B)"
              aria-label="Show navigation"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ===================== STATUS BAR ===================== */}
        <StatusBar />
      </div>
    </>
  );
}