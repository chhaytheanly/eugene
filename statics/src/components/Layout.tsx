import { Link, useLocation } from "react-router-dom";
import { MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit, Terminal, Palette, Menu, X, Sun, Moon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "../lib/utils";
import ModelSwitcher from "./ModelSwitcher";
import { useTheme } from "./ThemeProvider";
import { ErrorBoundary } from "./ErrorBoundary";
import { CommandPalette } from "./CommandPalette";

const navItems = [
  { name: "chat", path: "/", icon: MessageSquare },
  { name: "tasks", path: "/tasks", icon: CheckSquare },
  { name: "notes", path: "/notes", icon: StickyNote },
  { name: "calendar", path: "/calendar", icon: Calendar },
  { name: "memory", path: "/memory", icon: BrainCircuit },
];

const themes = [
  { name: "green", bgClass: "bg-[#22c55e]" },
  { name: "amber", bgClass: "bg-[#fbbf24]" },
  { name: "blue", bgClass: "bg-[#3b82f6]" },
  { name: "purple", bgClass: "bg-[#a855f7]" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, setTheme, mode, toggleMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-mono transition-colors duration-300 relative">
      <div className="bg-aurora">
        <div className="aurora-blob" />
        <div className="aurora-grid" />
      </div>
      <CommandPalette />
      {/* Mobile nav toggle */}
      <button 
        className="md:hidden absolute top-3 right-4 z-50 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-md text-[var(--muted-foreground)]"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <aside className={cn(
        "absolute md:relative z-40 w-52 h-full border-r border-[var(--border)] flex flex-col bg-[var(--surface)] shrink-0 transition-all duration-300",
        mobileMenuOpen ? "left-0" : "-left-52 md:left-0"
      )}>
        <div className="px-4 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent)] transition-colors duration-300" />
            <span className="text-sm font-semibold tracking-tight">eugene</span>
            <span className="text-[10px] text-[var(--muted-foreground)] border border-[var(--border)] rounded px-1 leading-tight">v0</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 ml-6">ai work assistant</p>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 text-xs rounded-sm transition-all duration-200",
                  isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] border-l-2 border-transparent"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">
            <Palette className="w-3 h-3" />
            <span>Theme</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name as any)}
                  className={cn(
                    "w-4 h-4 rounded-full border border-[var(--border)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]",
                    theme === t.name ? "ring-2 ring-[var(--foreground)] ring-offset-1 ring-offset-[var(--surface)]" : ""
                  )}
                  style={{ backgroundColor: t.bgClass.replace('bg-[', '').replace(']', '') }}
                  title={t.name}
                />
              ))}
            </div>
            <button
              onClick={toggleMode}
              className="p-1 rounded-sm border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              title={mode === "dark" ? "Switch to light" : "Switch to dark"}
              aria-label="Toggle theme mode"
            >
              {mode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-[var(--border)] space-y-2">
          <ModelSwitcher />
          <div className="flex items-center gap-2 px-1 mt-2">
            <div className="w-5 h-5 rounded-sm bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
              <span className="text-[9px] font-bold text-[var(--muted-foreground)]">~</span>
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">user@eugene</span>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--background)] transition-colors duration-300">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}