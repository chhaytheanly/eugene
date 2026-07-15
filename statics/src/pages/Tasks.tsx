import { useEffect, useState } from "react";
import { Trash2, ListTodo, Plus } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try { setTasks(await getTasks()); } catch (err) { console.error(err); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await createTask({ title: newTask, priority: 0 });
      setNewTask("");
      loadTasks();
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try { await updateTask(id, { completed: !completed }); loadTasks(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTask(id); loadTasks(); } catch (err) { console.error(err); }
  };

  const priorityLabel = ["low", "med", "high"] as const;
  const priorityVariant = ["default", "warning", "destructive"] as const;

  const activeTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <ListTodo className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">tasks</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">
            {activeTasks.length} pending
          </span>
        </div>
      </div>

      {/* Add task */}
      <form onSubmit={handleAdd} className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Plus className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="add task..."
            className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <Button type="submit" size="sm" disabled={!newTask.trim()}>
            add
          </Button>
        </div>
      </form>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <ListTodo className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">no tasks found</p>
            </div>
          )}
          {activeTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group text-[13px]">
              <button
                onClick={() => handleToggle(task.id, task.completed)}
                className="w-4 h-4 border border-[var(--border)] rounded-sm shrink-0 flex items-center justify-center hover:border-[var(--accent)] transition-colors"
              >
                {task.completed && <span className="text-[10px] text-[var(--accent)]">x</span>}
              </button>
              <span className={cn("flex-1", task.completed && "line-through text-[var(--muted-foreground)]")}>
                {task.title}
              </span>
              <Badge variant={priorityVariant[task.priority] ?? "default"}>
                {priorityLabel[task.priority] ?? task.priority}
              </Badge>
              <button
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {/* Completed section */}
          {doneTasks.length > 0 && (
            <>
              <div className="px-5 py-2 text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--surface)] border-b border-[var(--border)]">
                completed ({doneTasks.length})
              </div>
              {doneTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-5 py-2 border-b border-[var(--border)] opacity-60 group text-[13px]">
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    className="w-4 h-4 border border-[var(--border)] rounded-sm shrink-0 flex items-center justify-center"
                  >
                    <span className="text-[10px] text-[var(--accent)]">x</span>
                  </button>
                  <span className="flex-1 line-through text-[var(--muted-foreground)]">{task.title}</span>
                  <button
                    onClick={() => handleDelete(task.id)}
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
