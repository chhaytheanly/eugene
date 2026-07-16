import { useState, useEffect } from "react";
import { Zap, Cpu, MemoryStick, Palette, Sun, Moon } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

interface StatusBarProps {
  tokensUsed?: number;
  latencyMs?: number;
  modelName?: string;
  provider?: string;
  connected?: boolean;
}

const themes: Theme[] = ["green", "amber", "blue", "purple"];

export function StatusBar({ tokensUsed, latencyMs, modelName, provider, connected = true }: StatusBarProps) {
  const { theme, setTheme, themeLabels, themeIcons, mode, toggleMode } = useTheme();
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 15)));
      setRam(prev => Math.min(100, Math.max(20, prev + (Math.random() - 0.5) * 5)));
      setTime(new Date());
    }, 2000);
    setCpu(18 + Math.random() * 20);
    setRam(42 + Math.random() * 15);
    return () => clearInterval(interval);
  }, []);

  const cycleTheme = () => {
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="status-bar shrink-0" role="statusbar" aria-label="Status bar">
      {/* Left section - system status */}
      <div className="status-bar-section flex-1">
        <div className="status-bar-item" title="System status">
          <span className="status-indicator" style={{ background: "var(--success)", boxShadow: "0 0 6px color-mix(in srgb, var(--success) 80%, transparent)" }} />
          <span className="text-[11px] font-medium" style={{ color: "var(--success)" }}>SYSTEM READY</span>
        </div>

        <div className="status-bar-separator" />

        <div className="status-bar-item" title={`Model: ${modelName || "None"}`}>
          <Zap className="w-3 h-3" style={{ color: "var(--accent)" }} />
          <span className="text-[11px] truncate max-w-[160px]">{modelName || "No model"}</span>
        </div>

        {provider && (
          <div className="status-bar-item" title={`Provider: ${provider}`}>
            <span className="text-[10px] text-[var(--fg-subtle)] uppercase">{provider}</span>
          </div>
        )}
      </div>

      {/* Center section - theme + mode */}
      <div className="status-bar-section">
        <button
          onClick={toggleMode}
          className="status-bar-item"
          title={`Mode: ${mode === "dark" ? "Dark" : "Light"} (Click to toggle)`}
          aria-label={`Current mode: ${mode}. Click to toggle.`}
        >
          {mode === "dark" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
        </button>
        <button
          onClick={cycleTheme}
          className="status-bar-item active"
          title={`Theme: ${themeLabels[theme]} (Click to cycle)`}
          aria-label={`Current theme: ${themeLabels[theme]}. Click to cycle themes.`}
        >
          <Palette className="w-3 h-3" style={{ color: "var(--accent)" }} />
          <span style={{ color: "var(--accent)" }}>{themeIcons[theme]} {themeLabels[theme]}</span>
        </button>
      </div>

      {/* Right section - metrics and time */}
      <div className="status-bar-section flex-1 justify-end">
        {tokensUsed !== undefined && tokensUsed > 0 && (
          <div className="status-bar-item" title="Tokens used">
            <Zap className="w-3 h-3" style={{ color: "var(--accent)" }} />
            <span>{tokensUsed.toLocaleString()} tok</span>
          </div>
        )}

        {latencyMs !== undefined && (
          <div className="status-bar-item" title="Response latency">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--success)" }} />
            <span>{latencyMs}ms</span>
          </div>
        )}

        <div className="status-bar-separator" />

        <div className="status-bar-item hidden sm:flex" title="CPU usage">
          <Cpu className="w-3 h-3" />
          <span className={cpu > 70 ? "text-[var(--warning)]" : ""}>{Math.round(cpu)}%</span>
        </div>

        <div className="status-bar-item hidden sm:flex" title="Memory usage">
          <MemoryStick className="w-3 h-3" />
          <span className={ram > 80 ? "text-[var(--danger)]" : ""}>{Math.round(ram)}%</span>
        </div>

        <div className="status-bar-separator" />

        <div className="status-bar-item" title={connected ? "Connected" : "Disconnected"}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? "var(--success)" : "var(--danger)" }} />
          <span className="text-[11px]">{connected ? "ONLINE" : "OFFLINE"}</span>
        </div>

        <div className="status-bar-separator" />

        <div className="status-bar-item" title="Current time">
          <span className="text-[11px] font-mono tabular-nums">{formatTime(time)}</span>
        </div>
      </div>
    </div>
  );
}