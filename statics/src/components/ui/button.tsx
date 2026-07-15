import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "default" | "icon";
};

export function Button({ className, variant = "default", size = "default", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-mono transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
        "disabled:pointer-events-none disabled:opacity-50 select-none",
        variant === "default" && "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90",
        variant === "secondary" && "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80",
        variant === "ghost" && "hover:bg-[var(--muted)] text-[var(--muted-foreground)]",
        variant === "destructive" && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        size === "sm" && "h-8 px-3 text-xs",
        size === "default" && "h-9 px-4",
        size === "icon" && "h-9 w-9",
        className
      )}
      {...props}
    />
  );
}
