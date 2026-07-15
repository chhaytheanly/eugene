import { useEffect, useState } from "react";
import { Trash2, BrainCircuit, Database, Plus, Loader2, AlertCircle } from "lucide-react";
import { getMemories, createMemory, deleteMemory } from "../api";
import { format } from "date-fns";
import { Button } from "../components/ui/button";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";

export default function Memory() {
  const { data: memories = [], loading, error, execute: loadMemories, setData: setMemories } = useAsync<any[]>(getMemories, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
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

    try {
      await deleteMemory(id);
    } catch {
      toast({ message: "Failed to delete memory" });
      setMemories(prev => [...(prev || []), memToDelete].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] transition-colors duration-300">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <Database className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">memory</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{memories.length} records</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)} className="ml-auto">
          <Plus className="w-3 h-3 mr-1" />
          {isCreating ? "close" : "new"}
        </Button>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load memories.</span>
          <button onClick={() => loadMemories()} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreate} className="border-b border-[var(--border)] bg-[var(--background)] transition-colors">
          <div className="px-5 py-4 space-y-3 max-w-4xl mx-auto flex items-start gap-3">
            <textarea
              placeholder="What should eugene remember?..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              className="flex-1 bg-transparent text-[13px] font-mono resize-none focus:outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <Button type="submit" size="sm" disabled={!newContent.trim()}>save</Button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {loading && memories.length === 0 && (
            <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!loading && memories.length === 0 && !error && !isCreating && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <Database className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">no memories stored yet</p>
              <p className="text-[10px] mt-1 opacity-60">eugene learns facts during conversation</p>
            </div>
          )}
          {memories.map((mem) => (
            <div key={mem.id} className="flex items-start gap-3 px-5 py-3 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group text-[13px]">
              <BrainCircuit className="w-4 h-4 mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
              <div className="flex-1 min-w-0">
                <p className="leading-relaxed whitespace-pre-wrap">{mem.content}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  stored {format(new Date(mem.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(mem.id)}
                className="opacity-0 group-hover:opacity-100 mt-0.5 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}