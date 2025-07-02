"use client";

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log specific Web3 errors
    if (error.message.includes('Too Many Requests') || 
        error.message.includes('-32005') ||
        error.message.includes('Rate limit')) {
      console.warn('Rate limit error caught:', error);
    } else {
      console.error('Web3 Error caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Handle rate limit errors specifically
      if (this.state.error?.message.includes('Too Many Requests') ||
          this.state.error?.message.includes('-32005')) {
        return (
          this.props.fallback || (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-yellow-800 font-medium mb-2">
                🚦 Network Busy
              </h3>
              <p className="text-yellow-700 text-sm">
                We&apos;re experiencing high network traffic. Please refresh the page in a few moments.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Refresh Page
              </button>
            </div>
          )
        );
      }

      // Generic error fallback
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">
              ⚠️ Something went wrong
            </h3>
            <p className="text-red-700 text-sm">
              There was an error loading this component. Please try refreshing the page.
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default Web3ErrorBoundary;
