import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Search, Cpu } from "lucide-react";
import { getModels, type ModelInfo } from "../api";
import { cn } from "../lib/utils";

const STORAGE_KEY = "eugene:selectedModel";

type Selected = { id: string; provider: string; name: string };

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

  const providerLabel: Record<string, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    opencode: "OpenCode Zen",
    gemini: "Gemini",
  };

  if (models.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full text-[10px] px-2 py-1 rounded-sm border border-[var(--border)] bg-[var(--muted)] hover:bg-[var(--muted)]/70 transition-colors"
      >
        <Cpu className="w-3 h-3 shrink-0 text-[var(--accent)]" />
        <span className="truncate text-[10px]">{selected?.name ?? "default model"}</span>
        <ChevronDown className="w-3 h-3 ml-auto shrink-0 text-[var(--muted-foreground)]" />
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-64 max-h-72 overflow-y-auto border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 rounded-sm">
          <div className="p-1.5 sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[var(--background)]">
              <Search className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search models..."
                className="w-full bg-transparent text-[11px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center text-[10px] text-[var(--muted-foreground)]">
              no models match "{query}"
            </div>
          )}
          {Object.entries(grouped).map(([provider, list]) => (
            <div key={provider}>
              <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                {providerLabel[provider] ?? provider}
              </div>
              {list.map((m) => {
                const active = selected?.id === m.id && selected?.provider === m.provider;
                return (
                  <button
                    key={`${m.provider}:${m.id}`}
                    type="button"
                    onClick={() => choose(m)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-[var(--muted)] transition-colors",
                      active && "bg-[var(--accent)]/5"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] truncate">{m.name}</span>
                      <span className="text-[9px] text-[var(--muted-foreground)] truncate">{m.id}</span>
                    </div>
                    {active && <Check className="w-3 h-3 shrink-0 text-[var(--accent)]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
