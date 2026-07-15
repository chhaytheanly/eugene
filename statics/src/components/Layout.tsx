import { Link, useLocation } from "react-router-dom";
import { MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit, Terminal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import ModelSwitcher from "./ModelSwitcher";

const navItems = [
  { name: "chat", path: "/", icon: MessageSquare },
  { name: "tasks", path: "/tasks", icon: CheckSquare },
  { name: "notes", path: "/notes", icon: StickyNote },
  { name: "calendar", path: "/calendar", icon: Calendar },
  { name: "memory", path: "/memory", icon: BrainCircuit },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-mono">
      {/* Sidebar */}
      <aside className="w-52 border-r border-[var(--border)] flex flex-col bg-[var(--surface)] shrink-0">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-semibold tracking-tight">eugene</span>
            <span className="text-[10px] text-[var(--muted-foreground)] border border-[var(--border)] rounded px-1 leading-tight">v0</span>
          </div>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 ml-6">ai work assistant</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 text-xs rounded-sm transition-colors",
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

        {/* Model selector / bottom */}
        <div className="px-3 py-3 border-t border-[var(--border)] space-y-2">
          <ModelSwitcher />
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded-sm bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
              <span className="text-[9px] font-bold text-[var(--muted-foreground)]">~</span>
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">user@eugene</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
