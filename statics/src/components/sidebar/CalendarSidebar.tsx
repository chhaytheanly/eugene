import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { getEvents, createEvent } from "../../api";
import { cn } from "../../lib/utils";

export function CalendarSidebar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    getEvents().then(setEvents).catch(() => {});
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();

  const upcoming = events
    .filter(e => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  const hasEvent = (day: Date) => events.some(e => isSameDay(new Date(e.start), day));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const start = new Date(newDate).toISOString();
    const end = new Date(new Date(newDate).getTime() + 3600000).toISOString();
    const temp = { id: "temp-" + Date.now(), title: newTitle, start, end };
    setEvents(prev => [...prev, temp]);
    setIsCreating(false); setNewTitle(""); setNewDate("");
    try {
      const created = await createEvent({ title: newTitle, start, end });
      setEvents(prev => prev.map(ev => ev.id === temp.id ? created : ev));
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      {/* Calendar header */}
      <div className="px-4 pt-4 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--foreground)]">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
              className="p-1 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
              className="p-1 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} className="text-center text-[9px] font-semibold text-[var(--muted-foreground)] py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => (
            <button
              key={day.toISOString()}
              className={cn(
                "relative flex items-center justify-center w-7 h-7 mx-auto rounded-full text-[11px] transition-colors",
                isToday(day)
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-bold"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              {format(day, "d")}
              {hasEvent(day) && !isToday(day) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* New event */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Event
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <input
              type="datetime-local"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs rounded-md font-medium">Add</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Upcoming */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Upcoming</span>
        </div>
        {upcoming.length === 0 && (
          <p className="px-4 py-2 text-xs text-[var(--muted-foreground)]">No upcoming events</p>
        )}
        {upcoming.map(event => (
          <div key={event.id} className="px-4 py-2 hover:bg-[var(--muted)] transition-colors">
            <div className="flex items-start gap-2">
              <div className="w-1 h-full min-h-[20px] rounded-full bg-[var(--accent)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--foreground)] truncate">{event.title}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {format(new Date(event.start), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
