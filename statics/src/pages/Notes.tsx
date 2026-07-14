import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getNotes, createNote, deleteNote } from "../api";

export default function Notes() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await createNote({ title: newTitle, content: newContent });
      setNewTitle("");
      setNewContent("");
      setIsCreating(false);
      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      loadNotes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Capture ideas, summaries, and long-form documents.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 p-6 bg-[var(--muted)] border border-[var(--border)] rounded-lg">
          <input
            type="text"
            placeholder="Note Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-transparent text-lg font-medium border-b border-[var(--border)] pb-2 mb-4 focus:outline-none focus:border-[var(--foreground)] transition-colors"
          />
          <textarea
            placeholder="Write your note in markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={5}
            className="w-full bg-transparent text-sm resize-none focus:outline-none"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-[var(--background)] rounded-md transition-colors border border-transparent hover:border-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="group relative p-6 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors bg-[var(--background)] flex flex-col h-64">
              <h3 className="font-semibold mb-2 pr-6 truncate">{note.title}</h3>
              <div className="flex-1 overflow-hidden text-sm text-[var(--muted-foreground)] prose prose-sm dark:prose-invert">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--muted)] rounded-md transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {notes.length === 0 && !isCreating && (
          <div className="text-center py-12 text-sm text-[var(--muted-foreground)]">
            No notes found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
