import React from 'react';
import {AlertTriangle, RotateCcw} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050F1C] px-4 text-white">
          <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#081B32] p-8 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-[#D52B35]" aria-hidden="true" />
            <h1 className="mt-4 font-display text-xl font-bold">
              Unable to Load Dispatch Console
            </h1>
            <p className="mt-2 text-sm text-[#AEBBC9]">
              Please reload the page or verify your administrator session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#D52B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B81F28] cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
