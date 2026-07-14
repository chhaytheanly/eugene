import { useEffect, useState } from "react";
import { BrainCircuit, Trash2 } from "lucide-react";
import { getMemories, deleteMemory } from "../api";
import { format } from "date-fns";

export default function Memory() {
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const data = await getMemories();
      setMemories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMemory(id);
      loadMemories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Memory</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Facts and context Eugene has learned about you.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2">
        {memories.map((mem) => (
          <div key={mem.id} className="group flex items-start justify-between p-4 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors">
            <div className="flex gap-4">
              <div className="mt-0.5">
                <BrainCircuit className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-sm leading-relaxed">{mem.content}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                  Learned {format(new Date(mem.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(mem.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--muted)] rounded-md transition-all shrink-0 ml-4"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="text-center py-12 text-sm text-[var(--muted-foreground)] flex flex-col items-center">
            <BrainCircuit className="w-8 h-8 opacity-20 mb-4" />
            No memories yet. Eugene learns as you chat.
          </div>
        )}
      </div>
    </div>
  );
}
