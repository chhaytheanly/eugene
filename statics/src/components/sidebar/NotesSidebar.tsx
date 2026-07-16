import { useState, useEffect } from "react";
import { FileText, Search, Plus, Loader2 } from "lucide-react";
import { getNotes, createNote } from "../../api";
import { cn } from "../../lib/utils";

export function NotesSidebar({ onSelectNote }: { onSelectNote?: (note: any) => void }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const temp = { id: "temp-" + Date.now(), title: newTitle, content: newContent, createdAt: new Date().toISOString() };
    setNotes(prev => [temp, ...prev]);
    setIsCreating(false);
    setNewTitle(""); setNewContent("");
    try {
      const created = await createNote({ title: temp.title, content: temp.content });
      setNotes(prev => prev.map(n => n.id === temp.id ? created : n));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Note
        </button>
      </div>

      <div className="px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="px-3 py-3 border-b border-[var(--border)] bg-[var(--muted)]">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none mb-2 font-medium"
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Content (markdown)..."
            rows={3}
            className="w-full bg-transparent text-xs text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-md font-medium">Save</button>
            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}
        {filtered.map(note => (
          <button
            key={note.id}
            onClick={() => { setSelectedId(note.id); onSelectNote?.(note); }}
            className={cn(
              "w-full text-left px-4 py-2.5 hover:bg-[var(--muted)] transition-colors",
              selectedId === note.id && "bg-[var(--muted)] border-l-2 border-[var(--accent)]"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
              <span className="text-xs text-[var(--foreground)] truncate">{note.title}</span>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 truncate pl-5">
              {note.content?.slice(0, 60)}
            </p>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FileText className="w-6 h-6 text-[var(--muted-foreground)] opacity-20 mb-3" />
            <p className="text-xs text-[var(--muted-foreground)]">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
