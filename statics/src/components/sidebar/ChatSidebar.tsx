import { useState, useEffect } from "react";
import { Plus, Search, MessageSquare, Pin } from "lucide-react";
import { cn } from "../../lib/utils";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  time: string;
  pinned?: boolean;
}

interface ChatSidebarProps {
  onNewChat?: () => void;
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function ChatSidebar({ onNewChat, activeId, onSelect }: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem("eugene:chatHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages?.length > 0) {
          const firstUserMsg = parsed.messages.find((m: any) => m.role === "user");
          if (firstUserMsg) {
            setConversations([
              {
                id: parsed.conversationId || "current",
                title: firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "..." : ""),
                preview: parsed.messages[parsed.messages.length - 1]?.content?.slice(0, 60) + "...",
                time: "now",
                pinned: false,
              }
            ]);
          }
        }
      }
    } catch { /* ignore */ }
  }, []);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter(c => c.pinned);
  const recent = filtered.filter(c => !c.pinned);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 25%, transparent)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Conversation
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)]">
          <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {pinned.length > 0 && (
          <div className="mb-2">
            <div className="px-4 py-1.5 flex items-center gap-1.5">
              <Pin className="w-3 h-3 text-[var(--muted-foreground)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Pinned</span>
            </div>
            {pinned.map(conv => (
              <ConvItem key={conv.id} conv={conv} active={activeId === conv.id} onSelect={onSelect} />
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <div>
            <div className="px-4 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Recent</span>
            </div>
            {recent.map(conv => (
              <ConvItem key={conv.id} conv={conv} active={activeId === conv.id} onSelect={onSelect} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)] opacity-20 mb-3" />
            <p className="text-xs text-[var(--muted-foreground)]">No conversations yet</p>
            <p className="text-[10px] text-[var(--muted-foreground)] opacity-60 mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConvItem({ conv, active, onSelect }: { conv: Conversation; active: boolean; onSelect?: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect?.(conv.id)}
      className={cn(
        "w-full text-left px-4 py-2.5 hover:bg-[var(--muted)] transition-colors rounded-lg mx-0",
        active && "bg-[var(--muted)] border-l-2 border-[var(--accent)]"
      )}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-medium text-[var(--foreground)] truncate flex-1">{conv.title}</span>
        <span className="text-[10px] text-[var(--muted-foreground)] ml-2 shrink-0">{conv.time}</span>
      </div>
      <p className="text-[11px] text-[var(--muted-foreground)] truncate">{conv.preview}</p>
    </button>
  );
}
