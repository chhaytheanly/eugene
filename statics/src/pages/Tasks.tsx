import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, AlertCircle, Calendar, Clock, Edit2, Check, CheckSquare2 } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { cn } from "../lib/utils";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "../components/ui/Modal";

const priorityLabel = ["Low", "Med", "High"] as const;
const priorityColors = ["text-[var(--fg-muted)]", "text-[var(--warning)]", "text-[var(--danger)]"];
const priorityBorders = ["border-[var(--border)]", "border-[color-mix(in_srgb,var(--warning)_30%,transparent)]", "border-[color-mix(in_srgb,var(--danger)_30%,transparent)]"];
const priorityBgs = ["", "bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]", "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"];

const formatForInput = (isoString?: string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDate = (isoString: string) => {
  const d = new Date(isoString);
  const isToday = new Date().toDateString() === d.toDateString();
  return isToday
    ? `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const isOverdue = (isoString?: string | null) => {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
};

export default function Tasks() {
  const { data: tasks = [], loading, error, execute: loadTasks, setData: setTasks } = useAsync<any[]>(getTasks, []);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(0);
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const toast = useToast();

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleAdd = async () => {
    if (!newTaskTitle.trim()) return;
    const tempId = "temp-" + Date.now();
    const payload = {
      title: newTaskTitle,
      priority: newTaskPriority,
      description: newTaskDesc.trim() || undefined,
      dueDate: newTaskDue ? new Date(newTaskDue).toISOString() : undefined,
    };
    const tempTask = { id: tempId, ...payload, completed: false, createdAt: new Date().toISOString() };
    setTasks(prev => [...(prev || []), tempTask]);
    setNewTaskTitle(""); setNewTaskPriority(0); setNewTaskDue(""); setNewTaskDesc(""); setShowDetails(false);
    try {
      const created = await createTask(payload);
      setTasks(prev => (prev || []).map(t => t.id === tempId ? created : t));
    } catch {
      toast({ message: "Failed to create task", action: { label: "Retry", onClick: () => handleAdd() } });
      setTasks(prev => (prev || []).filter(t => t.id !== tempId));
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setTasks(prev => (prev || []).map(t => t.id === id ? { ...t, completed: !completed } : t));
    try { await updateTask(id, { completed: !completed }); } catch {
      toast({ message: "Failed to update task" });
      setTasks(prev => (prev || []).map(t => t.id === id ? { ...t, completed } : t));
    }
  };

  const handleDelete = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    setTasks(prev => (prev || []).filter(t => t.id !== id));
    toast({
      message: `Deleted: ${taskToDelete.title.substring(0, 30)}`,
      action: {
        label: "Undo",
        onClick: async () => {
          setTasks(prev => [...(prev || []), taskToDelete]);
          await createTask({ title: taskToDelete.title, priority: taskToDelete.priority, description: taskToDelete.description, dueDate: taskToDelete.dueDate });
          loadTasks();
        }
      }
    });
    try { await deleteTask(id); } catch {
      toast({ message: "Failed to delete task" });
      setTasks(prev => [...(prev || []), taskToDelete]);
    }
  };

  const startEditing = (task: any) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, priority: task.priority, description: task.description || "", dueDate: formatForInput(task.dueDate) });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload = {
      title: editForm.title,
      priority: editForm.priority,
      description: editForm.description.trim() || null,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
    };
    setTasks(prev => (prev || []).map(t => t.id === editingId ? { ...t, ...payload } : t));
    setEditingId(null);
    try { await updateTask(editingId, payload); } catch {
      toast({ message: "Failed to update task" });
      loadTasks();
    }
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full" style={{ background: "transparent" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0 glass-terminal" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <CheckSquare2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--fg)]">Tasks</span>
            <span className="text-xs text-[var(--fg-muted)] ml-2">{activeTasks.length} pending</span>
          </div>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-[var(--fg-muted)]">{progress}%</span>
          </div>
        )}
      </header>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load tasks.</span>
          <button onClick={() => loadTasks()} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Add task button */}
      <div className="px-6 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button
          onClick={() => {
            setNewTaskTitle(""); setNewTaskPriority(0); setNewTaskDue(""); setNewTaskDesc("");
            setShowDetails(true);
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors border border-dashed border-[var(--border)]"
        >
          <Plus className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
          What needs to be done?
        </button>
      </div>

      <Modal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="New Task"
        description="Add something to your list."
        footer={
          <>
            <button type="button" onClick={() => setShowDetails(false)} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button type="button" disabled={!newTaskTitle.trim()} onClick={handleAdd} className="px-4 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-40 btn-terminal primary">Add Task</button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={newTaskDesc}
            onChange={e => setNewTaskDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full text-xs focus:outline-none resize-none placeholder:text-[var(--fg-muted)] rounded px-3 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)]"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <input
                type="datetime-local"
                value={newTaskDue}
                onChange={e => setNewTaskDue(e.target.value)}
                className="bg-transparent focus:outline-none text-[var(--fg)] text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] ml-auto">
              <span>Priority:</span>
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(Number(e.target.value))}
                className="text-xs rounded px-2 py-1 focus:outline-none bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)]"
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {loading && tasks.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--fg-muted)]" />
          </div>
        )}
        {!loading && tasks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare2 className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
            <p className="text-sm text-[var(--fg-muted)]">All caught up. No tasks.</p>
          </div>
        )}

        <div className="px-6 py-3 space-y-1.5">
          {activeTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={startEditing} />
          ))}
        </div>

        {doneTasks.length > 0 && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Completed ({doneTasks.length})
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <div className="space-y-1.5 opacity-50">
              {doneTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={startEditing} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title="Edit Task"
        description="Update this task."
        footer={
          <>
            <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors btn-terminal outline">Cancel</button>
            <button type="button" onClick={saveEdit} className="px-4 py-1.5 rounded text-xs font-semibold transition-all btn-terminal primary">Save</button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            type="text"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-2 text-sm font-medium text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Description"
            className="w-full text-xs resize-none focus:outline-none placeholder:text-[var(--fg-muted)] rounded px-3 py-2 bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)]"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <input
                type="datetime-local"
                value={editForm.dueDate}
                onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="bg-transparent focus:outline-none text-[var(--fg)] text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] ml-auto">
              <span>Priority:</span>
              <select
                value={editForm.priority}
                onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                className="text-xs rounded px-2 py-1 focus:outline-none bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)]"
              >
                <option value={0}>Low</option>
                <option value={1}>Medium</option>
                <option value={2}>High</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 group transition-all hover:bg-[var(--surface)] hover-elevate"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className="w-5 h-5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-all"
        style={{
          background: task.completed ? "var(--accent)" : "transparent",
          borderColor: task.completed ? "var(--accent)" : "var(--border)",
          boxShadow: task.completed ? "0 0 8px var(--accent-dim)" : "none",
        }}
      >
        {task.completed && <Check className="w-3 h-3" style={{ color: "var(--accent-foreground)" }} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", task.completed && "line-through text-[var(--fg-muted)]")}>
            {task.title}
          </span>
          {task.priority > 0 && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", priorityColors[task.priority], priorityBorders[task.priority], priorityBgs[task.priority])}>
              {priorityLabel[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
              isOverdue(task.dueDate) && !task.completed
                ? "bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] border-[color-mix(in_srgb,var(--danger)_30%,transparent)] text-[var(--danger)]"
                : "border-[var(--border)] text-[var(--fg-muted)]"
            )}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDisplayDate(task.dueDate)}
            </span>
          )}
        </div>
        {task.description && (
          <p className={cn("mt-1 text-xs leading-relaxed whitespace-pre-wrap", task.completed ? "text-[var(--fg-muted)] opacity-50 line-through" : "text-[var(--fg-muted)]")}>
            {task.description}
          </p>
        )}
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 shrink-0"
          >
            <button onClick={() => onEdit(task)} className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-elevated)] transition-colors" title="Edit">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}