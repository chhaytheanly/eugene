import { useEffect, useState } from "react";
import { Trash2, ListTodo, Plus, Loader2, AlertCircle } from "lucide-react";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useAsync } from "../lib/useAsync";
import { useToast } from "../components/ToastProvider";

export default function Tasks() {
  const { data: tasks = [], loading, error, execute: loadTasks, setData: setTasks } = useAsync<any[]>(getTasks, []);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState(0);
  const toast = useToast();

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const tempId = "temp-" + Date.now();
    const tempTask = { id: tempId, title: newTask, priority: newPriority, completed: false, createdAt: new Date().toISOString() };
    
    // Optimistic update
    setTasks(prev => [...(prev || []), tempTask]);
    setNewTask("");
    setNewPriority(0);

    try {
      const created = await createTask({ title: tempTask.title, priority: tempTask.priority });
      setTasks(prev => (prev || []).map(t => t.id === tempId ? created : t));
    } catch {
      toast({ message: "Failed to create task", action: { label: "Retry", onClick: () => handleAdd(e) } });
      setTasks(prev => (prev || []).filter(t => t.id !== tempId));
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    // Optimistic update
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
    
    // Optimistic update
    setTasks(prev => (prev || []).filter(t => t.id !== id));
    
    toast({
      message: `Deleted: ${taskToDelete.title.substring(0, 20)}...`,
      action: {
        label: "Undo",
        onClick: async () => {
          setTasks(prev => [...(prev || []), taskToDelete]);
          await createTask({ title: taskToDelete.title, priority: taskToDelete.priority, description: taskToDelete.description });
          loadTasks(); 
        }
      }
    });

    try { 
      await deleteTask(id); 
    } catch { 
      toast({ message: "Failed to delete task" });
      setTasks(prev => [...(prev || []), taskToDelete]);
    }
  };

  const priorityLabel = ["low", "med", "high"] as const;
  const priorityVariant = ["default", "warning", "destructive"] as const;

  const activeTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex flex-col h-full bg-[var(--background)] transition-colors duration-300">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <ListTodo className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">tasks</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">
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

      <form onSubmit={handleAdd} className="px-5 py-3 border-b border-[var(--border)] bg-[var(--background)] flex flex-col gap-2 transition-colors duration-300">
        <div className="flex items-center gap-3 max-w-4xl mx-auto w-full">
          <Plus className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="add task..."
            className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <select 
            value={newPriority} 
            onChange={e => setNewPriority(Number(e.target.value))}
            className="bg-[var(--surface)] border border-[var(--border)] text-[11px] rounded-sm px-2 py-1 outline-none text-[var(--foreground)]"
          >
            <option value={0}>Low</option>
            <option value={1}>Med</option>
            <option value={2}>High</option>
          </select>
          <Button type="submit" size="sm" disabled={!newTask.trim()}>
            add
          </Button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {loading && tasks.length === 0 && (
            <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {!loading && tasks.length === 0 && !error && (
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