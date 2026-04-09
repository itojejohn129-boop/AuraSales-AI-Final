"use client";

import React, { ReactNode, ReactElement } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 rounded-lg border border-slate-700 p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-slate-50 text-center mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-400 text-sm text-center mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={this.resetError}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
