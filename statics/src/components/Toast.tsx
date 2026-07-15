import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type ToastProps = {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  onDismiss: (id: string) => void;
};

export function Toast({ id, message, action, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg font-mono text-[13px] z-50"
    >
      <span className="text-[var(--foreground)]">{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
          className="text-[var(--accent)] font-semibold hover:underline"
        >
          {action.label}
        </button>
      )}
      <button onClick={() => onDismiss(id)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-2">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function Toaster({ toasts, onDismiss }: { toasts: Omit<ToastProps, "onDismiss">[], onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {toasts.map(t => (
            <Toast key={t.id} {...t} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
