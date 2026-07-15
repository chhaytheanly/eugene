import { useEffect, useState } from "react";
import { Trash2, Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { getEvents, createEvent, deleteEvent } from "../api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try { setEvents(await getEvents()); } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStart || !newEnd) return;
    try {
      await createEvent({ title: newTitle, start: newStart, end: newEnd });
      setNewTitle(""); setNewStart(""); setNewEnd(""); setIsCreating(false);
      loadEvents();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteEvent(id); loadEvents(); } catch (err) { console.error(err); }
  };

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.end) > now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const past = events.filter((e) => new Date(e.end) <= now)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <CalendarIcon className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">calendar</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{upcoming.length} upcoming</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsCreating(!isCreating)} className="ml-auto">
          <Plus className="w-3 h-3" />
          {isCreating ? "close" : "event"}
        </Button>
      </div>

      {/* Create form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="border-b border-[var(--border)] bg-[var(--background)]">
          <div className="px-5 py-4 space-y-3 max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="event title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-[13px] font-mono border-b border-[var(--border)] pb-2 focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--muted-foreground)]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">start</label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--muted-foreground)] block mb-1">end</label>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>cancel</Button>
              <Button type="submit" size="sm" disabled={!newTitle.trim() || !newStart || !newEnd}>save</Button>
            </div>
          </div>
        </form>
      )}

      {/* Event list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {events.length === 0 && !isCreating && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <CalendarIcon className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">no events scheduled</p>
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <div className="px-5 py-2 text-[10px] text-[var(--accent)] uppercase tracking-wider bg-[var(--surface)] border-b border-[var(--border)]">
                upcoming
              </div>
              {upcoming.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group text-[13px]">
                  <div className="w-1 h-8 rounded-full bg-[var(--accent)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{event.title}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start), "MMM d, h:mm a")} – {format(new Date(event.end), "h:mm a")}
                    </span>
                  </div>
                  <Badge variant="success">active</Badge>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <div className="px-5 py-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)] border-b border-[var(--border)]">
                past ({past.length})
              </div>
              {past.map((event) => (
                <div key={event.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] opacity-50 group text-[13px]">
                  <div className="w-1 h-8 rounded-full bg-[var(--muted-foreground)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{event.title}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
