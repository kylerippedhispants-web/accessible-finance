import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Financial inputs and Supabase sessions are deliberately not logged.
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="centered-page">
        <section className="standalone-card">
          <span className="eyebrow">Planner stopped safely</span>
          <h1>That plan could not be displayed.</h1>
          <p>No financial details were sent to an error tracker or written to a production log.</p>
          <button className="button button-primary" type="button" onClick={() => window.location.assign('/planner/settings')}>Review plan settings</button>
          <a className="text-button" href="/planner/">Return to planner start</a>
        </section>
      </main>
    );
  }
}
