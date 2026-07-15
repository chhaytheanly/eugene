import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Toaster } from "./Toast";
import type { ToastProps } from "./Toast";

type AddToast = (toast: Omit<ToastProps, "id" | "onDismiss">) => void;

const ToastContext = createContext<AddToast | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onDismiss">[]>([]);

  const addToast: AddToast = (toast) => {
    setToasts(prev => [...prev, { ...toast, id: Math.random().toString(36).slice(2) }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
