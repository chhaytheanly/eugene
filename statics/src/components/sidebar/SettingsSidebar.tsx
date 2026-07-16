import { useState } from "react";
import { Palette, Cpu, Eye, Key, BrainCircuit, Keyboard, ChevronRight, Check } from "lucide-react";
import ModelSwitcher from "../ModelSwitcher";
import { cn } from "../../lib/utils";
import { useTheme, type Theme, themeLabels } from "../ThemeProvider";

const sections = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "model", label: "Model", icon: Cpu },
  { id: "appearance", label: "Appearance", icon: Eye },
  { id: "api", label: "API Providers", icon: Key },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
];

const shortcuts = [
  { key: "Ctrl+P", desc: "Command Palette" },
  { key: "Enter", desc: "Send message" },
  { key: "Shift+Enter", desc: "New line" },
  { key: "↑ / ↓", desc: "Command history" },
];

const themeColors: Record<Theme, string> = {
  green: "#22C55E",
  amber: "#F59E0B",
  blue: "#3B82F6",
  purple: "#A855F7",
};

export function SettingsSidebar() {
  const [active, setActive] = useState("theme");
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--foreground)]">Settings</p>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Developer Preferences</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActive(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors",
                active === section.id
                  ? "bg-[var(--muted)] text-[var(--accent)] border-l-2 border-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{section.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
            </button>
          );
        })}

        {/* Settings content preview */}
        <div className="px-4 py-4 mt-2 border-t border-[var(--border)]">
          {active === "model" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Active Model</p>
              <ModelSwitcher />
            </div>
          )}
          {active === "shortcuts" && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">Keyboard Shortcuts</p>
              {shortcuts.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted-foreground)]">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 bg-[var(--muted)] border border-[var(--border)] rounded text-[10px] font-mono text-[var(--foreground)]">{s.key}</kbd>
                </div>
              ))}
            </div>
          )}
          {active === "theme" && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">Accent Color</p>
              <div className="space-y-1">
                {(Object.keys(themeColors) as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                      theme === t ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]"
                    )}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ background: themeColors[t], boxShadow: theme === t ? `0 0 8px ${themeColors[t]}` : "none" }} />
                    <span className="text-xs text-[var(--foreground)] flex-1">{themeLabels[t]}</span>
                    {theme === t && <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(active === "appearance" || active === "api" || active === "memory") && (
            <div className="text-center py-4">
              <p className="text-xs text-[var(--muted-foreground)] opacity-60">Coming soon</p>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
