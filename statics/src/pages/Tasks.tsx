import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { clsx } from "clsx";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await createTask({ title: newTask });
      setNewTask("");
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await updateTask(id, { completed: !completed });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage your pending work and priorities.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mb-6 relative">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-transparent border-b border-[var(--border)] py-3 pl-2 pr-10 text-sm focus:outline-none focus:border-[var(--foreground)] transition-colors"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-2">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center justify-between p-3 hover:bg-[var(--muted)] rounded-md transition-colors border border-transparent hover:border-[var(--border)]">
            <div className="flex items-center gap-4">
              <button onClick={() => handleToggle(task.id, task.completed)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                {task.completed ? <CheckCircle2 className="w-5 h-5 text-[var(--foreground)]" /> : <Circle className="w-5 h-5" />}
              </button>
              <span className={clsx("text-sm", task.completed && "line-through text-[var(--muted-foreground)]")}>
                {task.title}
              </span>
            </div>
            <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-sm text-[var(--muted-foreground)]">
            No tasks yet. You're all caught up.
          </div>
        )}
      </div>
    </div>
  );
}
