import { useState, useEffect } from "react";
import { Zap, Cpu, MemoryStick, Palette } from "lucide-react";
import { useTheme, type Theme, themeLabels } from "./ThemeProvider";

interface StatusBarProps {
  tokensUsed?: number;
  latencyMs?: number;
}

const themes: Theme[] = ["green", "amber", "blue", "purple"];

export function StatusBar({ tokensUsed, latencyMs }: StatusBarProps) {
  const { theme, setTheme } = useTheme();
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 15)));
      setRam(prev => Math.min(100, Math.max(20, prev + (Math.random() - 0.5) * 5)));
    }, 2000);
    setCpu(18 + Math.random() * 20);
    setRam(42 + Math.random() * 15);
    return () => clearInterval(interval);
  }, []);

  const cycleTheme = () => {
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  return (
    <div className="status-bar shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 flex-1">
        <span className="w-2 h-2 rounded-full inline-block status-pulse" style={{ color: "rgb(74,222,128)", background: "rgb(74,222,128)", boxShadow: "0 0 6px rgba(74,222,128,0.8)" }} />
        <span className="text-[11px] font-medium" style={{ color: "rgb(74,222,128)" }}>System Ready</span>
      </div>

      {/* Center — clickable theme */}
      <button
        onClick={cycleTheme}
        className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md hover:bg-[var(--muted)] transition-colors"
        title={`Click to change theme (current: ${themeLabels[theme]})`}
      >
        <Palette className="w-3 h-3" style={{ color: "var(--accent)" }} />
        <span style={{ color: "var(--accent)" }}>{themeLabels[theme]}</span>
        <span className="text-[var(--muted-foreground)]">•</span>
        <span className="text-[var(--muted-foreground)]">Poolside</span>
      </button>

      {/* Right */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <span className="text-[var(--muted-foreground)] opacity-60 hidden sm:inline">user@eugene</span>

        {tokensUsed !== undefined && (
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <Zap className="w-3 h-3" style={{ color: "var(--accent)" }} />
            <span>{tokensUsed.toLocaleString()} tok</span>
          </div>
        )}

        {latencyMs !== undefined && (
          <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "rgb(74,222,128)" }} />
            <span>{latencyMs}ms</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-[var(--muted-foreground)] hidden md:flex">
          <Cpu className="w-3 h-3" />
          <span className={cpu > 70 ? "text-yellow-400" : ""}>{Math.round(cpu)}%</span>
        </div>

        <div className="flex items-center gap-1 text-[var(--muted-foreground)] hidden md:flex">
          <MemoryStick className="w-3 h-3" />
          <span className={ram > 80 ? "text-red-400" : ""}>{Math.round(ram)}%</span>
        </div>
      </div>
    </div>
  );
}
