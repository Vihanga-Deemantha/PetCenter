import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

// A render error anywhere in the tree below this component previously
// produced a blank white page with no way back except manually editing the
// URL. React only supports catching render errors via a class component
// (there's no hook equivalent), so this stays a class despite the rest of
// the app being function components.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-white">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-500">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 font-medium mb-8">
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.assign("/")}
              className="btn btn-primary px-8 py-3 inline-flex items-center gap-2"
            >
              <RefreshCw size={18} /> Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
