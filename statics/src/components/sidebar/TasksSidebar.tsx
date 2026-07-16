import { useState, useEffect } from "react";
import { Plus, Loader2, Check, Circle, AlertCircle } from "lucide-react";
import { getTasks, createTask, updateTask } from "../../api";
import { cn } from "../../lib/utils";

const priorityColors = ["text-[var(--muted-foreground)]", "text-yellow-400", "text-red-400"];
const priorityLabels = ["Low", "Med", "High"];

export function TasksSidebar() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const temp = { id: "temp-" + Date.now(), title: newTitle, completed: false, priority: 0, createdAt: new Date().toISOString() };
    setTasks(prev => [...prev, temp]);
    setNewTitle("");
    try {
      const created = await createTask({ title: temp.title });
      setTasks(prev => prev.map(t => t.id === temp.id ? created : t));
    } catch {}
  };

  const handleToggle = async (id: string, completed: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    try { await updateTask(id, { completed: !completed }); } catch {}
  };

  const active = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  const total = tasks.length;
  const progress = total > 0 ? Math.round((done.length / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--foreground)]">Tasks</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{done.length}/{total} done</span>
        </div>
        <div className="h-1 rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${progress}%`, boxShadow: "0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)" }}
          />
        </div>
      </div>

      {/* New task input */}
      <form onSubmit={handleAdd} className="px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <Plus className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="New task..."
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {active.map(task => (
          <TaskItem key={task.id} task={task} onToggle={handleToggle} />
        ))}

        {done.length > 0 && (
          <>
            <div className="px-4 py-2 mt-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Completed ({done.length})</span>
            </div>
            {done.map(task => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} dimmed />
            ))}
          </>
        )}

        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertCircle className="w-6 h-6 text-[var(--muted-foreground)] opacity-20 mb-3" />
            <p className="text-xs text-[var(--muted-foreground)]">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, dimmed }: { task: any; onToggle: (id: string, completed: boolean) => void; dimmed?: boolean }) {
  return (
    <button
      onClick={() => onToggle(task.id, task.completed)}
      className={cn(
        "w-full flex items-start gap-2.5 px-4 py-2 hover:bg-[var(--muted)] transition-colors text-left",
        dimmed && "opacity-50"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-colors",
        task.completed
          ? "bg-[var(--accent)] border-[var(--accent)]"
          : "border-[var(--border)] hover:border-[var(--accent)]"
      )}>
        {task.completed && <Check className="w-2.5 h-2.5 text-[var(--accent-foreground)]" />}
        {!task.completed && <Circle className="w-2.5 h-2.5 opacity-0" />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn("text-xs", task.completed && "line-through text-[var(--muted-foreground)]")}>
          {task.title}
        </span>
        {task.priority > 0 && (
          <span className={cn("text-[10px] ml-2", priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </span>
        )}
      </div>
    </button>
  );
}
