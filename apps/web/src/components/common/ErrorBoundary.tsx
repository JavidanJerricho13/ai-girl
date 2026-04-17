'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center mb-4">
            <span className="text-lg">!</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-lilac hover:text-lilac/80 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
