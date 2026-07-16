import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, AlertCircle, Calendar, Clock, AlignLeft, Edit2, X, Check, CheckSquare2 } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { cn } from "../lib/utils";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

const priorityLabel = ["Low", "Med", "High"] as const;
const priorityColors = ["text-[var(--muted-foreground)]", "text-yellow-400", "text-red-400"];
const priorityBg = ["", "bg-yellow-400/10 border-yellow-400/30", "bg-red-400/10 border-red-400/30"];

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast({ message: "Failed to create task", action: { label: "Retry", onClick: () => handleAdd(e) } });
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
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 glass" style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}>
        <div className="flex items-center gap-3">
          <CheckSquare2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Tasks</span>
            <span className="text-xs text-[var(--muted-foreground)] ml-2">{activeTasks.length} pending</span>
          </div>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{progress}%</span>
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-2 flex items-center gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load tasks.</span>
          <button onClick={() => loadTasks()} className="ml-auto underline">Retry</button>
        </div>
      )}

      {/* Add task form */}
      <div className="px-6 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <Plus className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={cn("p-1.5 rounded-lg transition-colors text-xs", showDetails ? "text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
              title="Details"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              Add
            </button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2 pl-7">
                  <textarea
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full text-xs focus:outline-none resize-none placeholder:text-[var(--muted-foreground)] rounded-lg px-3 py-2"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    rows={2}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <Clock className="w-3.5 h-3.5" />
                      <input
                        type="datetime-local"
                        value={newTaskDue}
                        onChange={e => setNewTaskDue(e.target.value)}
                        className="bg-transparent focus:outline-none text-[var(--foreground)] text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] ml-auto">
                      <span>Priority:</span>
                      <select
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(Number(e.target.value))}
                        className="text-xs rounded-lg px-2 py-1 focus:outline-none"
                        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      >
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {loading && tasks.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}
        {!loading && tasks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckSquare2 className="w-10 h-10 mb-4 opacity-10" style={{ color: "var(--accent)" }} />
            <p className="text-sm text-[var(--muted-foreground)]">All caught up. No tasks.</p>
          </div>
        )}

        <div className="px-6 py-3 space-y-1.5">
          {activeTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={startEditing} editingId={editingId} editForm={editForm} setEditForm={setEditForm} saveEdit={saveEdit} cancelEdit={() => setEditingId(null)} />
          ))}
        </div>

        {doneTasks.length > 0 && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Completed ({doneTasks.length})
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            <div className="space-y-1.5 opacity-50">
              {doneTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={startEditing} editingId={editingId} editForm={editForm} setEditForm={setEditForm} saveEdit={saveEdit} cancelEdit={() => setEditingId(null)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit, editingId, editForm, setEditForm, saveEdit, cancelEdit }: any) {
  const [hovered, setHovered] = useState(false);
  const isEditing = editingId === task.id;

  if (isEditing) {
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--accent)", boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent)" }}>
        <input
          type="text"
          value={editForm.title}
          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full bg-transparent text-sm font-medium focus:outline-none"
        />
        <textarea
          value={editForm.description}
          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
          placeholder="Description"
          className="w-full text-xs resize-none focus:outline-none placeholder:text-[var(--muted-foreground)] rounded-lg px-3 py-2"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="datetime-local"
              value={editForm.dueDate}
              onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
              className="bg-transparent text-xs focus:outline-none text-[var(--foreground)]"
            />
            <select
              value={editForm.priority}
              onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
              className="text-xs rounded-lg px-2 py-1 focus:outline-none"
              style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <option value={0}>Low</option>
              <option value={1}>Medium</option>
              <option value={2}>High</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cancelEdit} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              <X className="w-4 h-4" />
            </button>
            <button onClick={saveEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: "rgb(74,222,128)" }}>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 group transition-all hover-elevate"
      style={{
        background: hovered ? "var(--surface)" : "var(--background)",
        border: `1px solid ${hovered ? "var(--border)" : "transparent"}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onToggle(task.id, task.completed)}
        className="w-5 h-5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-all"
        style={{
          background: task.completed ? "var(--accent)" : "transparent",
          borderColor: task.completed ? "var(--accent)" : "var(--border)",
          boxShadow: task.completed ? "0 0 8px color-mix(in srgb, var(--accent) 30%, transparent)" : "none",
        }}
      >
        {task.completed && <Check className="w-3 h-3" style={{ color: "var(--accent-foreground)" }} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", task.completed && "line-through text-[var(--muted-foreground)]")}>
            {task.title}
          </span>
          {task.priority > 0 && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", priorityColors[task.priority], priorityBg[task.priority])}>
              {priorityLabel[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
              isOverdue(task.dueDate) && !task.completed
                ? "bg-red-400/10 border-red-400/30 text-red-400"
                : "border-[var(--border)] text-[var(--muted-foreground)]"
            )}>
              <Calendar className="w-2.5 h-2.5" />
              {formatDisplayDate(task.dueDate)}
            </span>
          )}
        </div>
        {task.description && (
          <p className={cn("mt-1 text-xs leading-relaxed whitespace-pre-wrap", task.completed ? "text-[var(--muted-foreground)] opacity-50 line-through" : "text-[var(--muted-foreground)]")}>
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
            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors" title="Edit">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
