import { useState, useEffect } from "react";
import { Search, BrainCircuit, Plus, Loader2, Tag } from "lucide-react";
import { getMemories, createMemory } from "../../api";
import { format } from "date-fns";

export function MemorySidebar() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    getMemories()
      .then(setMemories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = memories.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const temp = { id: "temp-" + Date.now(), content: newContent, createdAt: new Date().toISOString() };
    setMemories(prev => [temp, ...prev]);
    setIsCreating(false); setNewContent("");
    try {
      const created = await createMemory({ content: temp.content });
      setMemories(prev => prev.map(m => m.id === temp.id ? created : m));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--muted-foreground)]">Memories</p>
            <p className="text-lg font-bold text-[var(--accent)]">{memories.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--muted-foreground)]">Embeddings</p>
            <p className="text-lg font-bold text-[var(--secondary)]">{memories.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>

      {/* New memory */}
      <div className="px-3 py-2 border-b border-[var(--border)]">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Store Memory
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-2">
            <textarea
              autoFocus
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="What should Eugene remember?..."
              rows={3}
              className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-md font-medium">Store</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}
        {filtered.map(mem => (
          <div key={mem.id} className="px-4 py-2.5 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] last:border-0">
            <div className="flex items-start gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[var(--secondary)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--foreground)] leading-relaxed line-clamp-2">{mem.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="w-2.5 h-2.5 text-[var(--muted-foreground)]" />
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {format(new Date(mem.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <BrainCircuit className="w-6 h-6 text-[var(--muted-foreground)] opacity-20 mb-3" />
            <p className="text-xs text-[var(--muted-foreground)]">No memories stored</p>
            <p className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-1">Eugene learns during conversations</p>
          </div>
        )}
      </div>
    </div>
  );
}
