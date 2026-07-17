import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat } from "../api";
import ModelSwitcher from "../components/ModelSwitcher";
import { Markdown } from "../components/Markdown";
import { cn } from "../lib/utils";
import {
  Send,
  Paperclip,
  Mic,
  X,
  Copy,
  RefreshCw,
  Edit3,
  Trash2,
  Zap,
  ChevronDown,
  Terminal,
  StopCircle,
} from "lucide-react";

const STORAGE_KEY = "eugene:selectedModel";
const HISTORY_KEY = "eugene:chatHistory";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Reaction = "like" | "helpful" | "dislike";

const uid = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function getSelected() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
}

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (Array.isArray(initial) && !Array.isArray(parsed)) return initial;
      return parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}

function useScrollToBottom(containerRef: React.RefObject<HTMLElement | null>) {
  const [showButton, setShowButton] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowButton(!atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);
  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [containerRef]);
  return { showButton, scrollToBottom };
}

const TypingIndicator = memo(() => (
  <div className="flex items-center gap-1.5 py-2">
    <div className="flex items-center gap-1.5">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
    <span className="text-[11px] text-[var(--fg-muted)] ml-2">Eugene is thinking…</span>
  </div>
));
TypingIndicator.displayName = "TypingIndicator";

const reactionMeta: Record<Reaction, { icon: string; label: string; varName: string }> = {
  like: { icon: "👍", label: "Like", varName: "--success" },
  helpful: { icon: "⚡", label: "Helpful", varName: "--accent" },
  dislike: { icon: "👎", label: "Not helpful", varName: "--danger" },
};

const ACTION_BTN =
  "p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]";

const MessageActions = memo(function MessageActions({
  onCopy,
  onRegenerate,
  onEdit,
  onDelete,
  reaction,
  onReact,
  isAssistant,
}: {
  onCopy: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  reaction: Reaction | null;
  onReact: (r: Reaction) => void;
  isAssistant: boolean;
}) {
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
      className="flex items-center gap-0.5 mt-2 ml-10"
    >
      <button
        onClick={handleCopy}
        className={cn(ACTION_BTN, "text-xs flex items-center gap-1")}
        title="Copy"
        aria-label="Copy message"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied && <span style={{ color: "var(--success)" }}>Copied</span>}
      </button>

      {isAssistant && onRegenerate && (
        <button
          onClick={onRegenerate}
          className={ACTION_BTN}
          title="Regenerate"
          aria-label="Regenerate response"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}

      {onEdit && (
        <button
          onClick={onEdit}
          className={ACTION_BTN}
          title="Edit message"
          aria-label="Edit message"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-elevated)] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--danger)]"
          title="Delete message"
          aria-label="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {isAssistant && (
        <>
          <span className="w-px h-4 mx-1.5" style={{ background: "var(--border)" }} aria-hidden="true" />
          {(Object.keys(reactionMeta) as Reaction[]).map((r) => {
            const meta = reactionMeta[r];
            const active = reaction === r;
            return (
              <button
                key={r}
                onClick={() => onReact(r)}
                className={cn(
                  "p-1.5 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
                  active
                    ? "bg-[var(--surface-elevated)]"
                    : "text-[var(--fg-muted)] hover:bg-[var(--surface-elevated)]"
                )}
                style={active ? { color: `var(${meta.varName})` } : undefined}
                title={meta.label}
                aria-label={meta.label}
                aria-pressed={active}
              >
                <span className="text-sm leading-none">{meta.icon}</span>
              </button>
            );
          })}
        </>
      )}
    </motion.div>
  );
});
MessageActions.displayName = "MessageActions";

