import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Terminal, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-[var(--foreground)] bg-[var(--background)] p-6 font-mono">
          <Terminal className="w-12 h-12 text-red-500 mb-4 opacity-80" />
          <h1 className="text-lg font-bold mb-2">ERR_FATAL</h1>
          <p className="text-[13px] text-[var(--muted-foreground)] mb-6 max-w-lg text-center">
            {this.state.error?.message || "An unexpected error occurred in the terminal interface."}
          </p>
          <Button onClick={() => window.location.reload()} variant="default">
            <RefreshCcw className="w-4 h-4 mr-2" />
            reboot system
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
