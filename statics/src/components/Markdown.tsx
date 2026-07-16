import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

const LANGUAGE_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  javascript: "JavaScript",
  py: "Python",
  python: "Python",
  json: "JSON",
  sh: "Bash",
  bash: "Bash",
  shell: "Bash",
  sql: "SQL",
  md: "Markdown",
  markdown: "Markdown",
  css: "CSS",
  html: "HTML",
  rust: "Rust",
  go: "Go",
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3776AB",
  JSON: "#00E5FF",
  Bash: "#4EAA25",
  SQL: "#CC2927",
  Markdown: "#083FA1",
  CSS: "#663399",
  HTML: "#E34F26",
  Rust: "#CE4A1D",
  Go: "#00ADD8",
};

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const langLabel = LANGUAGE_LABELS[language.toLowerCase()] || language.toUpperCase();
  const langColor = LANGUAGE_COLORS[langLabel] || "var(--muted-foreground)";
  const lines = code.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="code-block-wrapper my-4"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Header */}
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: langColor, boxShadow: `0 0 6px ${langColor}80` }}
          />
          <span
            className="text-[11px] font-semibold tracking-wider"
            style={{ color: langColor }}
          >
            {langLabel}
          </span>
          {!collapsed && (
            <span className="text-[10px] text-[var(--muted-foreground)] ml-1">
              {lines.length} lines
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all"
          style={{
            color: copied ? "rgb(74, 222, 128)" : "var(--muted-foreground)",
            background: copied ? "rgba(74, 222, 128, 0.1)" : "transparent",
          }}
          onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; }}
          onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}
        >
          {copied
            ? <><Check className="w-3.5 h-3.5" />Copied</>
            : <><Copy className="w-3.5 h-3.5" />Copy</>
          }
        </button>
      </div>

      {/* Code content */}
      {!collapsed && (
        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse" style={{ minWidth: "100%" }}>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="group hover:bg-white/[0.02]">
                  <td
                    className="select-none text-right pr-4 pl-4 py-0 text-[12px] align-top"
                    style={{
                      color: "rgba(139, 149, 169, 0.4)",
                      width: "3rem",
                      userSelect: "none",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: "1.6",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td className="py-0 pr-4" style={{ lineHeight: "1.6" }}>
                    <code
                      className="text-[12.5px] text-[var(--foreground)] whitespace-pre"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {line || " "}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {collapsed && (
        <div
          className="px-4 py-2 text-[11px] text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition-colors"
          onClick={() => setCollapsed(false)}
        >
          {lines.length} lines hidden — click to expand
        </div>
      )}
    </div>
  );
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-invert prose-neo text-[13.5px] leading-[1.7]",
        className
      )}
      style={{
        "--tw-prose-body": "var(--foreground)",
        "--tw-prose-headings": "var(--foreground)",
        "--tw-prose-bold": "var(--foreground)",
        "--tw-prose-code": "var(--accent)",
        "--tw-prose-pre-bg": "var(--code-bg)",
        "--tw-prose-pre-code": "var(--foreground)",
        "--tw-prose-links": "var(--accent)",
        "--tw-prose-bullets": "var(--muted-foreground)",
        "--tw-prose-hr": "var(--border)",
        "--tw-prose-th-borders": "var(--border)",
        "--tw-prose-td-borders": "var(--border)",
      } as React.CSSProperties}
    >
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeStr = String(children).replace(/\n$/, "");

            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeStr} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md text-[12.5px]"
                style={{
                  background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
                  fontFamily: "var(--font-mono)",
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }: any) {
            // Let our code component handle it
            return <>{children}</>;
          },
          a({ href, children, ...props }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", textDecoration: "underline", textDecorationColor: "color-mix(in srgb, var(--accent) 40%, transparent)" }}
                {...props}
              >
                {children}
              </a>
            );
          },
          blockquote({ children }: any) {
            return (
              <blockquote
                style={{
                  borderLeft: "3px solid var(--accent)",
                  paddingLeft: "1rem",
                  color: "var(--muted-foreground)",
                  fontStyle: "italic",
                  margin: "1rem 0",
                }}
              >
                {children}
              </blockquote>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          th({ children }: any) {
            return (
              <th style={{ background: "var(--surface)", padding: "8px 12px", textAlign: "left", borderBottom: "1px solid var(--border)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
                {children}
              </th>
            );
          },
          td({ children }: any) {
            return (
              <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(42,52,65,0.5)", color: "var(--foreground)" }}>
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
