import { useEffect, useState } from "react";
import { Trash2, FileText, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getNotes, createNote, deleteNote } from "../api";
import { Button } from "../components/ui/button";

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try { setNotes(await getNotes()); } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await createNote({ title: newTitle, content: newContent });
      setNewTitle(""); setNewContent(""); setIsCreating(false);
      loadNotes();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteNote(id); loadNotes(); } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <FileText className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">notes</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{notes.length} files</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setIsCreating(!isCreating); setExpanded(null); }}
          className="ml-auto"
        >
          <Plus className="w-3 h-3" />
          {isCreating ? "close" : "new"}
        </Button>
      </div>

      {/* Create form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="border-b border-[var(--border)] bg-[var(--background)]">
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

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {notes.length === 0 && !isCreating && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <FileText className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">no notes yet</p>
            </div>
          )}
          {notes.map((note) => {
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
                    {note.content?.length} chars
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
                    <div
                      className="prose prose-sm max-w-none prose-invert text-[13px]"
                      style={{
                        "--tw-prose-body": "var(--foreground)",
                        "--tw-prose-headings": "var(--foreground)",
                        "--tw-prose-bold": "var(--foreground)",
                        "--tw-prose-code": "var(--accent)",
                        "--tw-prose-pre-bg": "var(--background)",
                        "--tw-prose-pre-code": "var(--foreground)",
                      } as React.CSSProperties}
                    >
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
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
