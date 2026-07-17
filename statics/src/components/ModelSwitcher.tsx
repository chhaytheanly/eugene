import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Search, Cpu } from "lucide-react";
import { getModels, type ModelInfo } from "../api";
import { cn } from "../lib/utils";

const STORAGE_KEY = "eugene:selectedModel";

type Selected = { id: string; provider: string; name: string };

const providerLabel: Record<string, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  opencode: "OpenCode Zen",
  gemini: "Gemini",
};

const providerColor: Record<string, string> = {
  openai: "#10B981",
  openrouter: "#8B5CF6",
  opencode: "#00E5FF",
  gemini: "#3B82F6",
};

export default function ModelSwitcher() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getModels()
      .then((m) => {
        setModels(m);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as Selected;
            const found = m.find((x) => x.id === parsed.id && x.provider === parsed.provider);
            setSelected(found ? { id: found.id, provider: found.provider, name: found.name } : null);
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(m: ModelInfo) {
    const next = { id: m.id, provider: m.provider, name: m.name };
    setSelected(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpen(false);
    setQuery("");
  }

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.id.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  if (models.length === 0) return null;

  const selectedColor = selected ? (providerColor[selected.provider] ?? "var(--accent)") : "var(--fg-muted)";

  return (
    <div className="relative w-full max-w-[260px]" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-all btn-terminal outline"
        style={{
          borderColor: open ? "color-mix(in srgb, var(--accent) 50%, transparent)" : "var(--border)",
          boxShadow: open ? "0 0 0 2px var(--accent-dim)" : "none",
        }}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: selectedColor, boxShadow: `0 0 6px ${selectedColor}80` }} />
        <span className="flex-1 truncate text-left text-sm text-[var(--fg)]">
          {selected?.name ?? "Select model"}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 text-[var(--fg-muted)] transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 left-0 right-0 z-[200] rounded-lg overflow-hidden shadow-2xl"
          style={{
            background: "var(--glass)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(20px) saturate(140%)",
            minWidth: 260,
          }}
        >
          {/* Search */}
          <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[var(--muted)]">
              <Search className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models..."
                className="w-full bg-transparent text-xs text-[var(--fg)] focus:outline-none placeholder:text-[var(--fg-muted)]"
              />
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-[var(--fg-muted)]">
                No models match &ldquo;{query}&rdquo;
              </div>
            )}
            {Object.entries(grouped).map(([provider, list]) => (
              <div key={provider}>
                {/* Provider header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: providerColor[provider] ?? "var(--fg-muted)" }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">
                    {providerLabel[provider] ?? provider}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)] opacity-50 ml-auto">{list.length}</span>
                </div>

                {list.map((m) => {
                  const isActive = selected?.id === m.id && selected?.provider === m.provider;
                  return (
                    <button
                      key={`${m.provider}:${m.id}`}
                      type="button"
                      onClick={() => choose(m)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                        isActive ? "text-[var(--accent)]" : "hover:bg-[var(--muted)]"
                      )}
                      style={{
                        background: isActive ? "var(--accent-dim)" : "transparent",
                      }}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={cn("text-xs font-medium truncate", isActive ? "text-[var(--accent)]" : "text-[var(--fg)]")}>
                          {m.name}
                        </span>
                        <span className="text-[10px] text-[var(--fg-muted)] truncate mt-0.5 font-mono">
                          {m.id}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-3 py-2 text-[10px] text-[var(--fg-muted)] border-t border-[var(--border)] bg-[var(--surface-elevated)]"
          >
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              <span>{models.length} models available</span>
            </div>
            {selected && (
              <span className="truncate max-w-[120px]" style={{ color: selectedColor }}>
                {selected.provider}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}