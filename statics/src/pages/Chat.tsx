import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat } from "../api";
import ModelSwitcher from "../components/ModelSwitcher";
import { Markdown } from "../components/Markdown";
import { cn } from "../lib/utils";
import {
  Send, Paperclip, Mic, Slash, X, Copy, RefreshCw, Edit3,
  Zap, ChevronDown
} from "lucide-react";

const STORAGE_KEY = "eugene:selectedModel";
const HISTORY_KEY = "eugene:chatHistory";

function getSelected() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// Context chips above input
function ContextBar({ onRemove }: { onRemove: (key: string) => void }) {
  const [chips, setChips] = useState([
    { id: "project", label: "Project: Eugene" },
    { id: "memory", label: "Memory: 8" },
  ]);

  const remove = (id: string) => {
    setChips(prev => prev.filter(c => c.id !== id));
    onRemove(id);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
      {chips.map(chip => (
        <div key={chip.id} className="context-chip">
          <span>{chip.label}</span>
          <button onClick={() => remove(chip.id)}>
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Message action buttons (hover)
function MessageActions({ onCopy, onRegenerate, onEdit }: { onCopy: () => void; onRegenerate?: () => void; onEdit?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-1 mt-2"
    >
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-xs flex items-center gap-1"
        title="Copy"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? <span className="text-green-400">Copied</span> : null}
      </button>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          title="Regenerate"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          title="Edit"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
      <button className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors" title="Like">
        👍
      </button>
      <button className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors" title="Rocket">
        🚀
      </button>
      <button className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors" title="Fire">
        🔥
      </button>
    </motion.div>
  );
}

// Empty state
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center select-none"
    >
      {/* Watermark */}
      <div className="mb-8" style={{ opacity: 0.06 }}>
        <p className="text-5xl font-bold font-mono tracking-tight" style={{ color: "var(--accent)" }}>
          eugene@assistant:~$
        </p>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          How can I help you today?
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md">
          Your AI-powered development workspace is ready. Start a conversation or use the shortcuts below.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-10">
        {[
          { label: "Write code", desc: "Generate TypeScript, Python & more" },
          { label: "Explain code", desc: "Break down complex logic" },
          { label: "Debug issues", desc: "Find and fix bugs" },
          { label: "Plan a feature", desc: "Architecture & design help" },
        ].map(action => (
          <button
            key={action.label}
            className="p-3 rounded-xl text-left hover-elevate transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <p className="text-sm font-medium text-[var(--foreground)]">{action.label}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>Ctrl+P</kbd>
          <span>Command palette</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>↵</kbd>
          <span>Send</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>⇧↵</kbd>
          <span>New line</span>
        </div>
      </div>
    </motion.div>
  );
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved).conversationId : undefined;
    } catch { return undefined; }
  });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ messages, conversationId }));
  }, [messages, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll detection
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!atBottom && messages.length > 0);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages.length]);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || (loading && !isStreaming)) return;

    const userMsg = input.trim();
    setInput("");
    setHistory(prev => [userMsg, ...prev]);
    setHistoryIndex(-1);

    setMessages(prev => [...prev, { role: "user", content: userMsg }, { role: "assistant", content: "" }]);
    setLoading(true);
    setIsStreaming(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const sel = getSelected();

    await streamChat(userMsg, conversationId, sel?.id, sel?.provider, {
      onToken: (token) => {
        setLoading(false);
        setIsStreaming(true);
        setTokensUsed(prev => prev + 1);
        setMessages(prev => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last.content.endsWith(token)) return prev;
          last.content += token;
          return newMsgs;
        });
      },
      onTool: () => {},
      onDone: (convId) => {
        setConversationId(convId);
        setLoading(false);
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          if (!newMsgs[newMsgs.length - 1].content) {
            newMsgs[newMsgs.length - 1].content = `Failed to connect: ${err}`;
          } else {
            newMsgs[newMsgs.length - 1].content += `\n\n**[Error: ${err}]**`;
          }
          return newMsgs;
        });
        setLoading(false);
        setIsStreaming(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowUp" && history.length > 0 && input === "") {
      e.preventDefault();
      const nextIdx = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === "ArrowDown" && historyIndex >= 0) {
      e.preventDefault();
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setInput(nextIdx >= 0 ? history[nextIdx] : "");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setTokensUsed(0);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* ============ HEADER ============ */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0 glass"
        style={{ borderBottom: "1px solid var(--border)", minHeight: 52 }}
      >
        <div className="flex items-center gap-3">
          {/* Animated status dot */}
          <div className="relative w-2.5 h-2.5">
            <div className="absolute inset-0 rounded-full bg-green-400" />
            <div className="status-pulse absolute inset-0 rounded-full bg-green-400" />
          </div>
          <span className="text-sm font-semibold text-[var(--foreground)]">Eugene AI</span>
        </div>

        {/* Model switcher — always visible in header */}
        <div className="flex-1 flex justify-center px-4 max-w-xs mx-auto">
          <ModelSwitcher />
        </div>

        <div className="flex items-center gap-2">
          {tokensUsed > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-[var(--muted-foreground)]" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <Zap className="w-3 h-3 text-[var(--accent)]" />
              <span>{tokensUsed.toLocaleString()} tokens</span>
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              style={{ border: "1px solid transparent" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
            >
              Clear Chat
            </button>
          )}
        </div>
      </div>

      {/* ============ MESSAGES ============ */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !loading && (
            <EmptyState key="empty" />
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "px-6 py-4 flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
              onMouseEnter={() => setHoveredMsgIdx(i)}
              onMouseLeave={() => setHoveredMsgIdx(null)}
            >
              {/* Assistant avatar */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3 mt-0.5"
                  style={{ background: "rgba(179,136,255,0.15)", border: "1px solid rgba(179,136,255,0.3)" }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: "var(--secondary)" }} />
                </div>
              )}

              <div className={cn("flex flex-col max-w-[75%]", msg.role === "user" && "items-end")}>
                {/* Message bubble */}
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={{
                    borderRadius: 18,
                    ...(msg.role === "user" ? {
                      background: "var(--user-bubble)",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                      backgroundImage: "linear-gradient(135deg, var(--user-bubble), color-mix(in srgb, var(--accent) 5%, transparent))",
                    } : {
                      background: "var(--assistant-bubble)",
                      border: "1px solid var(--border)",
                    })
                  }}
                >
                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <Markdown content={msg.content} />
                    ) : (
                      <TypingIndicator />
                    )
                  ) : (
                    <p className="whitespace-pre-wrap text-[var(--foreground)]">{msg.content}</p>
                  )}
                </div>

                {/* Hover actions for assistant */}
                <AnimatePresence>
                  {msg.role === "assistant" && msg.content && hoveredMsgIdx === i && (
                    <MessageActions
                      onCopy={() => navigator.clipboard.writeText(msg.content)}
                      onRegenerate={i === messages.length - 1 ? () => {} : undefined}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* User avatar */}
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-3 mt-0.5"
                  style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" }}>
                  <span className="text-[10px] font-bold text-[var(--accent)]">U</span>
                </div>
              )}
            </motion.div>
          ))}

        </AnimatePresence>

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-36 right-8 p-2 rounded-full shadow-lg z-10"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)", boxShadow: "0 0 16px color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ============ INPUT AREA ============ */}
      <div
        className="shrink-0 px-6 pb-4 pt-2"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}
      >
        {/* Context chips */}
        <ContextBar onRemove={() => {}} />

        {/* Input form */}
        <form onSubmit={handleSubmit} className="relative">
          <div
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: input ? "var(--focus-ring)" : "none",
            }}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Eugene..."
              disabled={loading && !isStreaming}
              rows={1}
              className="w-full bg-transparent px-4 pt-3 pb-1 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: 200, fontFamily: "inherit" }}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  title="Slash commands"
                >
                  <Slash className="w-4 h-4" />
                </button>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    title="Clear chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--muted-foreground)] hidden sm:block">
                  ↵ Send • ⇧↵ Newline
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || (loading && !isStreaming)}
                  className="send-btn flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-[var(--muted-foreground)] mt-2 opacity-50">
          Eugene can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
