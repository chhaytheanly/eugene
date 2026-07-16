import { useEffect, useState } from "react";
import { Trash2, BrainCircuit, Plus, Loader2, AlertCircle, Search, Tag, Database } from "lucide-react";
import { getMemories, createMemory, deleteMemory } from "../api";
import { format } from "date-fns";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function Memory() {
  const { data: memories = [], loading, error, execute: loadMemories, setData: setMemories } = useAsync<any[]>(getMemories, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const tempId = "temp-" + Date.now();
    const tempMem = { id: tempId, content: newContent, createdAt: new Date().toISOString() };
    setMemories(prev => [tempMem, ...(prev || [])]);
    setNewContent(""); setIsCreating(false);
    try {
      const created = await createMemory({ content: tempMem.content });
      setMemories(prev => (prev || []).map(m => m.id === tempId ? created : m));
    } catch {
      toast({ message: "Failed to store memory" });
      setMemories(prev => (prev || []).filter(m => m.id !== tempId));
    }
  };

  const handleDelete = async (id: string) => {
    const memToDelete = memories.find(m => m.id === id);
    if (!memToDelete) return;
    setMemories(prev => (prev || []).filter(m => m.id !== id));
    toast({ message: "Memory deleted" });
    try { await deleteMemory(id); } catch {
      toast({ message: "Failed to delete memory" });
      setMemories(prev => [...(prev || []), memToDelete].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  const filtered = memories.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 glass" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Memory</span>
            <span className="text-xs text-[var(--muted-foreground)] ml-2">{memories.length} records</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="bg-transparent text-xs focus:outline-none placeholder:text-[var(--muted-foreground)] w-32"
            />
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: isCreating ? "var(--muted)" : "var(--accent)", color: isCreating ? "var(--muted-foreground)" : "var(--accent-foreground)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? "Cancel" : "Store"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load memories.</span>
          <button onClick={() => loadMemories()} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Stats row */}
      <div className="px-6 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)" }}>
          <BrainCircuit className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          <span className="text-xs text-[var(--accent)] font-medium">{memories.length} Memories</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(179,136,255,0.06)", border: "1px solid rgba(179,136,255,0.15)" }}>
          <Tag className="w-3.5 h-3.5" style={{ color: "var(--secondary)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--secondary)" }}>{memories.length} Embeddings</span>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="shrink-0 overflow-hidden"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="px-6 py-4 flex items-start gap-3" style={{ background: "var(--surface)" }}>
              <BrainCircuit className="w-4 h-4 mt-2 shrink-0" style={{ color: "var(--secondary)" }} />
              <textarea
                placeholder="What should Eugene remember?..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={2}
                className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-[var(--muted-foreground)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold shrink-0 mt-0.5 disabled:opacity-40 transition-all"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                Store
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Memory cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && memories.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}
        {!loading && memories.length === 0 && !error && !isCreating && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BrainCircuit className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--secondary)" }} />
            <p className="text-sm text-[var(--muted-foreground)]">No memories stored</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 opacity-60">Eugene learns facts during conversation</p>
          </div>
        )}
        <div className="space-y-2">
          {filtered.map(mem => (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-xl px-4 py-3 group hover-elevate transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(179,136,255,0.12)", border: "1px solid rgba(179,136,255,0.2)" }}>
                <BrainCircuit className="w-3.5 h-3.5" style={{ color: "var(--secondary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{mem.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Tag className="w-3 h-3 text-[var(--muted-foreground)]" />
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    Stored {format(new Date(mem.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(mem.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 transition-all mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
