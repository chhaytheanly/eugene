import { useEffect, useState } from "react";
import { Trash2, CalendarDays, Plus, Clock, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { getEvents, createEvent, deleteEvent } from "../api";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export default function CalendarPage() {
  const { data: events = [], loading, error, execute: loadEvents, setData: setEvents } = useAsync<any[]>(getEvents, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const toast = useToast();

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStart || !newEnd) return;
    const tempId = "temp-" + Date.now();
    const tempEvent = { id: tempId, title: newTitle, start: newStart, end: newEnd, createdAt: new Date().toISOString() };
    setEvents(prev => [...(prev || []), tempEvent]);
    setNewTitle(""); setNewStart(""); setNewEnd(""); setIsCreating(false);
    try {
      const created = await createEvent({ title: tempEvent.title, start: tempEvent.start, end: tempEvent.end });
      setEvents(prev => (prev || []).map(ev => ev.id === tempId ? created : ev));
    } catch {
      toast({ message: "Failed to create event" });
      setEvents(prev => (prev || []).filter(ev => ev.id !== tempId));
    }
  };

  const handleDelete = async (id: string) => {
    const eventToDelete = events.find(ev => ev.id === id);
    if (!eventToDelete) return;
    setEvents(prev => (prev || []).filter(ev => ev.id !== id));
    toast({ message: `Deleted: ${eventToDelete.title}` });
    try { await deleteEvent(id); } catch {
      toast({ message: "Failed to delete event" });
      setEvents(prev => [...(prev || []), eventToDelete]);
    }
  };

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.end) > now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const past = events.filter(e => new Date(e.end) <= now).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDayOfWeek = startOfMonth(currentMonth).getDay();
  const hasEvent = (day: Date) => events.some(e => isSameDay(new Date(e.start), day));

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 glass" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <CalendarDays className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Calendar</span>
            <span className="text-xs text-[var(--muted-foreground)] ml-2">{upcoming.length} upcoming</span>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: isCreating ? "var(--muted)" : "var(--accent)", color: isCreating ? "var(--muted-foreground)" : "var(--accent-foreground)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          {isCreating ? "Cancel" : "New Event"}
        </button>
      </div>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load events.</span>
          <button onClick={() => loadEvents()} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="shrink-0 overflow-hidden"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="px-6 py-4 space-y-3" style={{ background: "var(--surface)" }}>
              <input
                type="text"
                placeholder="Event title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-[var(--muted-foreground)] border-b pb-2"
                style={{ borderColor: "var(--border)" }}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Cancel</button>
                <button type="submit" disabled={!newTitle.trim() || !newStart || !newEnd} className="px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Save Event</button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mini calendar panel */}
        <div className="w-72 shrink-0 border-r border-[var(--border)] overflow-y-auto p-4" style={{ background: "var(--surface)" }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-1 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-1 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-[var(--muted-foreground)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {days.map(day => (
              <button
                key={day.toISOString()}
                className={cn(
                  "relative flex items-center justify-center w-8 h-8 mx-auto rounded-full text-xs transition-colors",
                  isToday(day)
                    ? "font-bold"
                    : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                )}
                style={isToday(day) ? { background: "var(--accent)", color: "var(--accent-foreground)", boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 30%, transparent)" } : {}}
              >
                {format(day, "d")}
                {hasEvent(day) && !isToday(day) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && events.length === 0 && (
            <div className="flex justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          )}
          {!loading && events.length === 0 && !isCreating && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
              <p className="text-sm text-[var(--muted-foreground)]">No events scheduled</p>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Upcoming</span>
                <div className="flex-1 h-px" style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)" }} />
              </div>
              <div className="space-y-2">
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} variant="upcoming" onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Past ({past.length})</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>
              <div className="space-y-2 opacity-50">
                {past.map(event => (
                  <EventCard key={event.id} event={event} variant="past" onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, variant, onDelete }: { event: any; variant: "upcoming" | "past"; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3 group hover-elevate transition-all"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: variant === "upcoming" ? "var(--accent)" : "var(--muted-foreground)", boxShadow: variant === "upcoming" ? "0 0 8px color-mix(in srgb, var(--accent) 30%, transparent)" : "none" }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--foreground)] truncate block">{event.title}</span>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-[var(--muted-foreground)]" />
          <span className="text-[10px] text-[var(--muted-foreground)]">
            {format(new Date(event.start), "MMM d, h:mm a")} – {format(new Date(event.end), "h:mm a")}
          </span>
        </div>
      </div>
      {variant === "upcoming" && (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}>
          upcoming
        </span>
      )}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onDelete(event.id)}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
