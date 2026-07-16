import { Palette, Cpu, Eye, Key, BrainCircuit, Keyboard, Check, Info } from "lucide-react";
import { useState } from "react";
import ModelSwitcher from "../components/ModelSwitcher";
import { cn } from "../lib/utils";
import { useTheme, type Theme, themeLabels } from "../components/ThemeProvider";

const sections = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "model", label: "Model", icon: Cpu },
  { id: "appearance", label: "Appearance", icon: Eye },
  { id: "api", label: "API Providers", icon: Key },
  { id: "memory", label: "Memory", icon: BrainCircuit },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
];

const shortcuts = [
  { key: "Ctrl+K", desc: "Command Palette" },
  { key: "Enter", desc: "Send message" },
  { key: "Shift+Enter", desc: "New line" },
  { key: "↑ / ↓", desc: "Command history" },
  { key: "Ctrl+B", desc: "Toggle sidebar" },
];

const themeColors: Record<Theme, string> = {
  green: "#4ADE80", amber: "#FBBF24", blue: "#60A5FA", purple: "#C084FC",
};

export default function Settings() {
  const [active, setActive] = useState("theme");
  const { theme, setTheme, mode, toggleMode } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-6 h-11 shrink-0 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--fg)]">Settings</span>
          <span className="text-xs text-[var(--fg-muted)]">Preferences</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Section nav */}
        <div className="w-48 shrink-0 border-r border-[var(--border)] overflow-y-auto py-2 hidden md:block bg-[var(--surface)]">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActive(section.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors text-left",
                  active === section.id ? "text-[var(--accent)]" : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)]"
                )}
                style={active === section.id ? { background: "color-mix(in srgb, var(--accent) 8%, transparent)", borderLeft: "2px solid var(--accent)" } : { borderLeft: "2px solid transparent" }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile section tabs */}
        <div className="flex md:hidden overflow-x-auto border-b border-[var(--border)] shrink-0 bg-[var(--surface)]">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActive(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap transition-colors border-b-2",
                  active === section.id ? "text-[var(--accent)] border-[var(--accent)]" : "text-[var(--fg-muted)] border-transparent hover:text-[var(--fg)]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {active === "theme" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">Accent Color</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Choose your preferred accent color for the interface.</p>
              <div className="space-y-1">
                {(Object.keys(themeColors) as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left", theme === t ? "bg-[var(--surface)] border border-[var(--border)]" : "hover:bg-[var(--surface-elevated)] border border-transparent")}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ background: themeColors[t] }} />
                    <span className="text-sm text-[var(--fg)] flex-1">{themeLabels[t]}</span>
                    {theme === t && <Check className="w-4 h-4 text-[var(--accent)]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "model" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">Active Model</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Select which AI model to use for conversations.</p>
              <ModelSwitcher />
            </div>
          )}

          {active === "shortcuts" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">Keyboard Shortcuts</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Quick shortcuts for power users.</p>
              <div className="space-y-3">
                {shortcuts.map(s => (
                  <div key={s.key} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-sm text-[var(--fg)]">{s.desc}</span>
                    <kbd className="px-2 py-1 rounded text-xs font-mono text-[var(--fg-muted)] bg-[var(--surface-elevated)] border border-[var(--border)]">{s.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "appearance" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">Appearance</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Customize the visual appearance.</p>
              <button
                onClick={toggleMode}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
                  <div>
                    <span className="text-sm text-[var(--fg)] block">Color Mode</span>
                    <span className="text-xs text-[var(--fg-muted)]">{mode === "dark" ? "Dark" : "Light"}</span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-xs font-mono border border-[var(--border)] text-[var(--fg-muted)]">
                  {mode === "dark" ? "☾" : "☀"}
                </span>
              </button>
            </div>
          )}

          {active === "api" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">API Providers</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Manage your API keys and endpoints.</p>
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--fg)]">Backend URL</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <code className="text-xs text-[var(--accent)] font-mono flex-1">{import.meta.env.VITE_API_URL || "http://localhost:6868"}</code>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <p className="text-xs text-[var(--fg-muted)]">Configure additional API providers in the <code className="text-[var(--accent)]">.env</code> file.</p>
                </div>
              </div>
            </div>
          )}

          {active === "memory" && (
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[var(--fg)] mb-1">Memory Settings</h2>
              <p className="text-xs text-[var(--fg-muted)] mb-4">Configure how Eugene stores and recalls information.</p>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <Info className="w-4 h-4 text-[var(--fg-muted)] shrink-0" />
                <p className="text-xs text-[var(--fg-muted)]">Advanced memory settings coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
