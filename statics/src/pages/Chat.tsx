import { useState, useRef, useEffect } from "react";
import { Loader2, Terminal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendMessage } from "../api";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

const STORAGE_KEY = "eugene:selectedModel";

function getSelected() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const sel = getSelected();
      const res = await sendMessage(userMsg, conversationId, sel?.id, sel?.provider);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "error: failed to connect to eugene." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-3">
        <Terminal className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <span className="text-xs font-semibold">assistant</span>
          <span className="text-[10px] text-[var(--muted-foreground)] ml-2">/home/chat</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-[var(--border)]">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] py-24">
              <Terminal className="w-10 h-10 opacity-10 mb-4" />
              <p className="text-xs">eugene@assistant:~$ <span className="animate-pulse">_</span></p>
              <p className="text-[10px] mt-2 text-[var(--muted-foreground)] opacity-50">type a message to begin</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "px-5 py-4 text-[13px] leading-relaxed",
                msg.role === "user" ? "bg-[var(--surface)]" : "bg-[var(--background)]"
              )}
            >
              <div className="flex items-start gap-3 max-w-4xl mx-auto">
                <span className={cn(
                  "text-[10px] font-bold uppercase shrink-0 mt-0.5 w-12",
                  msg.role === "user" ? "text-[var(--accent)]" : "text-cyan-500"
                )}>
                  {msg.role === "user" ? "$" : "ai"}
                </span>
                <div className="min-w-0 flex-1">
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-invert"
                      style={{
                        "--tw-prose-body": "var(--foreground)",
                        "--tw-prose-headings": "var(--foreground)",
                        "--tw-prose-bold": "var(--foreground)",
                        "--tw-prose-code": "var(--accent)",
                        "--tw-prose-pre-bg": "var(--surface)",
                        "--tw-prose-pre-code": "var(--foreground)",
                        "--tw-prose-links": "var(--accent)",
                      } as React.CSSProperties}
                    >
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="px-5 py-4 text-[13px] bg-[var(--background)]">
              <div className="flex items-start gap-3 max-w-4xl mx-auto">
                <span className="text-[10px] font-bold uppercase text-cyan-500 shrink-0 mt-0.5 w-12">ai</span>
                <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px]">thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--accent)] font-bold shrink-0">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type a message..."
              className="flex-1 bg-transparent text-[13px] font-mono focus:outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-50"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} size="sm">
              send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
