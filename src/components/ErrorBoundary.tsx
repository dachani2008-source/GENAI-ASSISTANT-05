import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering issue occurred.',
    };
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen bg-[#F5F0E8] text-[#182C28] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white border border-[#D8C9B8] rounded-lg p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#A34E50]">
              ELEGANTIA AI STUDIO RECOVERY
            </p>
            <h1 className="font-editorial text-2xl font-semibold">
              Workspace View Reloaded
            </h1>
            <p className="text-xs text-[#292A27]/80">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-[#182C28] text-[#F5F0E8] text-xs font-semibold rounded cursor-pointer"
            >
              Return to Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
