import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props { children?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };
  public static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  public render() {
    if (this.state.hasError) {
      return <div className="p-8 bg-red-100 text-red-900 w-full h-full"><h1 className="text-2xl font-bold">Something went wrong.</h1><pre className="mt-4 text-sm">{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}
