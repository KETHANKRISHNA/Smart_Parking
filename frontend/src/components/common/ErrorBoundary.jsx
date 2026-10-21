import React from 'react';
import { AlertTriangle } from 'lucide-react';

/** Last line of defence: a render error shows a recoverable message instead of a blank page. */
export class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">This page hit an unexpected error. Your data is safe.</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={() => this.setState({ error: null })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Try again
            </button>
            <button type="button" onClick={() => window.location.assign('/')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Go to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
