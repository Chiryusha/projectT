import { Component, type ErrorInfo, type ReactNode } from "react";

import { trackFrontendLog } from "@/features/analytics";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    trackFrontendLog({
      event: "react_render_error",
      level: "error",
      message: `${error.message} ${info.componentStack ?? ""}`,
      page: window.location.pathname,
      source: "react-error-boundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
          <section className="max-w-md rounded-[8px] border border-red-300/35 bg-red-950/30 p-6 text-center shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
              Application error
            </p>
            <h1 className="mt-3 text-3xl font-black">Something went wrong</h1>
            <p className="mt-3 text-sm font-bold text-white/60">
              Reload the page or return to the main menu.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
