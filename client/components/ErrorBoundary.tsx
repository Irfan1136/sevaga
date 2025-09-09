import React from "react";

type Props = { children: React.ReactNode };

export default class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }>{
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">The application encountered an error. You can reload the page to recover.</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-primary text-white rounded"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Dismiss
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
