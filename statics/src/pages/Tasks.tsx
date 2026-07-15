import { useEffect, useState } from "react";
import { Trash2, ListTodo, Plus, Loader2, AlertCircle, Calendar, Clock, AlignLeft, Edit2, X, Check } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";

const priorityLabel = ["low", "med", "high"] as const;
const priorityVariant = ["default", "warning", "destructive"] as const;

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
    ? `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    const tempTask = { 
      id: tempId, 
      ...payload, 
      completed: false, 
      createdAt: new Date().toISOString() 
    };

    setTasks(prev => [...(prev || []), tempTask]);
    setNewTaskTitle("");
    setNewTaskPriority(0);
    setNewTaskDue("");
    setNewTaskDesc("");
    setShowDetails(false);

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
    try { 
      await updateTask(id, { completed: !completed }); 
    } catch { 
      toast({ message: "Failed to update task" });
      setTasks(prev => (prev || []).map(t => t.id === id ? { ...t, completed } : t));
    }
  };

  const handleDelete = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;
    
    setTasks(prev => (prev || []).filter(t => t.id !== id));
    
    toast({
      message: `Deleted: ${taskToDelete.title.substring(0, 20)}...`,
      action: {
        label: "Undo",
        onClick: async () => {
          setTasks(prev => [...(prev || []), taskToDelete]);
          await createTask({ 
            title: taskToDelete.title, 
            priority: taskToDelete.priority, 
            description: taskToDelete.description,
            dueDate: taskToDelete.dueDate
          });
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
    setEditForm({
      title: task.title,
      priority: task.priority,
      description: task.description || "",
      dueDate: formatForInput(task.dueDate),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const task = tasks.find(t => t.id === editingId);
    if (!task) return;

    const payload = {
      title: editForm.title,
      priority: editForm.priority,
      description: editForm.description.trim() || null, // null removes it
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
    };

    setTasks(prev => (prev || []).map(t => t.id === editingId ? { ...t, ...payload, dueDate: payload.dueDate || undefined, description: payload.description || undefined } : t));
    setEditingId(null);

    try {
      await updateTask(editingId, payload);
    } catch {
      toast({ message: "Failed to update task" });
      loadTasks(); // refresh to revert
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex flex-col h-full bg-transparent transition-colors duration-300 relative z-10">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md shrink-0 flex items-center gap-3 shadow-sm">
        <ListTodo className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">tasks</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2 bg-[var(--muted)] px-1.5 py-0.5 rounded">
            {activeTasks.length} pending
          </span>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Failed to load tasks.</span>
          <button onClick={() => loadTasks()} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm transition-colors duration-300">
        <form onSubmit={handleAdd} className="max-w-4xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-3 w-full">
            <Plus className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={cn("p-1.5 rounded-md border text-xs transition-colors focus:outline-none", showDetails ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]" : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}
              title="Toggle details"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
              Add Task
            </Button>
          </div>

          {showDetails && (
            <div className="ml-7 flex flex-col gap-2 p-3 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-sm">
              <textarea
                value={newTaskDesc}
                onChange={e => setNewTaskDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-transparent text-[12px] focus:outline-none resize-none placeholder:text-[var(--muted-foreground)]"
                rows={2}
              />
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                  <Clock className="w-3.5 h-3.5" />
                  <input 
                    type="datetime-local" 
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="bg-transparent focus:outline-none text-[var(--foreground)] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[var(--icon-invert,0)]"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] ml-auto">
                  <span>Priority:</span>
                  <select 
                    value={newTaskPriority} 
                    onChange={e => setNewTaskPriority(Number(e.target.value))}
                    className="bg-[var(--surface)] border border-[var(--border)] text-[11px] rounded-sm px-2 py-0.5 outline-none text-[var(--foreground)]"
                  >
                    <option value={0}>Low</option>
                    <option value={1}>Med</option>
                    <option value={2}>High</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-4xl mx-auto">
          {loading && tasks.length === 0 && (
            <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          
          {!loading && tasks.length === 0 && !error && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <ListTodo className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">All caught up. No tasks found.</p>
            </div>
          )}

          {activeTasks.map((task) => (
            <div key={task.id} className="border-b border-[var(--border)] group transition-colors">
              {editingId === task.id ? (
                // EDIT MODE
                <div className="p-4 bg-[var(--surface)]/50 flex flex-col gap-3">
                   <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full bg-transparent text-[13px] font-bold focus:outline-none"
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Description"
                      className="w-full bg-[var(--background)] border border-[var(--border)] p-2 rounded text-[12px] focus:outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-3">
                        <input 
                          type="datetime-local" 
                          value={editForm.dueDate}
                          onChange={e => setEditForm({...editForm, dueDate: e.target.value})}
                          className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--foreground)] focus:outline-none"
                        />
                        <select 
                          value={editForm.priority} 
                          onChange={e => setEditForm({...editForm, priority: Number(e.target.value)})}
                          className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--foreground)] focus:outline-none"
                        >
                          <option value={0}>Low</option>
                          <option value={1}>Med</option>
                          <option value={2}>High</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingId(null)} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><X className="w-4 h-4"/></button>
                        <button onClick={saveEdit} className="p-1 text-green-500 hover:text-green-400"><Check className="w-4 h-4"/></button>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--surface)]/40 text-[13px]">
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    className="w-4 h-4 mt-0.5 border border-[var(--border)] rounded-sm shrink-0 flex items-center justify-center hover:border-[var(--accent)] transition-colors bg-[var(--surface)]"
                  >
                    {task.completed && <Check className="w-3 h-3 text-[var(--accent)]" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium", task.completed && "line-through text-[var(--muted-foreground)]")}>
                        {task.title}
                      </span>
                      {task.priority > 0 && (
                        <Badge variant={priorityVariant[task.priority] ?? "default"} className="text-[9px] px-1.5 py-0">
                          {priorityLabel[task.priority]}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm border",
                          isOverdue(task.dueDate) && !task.completed
                            ? "bg-red-500/10 border-red-500/20 text-red-500"
                            : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted-foreground)]"
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDisplayDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className={cn("mt-1.5 text-[11px] whitespace-pre-wrap leading-relaxed", task.completed ? "text-[var(--muted-foreground)]/50 line-through" : "text-[var(--muted-foreground)]")}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => startEditing(task)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-md transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {doneTasks.length > 0 && (
            <div className="mt-8">
              <div className="px-5 py-2 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider border-b border-[var(--border)] sticky top-0 bg-[var(--background)]/80 backdrop-blur-sm">
                Completed ({doneTasks.length})
              </div>
              {doneTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 px-5 py-2.5 border-b border-[var(--border)] opacity-60 group text-[13px] hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    className="w-4 h-4 mt-0.5 border border-[var(--border)] rounded-sm shrink-0 flex items-center justify-center bg-[var(--surface)]"
                  >
                    <Check className="w-3 h-3 text-[var(--accent)]" />
                  </button>
                  <div className="flex-1 min-w-0 line-through text-[var(--muted-foreground)]">
                    <span className="mr-2">{task.title}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}