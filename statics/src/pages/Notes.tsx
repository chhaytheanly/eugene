import { useEffect, useState } from "react";
import { Trash2, FileText, Plus, Search, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { getNotes, createNote, deleteNote } from "../api";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { Markdown } from "../components/Markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { Modal } from "../components/ui/Modal";

export default function Notes() {
  const { data: notes = [], loading, error, execute: loadNotes, setData: setNotes } = useAsync<any[]>(getNotes, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const tempId = "temp-" + Date.now();
    const tempNote = { id: tempId, title: newTitle, content: newContent, createdAt: new Date().toISOString() };
    setNotes(prev => [tempNote, ...(prev || [])]);
    setNewTitle(""); setNewContent(""); setIsCreating(false);
    try {
      const created = await createNote({ title: tempNote.title, content: tempNote.content });
      setNotes(prev => (prev || []).map(n => n.id === tempId ? created : n));
    } catch {
      toast({ message: "Failed to save note" });
      setNotes(prev => (prev || []).filter(n => n.id !== tempId));
    }
  };

  const handleDelete = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;
    setNotes(prev => (prev || []).filter(n => n.id !== id));
    toast({ message: `Deleted: ${noteToDelete.title}` });
    try { await deleteNote(id); } catch {
      toast({ message: "Failed to delete note" });
      setNotes(prev => [noteToDelete, ...(prev || [])]);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 glass-terminal" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">Notes</span>
            <span className="text-xs text-[var(--fg-muted)] ml-2">{notes.length} files</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            onClick={() => { setIsCreating(true); setExpanded(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors btn-terminal primary"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </button>
        </div>
      </header>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load notes.</span>
          <button onClick={() => loadNotes()} className="ml-auto underline">Retry</button>
        </div>
      )}

      <Modal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="New Note"
        description="Create a markdown note."
        footer={
          <>
            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button
              type="button"
              disabled={!newTitle.trim() || !newContent.trim()}
              onClick={handleCreate}
              className="px-4 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-40 btn-terminal primary"
            >Save Note</button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Note title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm font-medium text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
            autoFocus
          />
          <textarea
            placeholder="Markdown content..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={6}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm resize-none text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>
      </Modal>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && notes.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-muted)]" />
          </div>
        )}
        {!loading && filteredNotes.length === 0 && !isCreating && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
            <p className="text-sm text-[var(--fg-muted)]">{searchQuery ? "No notes match your search" : "No notes yet"}</p>
          </div>
        )}
        <div className="space-y-2">
          {filteredNotes.map(note => {
            const isExpanded = expanded === note.id;
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl overflow-hidden hover-elevate"
                style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : note.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-elevated)] transition-colors group"
                >
                  <FileText className="w-4 h-4 shrink-0 text-[var(--fg-muted)]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--fg)] truncate block">{note.title}</span>
                    <span className="text-[10px] text-[var(--fg-muted)]">{note.content?.length || 0} chars</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                    className={cn("p-1.5 rounded text-[var(--fg-muted)] hover:text-red-400 transition-all", isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <Markdown content={note.content || ""} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}