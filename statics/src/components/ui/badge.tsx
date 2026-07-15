import { cn } from "../../lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "info" | "destructive";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium",
        variant === "default" && "border-[var(--border)] text-[var(--muted-foreground)]",
        variant === "success" && "border-green-500/30 text-green-500",
        variant === "warning" && "border-yellow-500/30 text-yellow-500",
        variant === "info" && "border-cyan-500/30 text-cyan-500",
        variant === "destructive" && "border-red-500/30 text-red-500",
        className
      )}
      {...props}
    />
  );
}
