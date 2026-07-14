import { useEffect, useState } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { getEvents, createEvent, deleteEvent } from "../api";

export default function Calendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStart || !newEnd) return;
    try {
      await createEvent({ title: newTitle, start: newStart, end: newEnd });
      setNewTitle("");
      setNewStart("");
      setNewEnd("");
      setIsCreating(false);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Schedule and manage your events.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 p-6 border border-[var(--border)] rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 bg-[var(--muted)]">
          <div className="col-span-full md:col-span-1">
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Event Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">End Time</label>
            <input
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
            />
          </div>
          <div className="col-span-full flex justify-end gap-3 mt-2">
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
              Save Event
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2">
        {events.map((event) => (
          <div key={event.id} className="group flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5 text-[var(--foreground)]" />
              </div>
              <div>
                <h3 className="text-sm font-medium">{event.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(new Date(event.start), "MMM d, h:mm a")} - {format(new Date(event.end), "h:mm a")}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(event.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--muted)] rounded-md transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {events.length === 0 && !isCreating && (
          <div className="text-center py-12 text-sm text-[var(--muted-foreground)]">
            No upcoming events.
          </div>
        )}
      </div>
    </div>
  );
}
