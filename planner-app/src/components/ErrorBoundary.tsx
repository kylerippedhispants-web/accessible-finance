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
        <section className="standalone-card error-card" role="alert" aria-labelledby="planner-error-title" aria-describedby="planner-error-description">
          <div className="error-mark" aria-hidden="true">!</div>
          <span className="eyebrow">Planner stopped safely</span>
          <h1 id="planner-error-title">Something went wrong loading your planner.</h1>
          <p id="planner-error-description">Your financial details were not sent to an error tracker or written to a production log. Reload the page to try again.</p>
          <div className="form-actions">
            <button className="button button-primary" type="button" onClick={() => window.location.reload()}>Reload planner</button>
            <a className="button button-secondary" href="/planner/dashboard">Return to dashboard</a>
          </div>
        </section>
      </main>
    );
  }
}
