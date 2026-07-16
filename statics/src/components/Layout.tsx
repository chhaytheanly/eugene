import { useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquare, CheckSquare, StickyNote, Calendar, BrainCircuit, Settings,
  MessageSquareDot, CheckSquare2, BookOpen, CalendarDays, Brain, SettingsIcon,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";
import { CommandPalette } from "./CommandPalette";
import { StatusBar } from "./StatusBar";
import { ChatSidebar } from "./sidebar/ChatSidebar";
import { TasksSidebar } from "./sidebar/TasksSidebar";
import { NotesSidebar } from "./sidebar/NotesSidebar";
import { CalendarSidebar } from "./sidebar/CalendarSidebar";
import { MemorySidebar } from "./sidebar/MemorySidebar";
import { SettingsSidebar } from "./sidebar/SettingsSidebar";
import { motion, AnimatePresence } from "framer-motion";

type ActivitySection = "chat" | "tasks" | "notes" | "calendar" | "memory" | "settings";

interface NavItem {
  id: ActivitySection;
  path: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  FilledIcon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}

const navItems: NavItem[] = [
  { id: "chat", path: "/", label: "Chat", Icon: MessageSquare, FilledIcon: MessageSquareDot, tooltip: "Chat" },
  { id: "tasks", path: "/tasks", label: "Tasks", Icon: CheckSquare, FilledIcon: CheckSquare2, tooltip: "Tasks" },
  { id: "notes", path: "/notes", label: "Notes", Icon: StickyNote, FilledIcon: BookOpen, tooltip: "Notes" },
  { id: "calendar", path: "/calendar", label: "Calendar", Icon: Calendar, FilledIcon: CalendarDays, tooltip: "Calendar" },
  { id: "memory", path: "/memory", label: "Memory", Icon: BrainCircuit, FilledIcon: Brain, tooltip: "Memory" },
  { id: "settings", path: "/settings", label: "Settings", Icon: Settings, FilledIcon: SettingsIcon, tooltip: "Settings" },
];

function getSidebarContent(section: ActivitySection, onNewChat: () => void, navigate: ReturnType<typeof useNavigate>) {
  switch (section) {
    case "chat": return <ChatSidebar onNewChat={onNewChat} />;
    case "tasks": return <TasksSidebar />;
    case "notes": return <NotesSidebar onSelectNote={() => navigate("/notes")} />;
    case "calendar": return <CalendarSidebar />;
    case "memory": return <MemorySidebar />;
    case "settings": return <SettingsSidebar />;
  }
}

function pathToSection(path: string): ActivitySection {
  if (path === "/") return "chat";
  if (path.startsWith("/tasks")) return "tasks";
  if (path.startsWith("/notes")) return "notes";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/memory")) return "memory";
  if (path.startsWith("/settings")) return "settings";
  return "chat";
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActivitySection>(pathToSection(location.pathname));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNavClick = (item: NavItem) => {
    if (activeSection === item.id && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveSection(item.id);
      setSidebarOpen(true);
      // Only navigate for non-settings items (settings is in sidebar only)
      if (item.id !== "settings") {
        navigate(item.path);
      }
    }
  };

  const handleNewChat = () => {
    navigate("/");
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", background: "var(--background)" }}
    >
      {/* Ambient background */}
      <div className="bg-ambient" />
      <div className="bg-grid" />

      <CommandPalette />

      {/* Main grid: activity bar + sidebar + main */}
      <div className="flex flex-1 min-h-0">
        {/* ===================== ACTIVITY BAR ===================== */}
        <div
          className="flex flex-col items-center py-4 gap-2 shrink-0 border-r border-[var(--border)] relative z-20"
          style={{ width: 60, background: "var(--sidebar-bg)" }}
        >
          {/* Logo */}
          <div className="activity-bar-logo">
            <span className="text-[10px] font-bold font-mono" style={{ color: "var(--accent)" }}>E</span>
          </div>

          {/* Nav items */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {navItems.map(item => {
              const isActive = activeSection === item.id && sidebarOpen;
              const Icon = isActive ? item.FilledIcon : item.Icon;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => handleNavClick(item)}
                    className={cn("activity-bar-item", isActive && "active")}
                    title={item.tooltip}
                    aria-label={item.tooltip}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    <div className="px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap"
                      style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--foreground)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                      {item.tooltip}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* ===================== SIDEBAR ===================== */}
        <div
          className={cn("sidebar-panel shrink-0 border-r border-[var(--border)] overflow-hidden relative z-10", sidebarOpen ? "expanded" : "collapsed")}
          style={{ background: "var(--sidebar-bg)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full w-[280px]"
            >
              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {navItems.find(i => i.id === activeSection)?.label}
                </span>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-hidden" style={{ height: "calc(100% - 44px)" }}>
                {getSidebarContent(activeSection, handleNewChat, navigate)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ===================== MAIN WORKSPACE ===================== */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* ===================== STATUS BAR ===================== */}
      <StatusBar />
    </div>
  );
}