const Message = memo(function Message({
  message,
  isEditing,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
  onRegenerate,
  onDelete,
  reaction,
  onReact,
  hovered,
  focused,
  onHoverChange,
  onFocusChange,
}: {
  message: Message;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  reaction: Reaction | null;
  onReact: (r: Reaction) => void;
  hovered: boolean;
  focused: boolean;
  onHoverChange: (v: boolean) => void;
  onFocusChange: (v: boolean) => void;
}) {
  const isAssistant = message.role === "assistant";
  const showActions = (hovered || focused) && !isEditing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "px-6 py-4 flex group",
        isAssistant ? "justify-start" : "justify-end"
      )}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      tabIndex={0}
      role="article"
      aria-label={`${isAssistant ? "Assistant" : "User"} message`}
    >
      {isAssistant && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3 mt-0.5"
          style={{
            background: "rgba(179,136,255,0.15)",
            border: "1px solid rgba(179,136,255,0.3)",
          }}
        >
          <Zap className="w-3.5 h-3.5" style={{ color: "var(--secondary)" }} />
        </div>
      )}

      <div className={cn("flex flex-col max-w-[80%]", !isAssistant && "items-end")}>
        {isEditing ? (
          <div
            className="px-3 py-3 text-sm leading-relaxed flex flex-col gap-2"
            style={{
              borderRadius: 16,
              background: "var(--assistant-bubble)",
              border: "1px solid var(--accent)",
            }}
          >
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onEditCancel();
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onEditSave();
              }}
              rows={Math.min(12, editValue.split("\n").length + 1)}
              className="w-full bg-transparent resize-none focus:outline-none text-[var(--fg)] font-mono text-xs leading-relaxed"
              aria-label="Edit message"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onEditCancel}
                className="px-2.5 py-1 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onEditSave}
                className="btn-terminal primary text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className="px-4 py-3 text-sm leading-relaxed"
            style={{
              borderRadius: 16,
              ...(isAssistant
                ? {
                  background: "var(--assistant-bubble)",
                  border: "1px solid var(--border)",
                }
                : {
                  background: "var(--user-bubble)",
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  backgroundImage:
                    "linear-gradient(135deg, var(--user-bubble), color-mix(in srgb, var(--accent) 5%, transparent))",
                }),
            }}
          >
            {isAssistant ? (
              message.content ? (
                <Markdown content={message.content} />
              ) : (
                <TypingIndicator />
              )
            ) : (
              <p className="whitespace-pre-wrap text-[var(--fg)]">{message.content}</p>
            )}
          </div>
        )}

        <AnimatePresence>
          {showActions && (
            <MessageActions
              onCopy={() => navigator.clipboard.writeText(message.content)}
              onRegenerate={isAssistant ? onRegenerate : undefined}
              onEdit={onEditSave}
              onDelete={onDelete}
              reaction={reaction}
              onReact={onReact}
              isAssistant={isAssistant}
            />
          )}
        </AnimatePresence>
      </div>

      {!isAssistant && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ml-3 mt-0.5"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <span className="text-[10px] font-bold text-[var(--accent)]">U</span>
        </div>
      )}
    </motion.div>
  );
});
Message.displayName = "Message";

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center select-none"
    >
      <div className="mb-8" style={{ opacity: 0.08 }}>
        <pre className="text-3xl font-bold font-mono tracking-tight" style={{ color: "var(--accent)" }}>
          {`$ eugene --help`}
        </pre>
      </div>

      <div className="mb-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-[var(--fg)] mb-2">Ready to assist</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Your AI-powered development workspace. Start a conversation or use the shortcuts below.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-10">
        {[
          { label: "Write code", desc: "Generate TypeScript, Python & more" },
          { label: "Explain code", desc: "Break down complex logic" },
          { label: "Debug issues", desc: "Find and fix bugs" },
          { label: "Plan a feature", desc: "Architecture & design help" },
        ].map((action) => (
          <button
            key={action.label}
            className="p-3 rounded-lg text-left hover:bg-[var(--surface-elevated)] transition-all border border-[var(--border)] group"
            style={{ background: "var(--surface)" }}
          >
            <p className="text-sm font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
              {action.label}
            </p>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--fg-muted)]">
        <div className="flex items-center gap-1.5">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            Ctrl+P
          </kbd>
          <span>Command palette</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            ↵
          </kbd>
          <span>Send</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            ⇧↵
          </kbd>
          <span>New line</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            Ctrl+B
          </kbd>
          <span>Toggle sidebar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            Ctrl+1-6
          </kbd>
          <span>Switch view</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Chat() {

  const [messages, setMessages] = useLocalStorage<Message[]>(HISTORY_KEY, []);
  const safeMessages = Array.isArray(messages) ? messages : [];
  const [conversationId, setConversationId] = useLocalStorage<string | undefined>(
    "eugene:conversationId",
    undefined
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [reactions, setReactions] = useState<Record<string, Reaction | null>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [contextChips, setContextChips] = useState([
    { id: "project", label: "Project: Eugene" },
    { id: "memory", label: "Memory: 8" },
  ]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);


  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);


  const { showButton: showScrollBtn, scrollToBottom } = useScrollToBottom(messagesContainerRef);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // ---------- derived ----------
  const selectedModel = useMemo(() => getSelected(), []);

  // ---------- core stream function ----------
  const runStream = useCallback(
    async (prompt: string, assistantId: string, retry = false) => {
      // Abort previous if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setIsStreaming(false);
      setError(null);

      // If retry, remove the old assistant message and add a new one
      if (!retry) {
        // For a fresh message, we already have a placeholder assistant message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, role: "assistant", content: "" } : m
          )
        );
      } else {
        // Remove the last assistant message and replace with a new empty one
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === assistantId);
          if (idx === -1) return prev;
          const newMsg = { ...prev[idx], content: "" };
          return [...prev.slice(0, idx), newMsg, ...prev.slice(idx + 1)];
        });
      }

      try {
        await streamChat(
          prompt,
          conversationId,
          selectedModel?.id,
          selectedModel?.provider,
          {
            signal: abortControllerRef.current.signal,
            onToken: (token: string) => {
              if (abortControllerRef.current?.signal.aborted) return;
              setIsLoading(false);
              setIsStreaming(true);
              setTokensUsed((prev) => prev + 1);
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  // Avoid duplicate tokens
                  if (m.content.endsWith(token)) return m;
                  return { ...m, content: m.content + token };
                })
              );
            },
            onTool: () => { },
            onDone: (convId: string) => {
              setConversationId(convId);
              setIsLoading(false);
              setIsStreaming(false);
              abortControllerRef.current = null;
            },
            onError: (err: string) => {
              setError(err);
              setIsLoading(false);
              setIsStreaming(false);
              abortControllerRef.current = null;
              // Show error in the message itself
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  return {
                    ...m,
                    content: m.content
                      ? m.content + `\n\n**[Error: ${err}]**`
                      : `Failed to generate response: ${err}`,
                  };
                })
              );
            },
          }
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled
          setIsLoading(false);
          setIsStreaming(false);
          abortControllerRef.current = null;
          // Mark message as cancelled
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return {
                ...m,
                content: m.content + "\n\n*[Generation stopped]*",
              };
            })
          );
        } else {
          // Unexpected error
          setError("Something went wrong");
          setIsLoading(false);
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [conversationId, selectedModel, setMessages, setConversationId]
  );

  // ---------- handlers ----------
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || (isLoading && !isStreaming)) return;

      const userMsg = input.trim();
      setInput("");
      setHistory((prev) => [userMsg, ...prev]);
      setHistoryIndex(-1);

      const assistantId = uid();
      const userMessage: Message = { id: uid(), role: "user", content: userMsg };
      const assistantMessage: Message = { id: assistantId, role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      await runStream(userMsg, assistantId);
    },
    [input, isLoading, isStreaming, runStream, setMessages]
  );

  const handleRegenerate = useCallback(
    (assistantId: string) => {
      const msg = messages.find((m) => m.id === assistantId);
      if (!msg || msg.role !== "assistant") return;
      // Find the previous user message
      const idx = messages.indexOf(msg);
      const userMsg = messages[idx - 1];
      if (!userMsg || userMsg.role !== "user") return;
      // Remove the old assistant message and add a new one
      setMessages((prev) => {
        const newList = prev.filter((m) => m.id !== assistantId);
        const newAssistant: Message = { id: uid(), role: "assistant", content: "" };
        // Insert after the user message
        const userIdx = newList.findIndex((m) => m.id === userMsg.id);
        return [...newList.slice(0, userIdx + 1), newAssistant, ...newList.slice(userIdx + 1)];
      });
      // Run stream with the new assistant id
      runStream(userMsg.content, uid(), true);
    },
    [messages, runStream, setMessages]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setReactions((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    },
    [setMessages]
  );

  const handleReact = useCallback((id: string, r: Reaction) => {
    setReactions((prev) => ({ ...prev, [id]: prev[id] === r ? null : r }));
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const value = editValue.trim();
    if (!value) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === editingId ? { ...m, content: value } : m))
    );
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, setMessages]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setTokensUsed(0);
    setReactions({});
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  }, [setMessages, setConversationId]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  const removeContextChip = useCallback((id: string) => {
    setContextChips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      } else if (e.key === "Escape" && editingId) {
        cancelEdit();
      }
    },
    [handleSubmit, history, historyIndex, input, editingId, cancelEdit]
  );

  // ---------- render ----------
  const hasMessages = safeMessages.length > 0;
  const isGenerating = isLoading || isStreaming;

  return (
    <div className="relative flex flex-col h-full min-h-0" style={{ background: "transparent" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", minHeight: 52 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold text-[var(--fg)]">Eugene</span>
          </div>
          <span
            className="text-[10px] font-mono text-[var(--fg-subtle)] px-2 py-0.5 rounded"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
          >
            v0.1.0
          </span>
        </div>

        <div className="flex-1 flex justify-center px-4 max-w-xs mx-auto">
          <ModelSwitcher />
        </div>

        <div className="flex items-center gap-2">
          {tokensUsed > 0 && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[var(--fg-muted)]"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}
            >
              <Zap className="w-3 h-3" style={{ color: "var(--accent)" }} />
              <span className="font-mono tabular-nums">{tokensUsed.toLocaleString()}</span>
              <span className="text-[var(--fg-subtle)]">tok</span>
            </div>
          )}
          {hasMessages && (
            <button
              onClick={clearChat}
              className="px-3 py-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors border border-transparent hover:border-[var(--border)]"
              title="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div
          className="px-6 py-2 flex items-center gap-2 text-xs"
          style={{
            background: "rgba(239,68,68,0.1)",
            borderBottom: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => {
              setError(null);
              // Retry last user message if possible
              const lastUser = [...safeMessages].reverse().find((m) => m.role === "user");
              if (lastUser) {
                const newAssistantId = uid();
                setMessages((prev) => [
                  ...prev,
                  { id: newAssistantId, role: "assistant", content: "" },
                ]);
                runStream(lastUser.content, newAssistantId, true);
              }
            }}
            className="ml-auto underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <AnimatePresence mode="popLayout">
          {!hasMessages && !isGenerating && <EmptyState key="empty" />}

          {safeMessages.map((msg) => {
            const isEditing = editingId === msg.id;
            const reaction = reactions[msg.id] ?? null;
            const hovered = hoveredId === msg.id;
            const focused = focusedId === msg.id;

            return (
              <Message
                key={msg.id}
                message={msg}
                isEditing={isEditing}
                editValue={isEditing ? editValue : ""}
                onEditChange={setEditValue}
                onEditSave={saveEdit}
                onEditCancel={cancelEdit}
                onRegenerate={() => handleRegenerate(msg.id)}
                onDelete={() => handleDelete(msg.id)}
                reaction={reaction}
                onReact={(r) => handleReact(msg.id, r)}
                hovered={hovered}
                focused={focused}
                onHoverChange={(v) => setHoveredId(v ? msg.id : null)}
                onFocusChange={(v) => setFocusedId(v ? msg.id : null)}
              />
            );
          })}
        </AnimatePresence>

        <div ref={scrollToBottom as any} className="h-4" />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-36 right-8 p-2 rounded-full shadow-lg z-10 flex items-center justify-center"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              boxShadow: "0 0 16px var(--accent-dim)",
            }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <footer
        className="shrink-0 px-6 pb-4 pt-2"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}
      >
        {/* Context chips */}
        {contextChips.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-2 flex-wrap mb-2">
            {contextChips.map((chip) => (
              <div key={chip.id} className="badge-terminal">
                <span>{chip.label}</span>
                <button
                  onClick={() => removeContextChip(chip.id)}
                  className="p-0.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors line-height-1"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div
            className="rounded-xl overflow-hidden transition-all duration-200"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: input ? "var(--focus-ring)" : "none",
            }}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Eugene..."
                disabled={isLoading && !isStreaming}
                rows={1}
                className="flex-1 bg-transparent px-0 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: 240, minHeight: 28, lineHeight: "1.6" }}
                aria-label="Chat input"
              />
            </div>

            <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                {hasMessages && (
                  <button
                    type="button"
                    onClick={clearChat}
                    className="p-1.5 rounded text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-elevated)] transition-colors"
                    title="Clear chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--fg-subtle)] hidden sm:block font-mono">
                  ↵ Send • ⇧↵ Newline
                </span>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopGeneration}
                    className="btn-terminal danger flex items-center gap-1.5"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="btn-terminal primary flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <p className="text-center text-[10px] text-[var(--fg-subtle)] mt-2 opacity-50">
          Eugene can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  );
}