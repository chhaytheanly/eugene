import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";

const CodeCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute right-2 top-2 p-1.5 rounded-md bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors z-10"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn("prose prose-sm max-w-none prose-invert font-mono text-[13px] leading-relaxed", className)}
      style={{
        "--tw-prose-body": "var(--foreground)",
        "--tw-prose-headings": "var(--foreground)",
        "--tw-prose-bold": "var(--foreground)",
        "--tw-prose-code": "var(--accent)",
        "--tw-prose-pre-bg": "rgba(0,0,0,0.3)",
        "--tw-prose-pre-code": "var(--foreground)",
        "--tw-prose-links": "var(--accent)",
      } as React.CSSProperties}
    >
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="relative group mt-4 mb-4 rounded-md overflow-hidden border border-[var(--border)]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface)] border-b border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{match[1]}</span>
                </div>
                <CodeCopyButton text={String(children).replace(/\n$/, "")} />
                <pre className="p-4 overflow-x-auto bg-black/30 m-0">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--accent)]" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
