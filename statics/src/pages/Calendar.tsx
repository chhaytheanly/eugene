import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../api";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { cn } from "../lib/utils";
import { Modal } from "../components/ui/Modal";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { data: events = [], error, execute: loadEvents, setData: setEvents } = useAsync<any[]>(getEvents, []);
  const toast = useToast();

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();

  const dayEvents = (day: Date) => events.filter(e => isSameDay(new Date(e.start), day));

  const eventsForSelectedDay = selectedDay ? dayEvents(selectedDay) : [];

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDate) return;
    const start = new Date(newDate).toISOString();
    const end = new Date(new Date(newDate).getTime() + 3600000).toISOString();
    const temp = { id: "temp-" + Date.now(), title: newTitle, start, end };
    setEvents(prev => [...(prev || []), temp]);
    setIsCreating(false); setNewTitle(""); setNewDate("");
    try {
      const created = await createEvent({ title: newTitle, start, end });
      setEvents(prev => (prev || []).map(ev => ev.id === temp.id ? created : ev));
    } catch {
      toast({ message: "Failed to create event" });
      setEvents(prev => (prev || []).filter(ev => ev.id !== temp.id));
    }
  };

  const handleDelete = async (id: string) => {
    const eventToDelete = events.find(ev => ev.id === id);
    if (!eventToDelete) return;
    setEvents(prev => (prev || []).filter(ev => ev.id !== id));
    toast({ message: `Deleted: ${eventToDelete.title}` });
    try { await deleteEvent(id); } catch {
      toast({ message: "Failed to delete event" });
      setEvents(prev => [eventToDelete, ...(prev || [])]);
    }
  };

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");

  const startEditEvent = (event: any) => {
    setEditingEventId(event.id);
    setEditTitle(event.title);
    setEditDate(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
  };

  const cancelEditEvent = () => { setEditingEventId(null); setEditTitle(""); setEditDate(""); };

  const saveEditEvent = async (id: string) => {
    if (!editTitle.trim() || !editDate) return;
    const start = new Date(editDate).toISOString();
    const end = new Date(new Date(editDate).getTime() + 3600000).toISOString();
    const original = events.find(ev => ev.id === id);
    setEvents(prev => (prev || []).map(ev => ev.id === id ? { ...ev, title: editTitle, start, end } : ev));
    setEditingEventId(null);
    try {
      await updateEvent(id, { title: editTitle, start, end });
    } catch {
      toast({ message: "Failed to update event" });
      if (original) setEvents(prev => (prev || []).map(ev => ev.id === id ? original : ev));
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 glass-terminal" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">Calendar</span>
            <span className="text-xs text-[var(--fg-muted)] ml-2">{events.length} events</span>
          </div>
        </div>
        <button
          onClick={() => { setNewTitle(""); setNewDate(""); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors btn-terminal primary"
        >
          <Plus className="w-3.5 h-3.5" />
          New Event
        </button>
      </header>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load events.</span>
          <button onClick={() => loadEvents()} className="ml-auto underline">Retry</button>
        </div>
      )}

      <Modal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="New Event"
        description="Schedule a new calendar event."
        footer={
          <>
            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button type="button" onClick={handleCreate} className="px-4 py-1.5 rounded text-xs font-semibold transition-all btn-terminal primary">Add Event</button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Event title..."
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="datetime-local"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </Modal>

      <div className="flex-1 flex overflow-hidden">
        {/* Calendar pane */}
        <aside className="w-80 shrink-0 border-r border-[var(--border)] flex flex-col" style={{ background: "var(--sidebar-bg)" }}>
          {/* Month header */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1 rounded hover:bg-[var(--surface-elevated)] text-[var(--fg-muted)] transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1 rounded hover:bg-[var(--surface-elevated)] text-[var(--fg-muted)] transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 px-4 py-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-[var(--fg-subtle)] py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-4 flex-1 overflow-y-auto">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 mx-auto rounded-full text-[11px] transition-colors font-mono",
                  isToday(day)
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-bold"
                    : "text-[var(--fg)] hover:bg-[var(--surface-elevated)]"
                )}
              >
                {format(day, "d")}
                {dayEvents(day).length > 0 && !isToday(day) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                )}
                {selectedDay && isSameDay(day, selectedDay) && !isToday(day) && (
                  <span className="absolute inset-0 rounded-full border-2 border-[var(--accent)]" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Events pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">
                {selectedDay ? format(selectedDay, "EEEE, MMMM d, yyyy") : "Select a day"}
              </span>
              {selectedDay && dayEvents(selectedDay).length > 0 && (
                <span className="text-[10px] text-[var(--fg-muted)] font-mono">{dayEvents(selectedDay).length} event(s)</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {selectedDay ? (
              eventsForSelectedDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <CalendarIcon className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
                  <p className="text-sm text-[var(--fg-muted)]">No events on this day</p>
                  <button
                    onClick={() => { setIsCreating(true); setNewDate(format(selectedDay, "yyyy-MM-dd'T'HH:mm")); }}
                    className="mt-4 px-3 py-1.5 rounded text-xs font-medium btn-terminal primary"
                  >
                    Add Event
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventsForSelectedDay.map(event => (
                    <div key={event.id} className="group flex items-start gap-3 px-3 py-2 rounded transition-colors" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                      <div className="w-1 h-full min-h-[20px] rounded-full bg-[var(--accent)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--fg)] truncate">{event.title}</p>
                        <p className="text-[10px] text-[var(--fg-muted)] font-mono">
                          {format(new Date(event.start), "h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditEvent(event)}
                          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors"
                          title="Edit"
                          aria-label="Edit event"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors"
                          title="Delete"
                          aria-label="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CalendarIcon className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
                <p className="text-sm text-[var(--fg-muted)]">Select a day to view events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal - moved outside the map */}
      <Modal
        open={editingEventId !== null}
        onClose={cancelEditEvent}
        title="Edit Event"
        description="Update this calendar event."
        footer={
          <>
            <button type="button" onClick={cancelEditEvent} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button type="button" onClick={() => editingEventId && saveEditEvent(editingEventId)} className="px-4 py-1.5 rounded text-xs font-semibold transition-all btn-terminal primary">Save</button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          />
          <input
            type="datetime-local"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </Modal>
    </div>
  );
}