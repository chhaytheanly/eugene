import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendMessage } from "../api";
import { clsx } from "clsx";

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
      const res = await sendMessage(userMsg, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "**Error:** Failed to connect to Eugene." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <header className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-medium">Assistant</h2>
          <p className="text-xs text-[var(--muted-foreground)]">Eugene is ready to help you plan and execute.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] space-y-4">
            <Bot className="w-12 h-12 opacity-20" />
            <p className="text-sm">How can I help you today?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={clsx("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={clsx(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === "user" ? "bg-[var(--foreground)] text-[var(--background)]" : "bg-[var(--muted)] border border-[var(--border)]"
            )}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={clsx(
              "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
              msg.role === "user" ? "bg-[var(--muted)] text-[var(--foreground)] rounded-tr-sm" : "bg-transparent text-[var(--foreground)] border border-[var(--border)] rounded-tl-sm"
            )}>
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl border border-[var(--border)] rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
              <span className="text-xs text-[var(--muted-foreground)]">Eugene is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] shrink-0">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Eugene..."
            className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-full pl-6 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] transition-shadow"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
