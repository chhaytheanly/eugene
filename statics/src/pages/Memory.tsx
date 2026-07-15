import { useEffect, useState } from "react";
import { Trash2, BrainCircuit, Database } from "lucide-react";
import { getMemories, deleteMemory } from "../api";
import { format } from "date-fns";

export default function Memory() {
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    try { setMemories(await getMemories()); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteMemory(id); loadMemories(); } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <Database className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">memory</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">{memories.length} records</span>
        </div>
      </div>

      {/* Memory list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {memories.length === 0 && (
            <div className="text-center py-16 text-[var(--muted-foreground)]">
              <Database className="w-8 h-8 opacity-10 mx-auto mb-3" />
              <p className="text-xs">no memories stored yet</p>
              <p className="text-[10px] mt-1 opacity-60">eugene learns facts during conversation</p>
            </div>
          )}
          {memories.map((mem) => (
            <div key={mem.id} className="flex items-start gap-3 px-5 py-3 border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors group text-[13px]">
              <BrainCircuit className="w-4 h-4 mt-0.5 shrink-0 text-[var(--muted-foreground)]" />
              <div className="flex-1 min-w-0">
                <p className="leading-relaxed">{mem.content}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                  stored {format(new Date(mem.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(mem.id)}
                className="opacity-0 group-hover:opacity-100 mt-0.5 text-[var(--muted-foreground)] hover:text-red-500 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
