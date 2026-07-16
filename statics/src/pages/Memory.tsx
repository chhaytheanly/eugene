import { useEffect, useState } from "react";
import { Trash2, BrainCircuit, Plus, Loader2, AlertCircle, Tag, Search } from "lucide-react";
import { getMemories, createMemory, deleteMemory } from "../api";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { format } from "date-fns";
import { Modal } from "../components/ui/Modal";

export default function Memory() {
  const { data: memories = [], loading, error, execute: loadMemories, setData: setMemories } = useAsync<any[]>(getMemories, []);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const toast = useToast();

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    const temp = { id: "temp-" + Date.now(), content: newContent, createdAt: new Date().toISOString() };
    setMemories(prev => [temp, ...(prev || [])]);
    setIsCreating(false); setNewContent("");
    try {
      const created = await createMemory({ content: temp.content });
      setMemories(prev => (prev || []).map(m => m.id === temp.id ? created : m));
    } catch {
      toast({ message: "Failed to store memory" });
      setMemories(prev => (prev || []).filter(m => m.id !== temp.id));
    }
  };

  const handleDelete = async (id: string) => {
    const memToDelete = memories.find(m => m.id === id);
    if (!memToDelete) return;
    setMemories(prev => (prev || []).filter(m => m.id !== id));
    toast({ message: "Memory deleted" });
    try { await deleteMemory(id); } catch {
      toast({ message: "Failed to delete memory" });
      setMemories(prev => [memToDelete, ...(prev || [])]);
    }
  };

  const filtered = memories.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      <header className="flex items-center justify-between px-6 py-3 shrink-0 glass-terminal" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-4 h-4" style={{ color: "var(--secondary)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">Memory</span>
            <span className="text-xs text-[var(--fg-muted)] ml-2">{memories.length} stored</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)]">
            <Search className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="bg-transparent text-xs text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none w-40"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors btn-terminal primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Store Memory
          </button>
        </div>
      </header>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load memories.</span>
          <button onClick={() => loadMemories()} className="ml-auto underline">Retry</button>
        </div>
      )}

      <Modal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Store Memory"
        description="What should Eugene remember?"
        footer={
          <>
            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button type="button" onClick={handleCreate} className="px-4 py-1.5 rounded text-xs font-semibold transition-all btn-terminal primary">Store Memory</button>
          </>
        }
      >
        <textarea
          autoFocus
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="What should Eugene remember?..."
          rows={4}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm resize-none text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
        />
      </Modal>

      {/* Stats bar */}
      <div className="px-6 py-2 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <div className="p-2 rounded bg-[var(--surface-elevated)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--fg-subtle)] uppercase tracking-wider">Memories</p>
            <p className="text-lg font-bold text-[var(--accent)] font-mono">{memories.length}</p>
          </div>
          <div className="p-2 rounded bg-[var(--surface-elevated)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--fg-subtle)] uppercase tracking-wider">Embeddings</p>
            <p className="text-lg font-bold text-[var(--secondary)] font-mono">{memories.length}</p>
          </div>
        </div>
      </div>

      {/* Memories list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && memories.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-muted)]" />
          </div>
        )}
        {!loading && filtered.length === 0 && !isCreating && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BrainCircuit className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--secondary)" }} />
            <p className="text-sm text-[var(--fg-muted)]">No memories stored</p>
            <p className="text-[10px] text-[var(--fg-subtle)] mt-1">Eugene learns during conversations</p>
          </div>
        )}
        <div className="space-y-2">
          {filtered.map(mem => (
            <div key={mem.id} className="rounded-lg hover:bg-[var(--surface-elevated)] transition-colors group" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-[var(--secondary)] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--fg)] leading-relaxed">{mem.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag className="w-2.5 h-2.5 text-[var(--fg-subtle)]" />
                      <span className="text-[10px] text-[var(--fg-subtle)] font-mono">
                        {format(new Date(mem.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(mem.id); }}
                    className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}