// =============================================================
// Error Boundary for Remote MFEs
// =============================================================
// Catches errors when a remote fails to load or crashes
// Shows fallback UI instead of crashing the entire app
// =============================================================

import React, { Component, ReactNode } from "react";

interface Props {
  remoteName: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[MFE Error] Remote "${this.props.remoteName}" failed:`, error);
    console.error("Component stack:", errorInfo.componentStack);

    // In production: send to monitoring (Sentry, DataDog)
    // monitoring.captureException(error, {
    //   tags: { remote: this.props.remoteName },
    //   extra: errorInfo,
    // });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: "24px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          textAlign: "center",
        }}>
          <p style={{ color: "#991b1b", fontWeight: 600 }}>
            ⚠️ Module &quot;{this.props.remoteName}&quot; is unavailable
          </p>
          <p style={{ color: "#b91c1c", fontSize: "14px" }}>
            The remote application could not be loaded. Other parts of the app continue to work.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "6px 16px",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
