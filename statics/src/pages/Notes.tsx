import { useEffect, useState } from "react";
import { Trash2, FileText, Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { getNotes, createNote, deleteNote } from "../api";
import { Button } from "../components/ui/button";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { Markdown } from "../components/Markdown";

export default function Notes() {
  const { data: notes = [], loading, error, execute: loadNotes, setData: setNotes } = useAsync<any[]>(getNotes, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
    toast({ message: `Deleted note: ${noteToDelete.title}` });

    try {
      await deleteNote(id);
    } catch {
      toast({ message: "Failed to delete note" });
      setNotes(prev => [noteToDelete, ...(prev || [])]);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[var(--background)] transition-colors duration-300">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <FileText className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">notes</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{notes.length} files</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-[11px] font-mono focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setIsCreating(!isCreating); setExpanded(null); }}
          >
            <Plus className="w-3 h-3 mr-1" />
            {isCreating ? "close" : "new"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load notes.</span>
          <button onClick={() => loadNotes()} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreate} className="border-b border-[var(--border)] bg-[var(--background)] transition-colors">
          <div className="px-5 py-4 space-y-3 max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="note title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-[13px] font-mono border-b border-[var(--border)] pb-2 focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted-foreground)]"
            />
            <textarea
              placeholder="markdown content..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              className="w-full bg-transparent text-[13px] font-mono resize-none focus:outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>cancel</Button>
              <Button type="submit" size="sm" disabled={!newTitle.trim() || !newContent.trim()}>save</Button>
            </div>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {loading && notes.length === 0 && (
            <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!loading && filteredNotes.length === 0 && !isCreating && !error && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <FileText className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">{searchQuery ? "no notes match search" : "no notes yet"}</p>
            </div>
          )}
          {filteredNotes.map((note) => {
            const isExpanded = expanded === note.id;
            return (
              <div key={note.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : note.id)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group text-left"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="flex-1 text-[13px] truncate">{note.title}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">
                    {note.content?.length || 0} chars
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </button>
                {isExpanded && (
                  <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
                    <Markdown content={note.content || ""} className="text-[13px]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}