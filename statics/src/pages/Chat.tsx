import { useState, useRef, useEffect } from "react";
import { Loader2, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat } from "../api";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Markdown } from "../components/Markdown";

const STORAGE_KEY = "eugene:selectedModel";
const HISTORY_KEY = "eugene:chatHistory";

function getSelected() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved).messages : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved).conversationId : undefined;
    } catch { return undefined; }
  });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ messages, conversationId }));
  }, [messages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setHistory((prev) => [userMsg, ...prev]);
    setHistoryIndex(-1);
    
    setMessages((prev) => [...prev, { role: "user", content: userMsg }, { role: "assistant", content: "" }]);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const sel = getSelected();
    
    await streamChat(userMsg, conversationId, sel?.id, sel?.provider, {
      onToken: (token) => {
        setLoading(false);
        setMessages((prev) => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last.content.endsWith(token)) return prev;
          last.content += token;
          return newMsgs;
        });
      },
      onTool: () => {
        // Optional: show tool execution
      },
      onDone: (convId) => {
        setConversationId(convId);
        setLoading(false);
      },
      onError: (err) => {
        console.error(err);
        setMessages((prev) => {
          const newMsgs = [...prev];
          if (!newMsgs[newMsgs.length - 1].content) {
             newMsgs[newMsgs.length - 1].content = "error: failed to connect to eugene. " + err;
          } else {
             newMsgs[newMsgs.length - 1].content += "\n\n[Stream Error: " + err + "]";
          }
          return newMsgs;
        });
        setLoading(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const nextIdx = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setInput(nextIdx >= 0 ? history[nextIdx] : "");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[var(--accent)] transition-colors duration-300" />
          <div>
            <span className="text-xs font-semibold">assistant</span>
            <span className="text-[10px] text-[var(--muted-foreground)] ml-2">/home/chat</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={() => { setMessages([]); setConversationId(undefined); }}
            className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-2 py-1 border border-transparent hover:border-[var(--border)] rounded"
          >
            clear_screen
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="divide-y divide-[var(--border)]">
          <AnimatePresence>
            {messages.length === 0 && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] py-32"
              >
                <div className="relative mb-6">
                  <Terminal className="w-12 h-12 opacity-20" />
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--accent)]"
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, }}
                  />
                </div>
                <div className="text-center font-mono space-y-2">
                  <p className="text-sm">eugene@assistant:~$ <span className="animate-pulse text-[var(--accent)]">_</span></p>
                  <p className="text-xs opacity-60">System ready. Waiting for input...</p>
                </div>
              </motion.div>
            )}
            
            {messages.map((msg, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                key={i}
                className={cn(
                  "px-5 py-5 text-[13px] leading-relaxed transition-colors duration-300",
                  msg.role === "user" ? "bg-[var(--surface)]" : "bg-[var(--background)]"
                )}
              >
                <div className="flex items-start gap-4 max-w-4xl mx-auto">
                  <span className={cn(
                    "text-[10px] font-bold uppercase shrink-0 mt-1 w-12 text-right transition-colors duration-300",
                    msg.role === "user" ? "text-[var(--accent)]" : "text-blue-400"
                  )}>
                    {msg.role === "user" ? "user >" : "sys >"}
                  </span>
                  <div className="min-w-0 flex-1">
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <Markdown content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-3 h-6 text-[var(--muted-foreground)]">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                          <span className="text-xs animate-pulse">processing...</span>
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-[var(--foreground)]">{msg.content}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] shrink-0 transition-colors duration-300 p-2">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-[var(--background)] border border-[var(--border)] rounded-md focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all duration-200">
          <div className="flex items-end gap-2 p-2">
            <span className="text-xs text-[var(--accent)] font-bold shrink-0 mb-2 ml-2">$</span>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command or message... (Shift+Enter for newline)"
              className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-50 resize-none min-h-[24px] max-h-[200px] py-1"
              disabled={loading && !messages[messages.length-1]?.content}
              rows={1}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || (loading && !messages[messages.length-1]?.content)} 
              size="sm"
              className="mb-0.5 shrink-0 bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90"
            >
              Execute
            </Button>
          </div>
          <div className="px-3 pb-1.5 flex justify-between items-center text-[9px] text-[var(--muted-foreground)] border-t border-[var(--border)]/50 pt-1.5">
            <span>Use ↑/↓ for command history</span>
            <span>↵ to send, ⇧+↵ for new line</span>
          </div>
        </form>
      </div>
    </div>
  );
}