import { Link, useLocation } from "react-router-dom";
import { MessageSquare, StickyNote, CheckSquare, Calendar, BrainCircuit } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Assistant", path: "/", icon: MessageSquare },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Notes", path: "/notes", icon: StickyNote },
  { name: "Calendar", path: "/calendar", icon: Calendar },
  { name: "Memory", path: "/memory", icon: BrainCircuit },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-semibold tracking-tight">Eugene Workspace</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Personal AI Assistant</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center border border-[var(--border)]">
              <span className="text-xs font-mono text-[var(--muted-foreground)]">US</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">User</span>
              <span className="text-xs text-[var(--muted-foreground)]">Local env</span>
            </div>
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
