import { AuthPanel } from '../auth/AuthPanel';
import { useAuth } from '../auth/AuthContext';
import { Brand } from '../components/Brand';

interface LandingPageProps {
  onTryDemo: () => void;
}

export function LandingPage({ onTryDemo }: LandingPageProps) {
  const { configured } = useAuth();

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-nav">
        <Brand />
        <nav className="landing-site-links" aria-label="Primary navigation">
          <a href="/">Home</a>
          <a href="/articles.html">Guides</a>
          <a href="/planner/" aria-current="page">Planner</a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="eyebrow">Free Canadian financial planner</span>
            <h1>See the amount and year behind your <em>financial independence path.</em></h1>
            <p className="landing-lead">
              Bring income, spending, assets, debt, and retirement assumptions into one calm Canadian planning view.
              See a modeled FIRE target, inspect the full projection, and compare another path.
            </p>
            <div className="landing-actions">
              <button className="button button-primary" type="button" onClick={onTryDemo}>Try the fictional demo</button>
              {configured
                ? <a className="button button-secondary" href="#account-access">Save across devices</a>
                : <a className="button button-secondary" href="/articles.html">Explore the guides</a>}
            </div>
            <ul className="trust-list" aria-label="Planner highlights">
              <li><span aria-hidden="true">✓</span> Calculations run in your browser</li>
              <li><span aria-hidden="true">✓</span> Demo data stays in this browser session</li>
              <li><span aria-hidden="true">✓</span> No account needed for Demo Mode</li>
            </ul>
          </div>
          <div className="projection-preview" aria-label="Illustrative projection preview">
            <div className="preview-topline">
              <span>Illustrative FIRE amount</span>
              <span className="mode-pill">Today’s dollars</span>
            </div>
            <strong>$1.24M</strong>
            <span className="preview-caption">Modeled FIRE year 2054 · age 60</span>
            <svg viewBox="0 0 520 230" role="img" aria-labelledby="preview-chart-title preview-chart-desc">
              <title id="preview-chart-title">Illustrative upward net worth projection</title>
              <desc id="preview-chart-desc">A fictional example rising over time. It is not a forecast or promise.</desc>
              <defs>
                <linearGradient id="preview-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1d6b45" stopOpacity="0.24" />
                  <stop offset="1" stopColor="#1d6b45" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="preview-area" d="M10 205 C90 190, 100 175, 160 165 S245 124, 300 118 S385 73, 430 58 S480 35, 510 18 L510 220 L10 220 Z" />
              <path className="preview-line" d="M10 205 C90 190, 100 175, 160 165 S245 124, 300 118 S385 73, 430 58 S480 35, 510 18" />
              <circle cx="300" cy="118" r="6" />
              <circle cx="510" cy="18" r="7" />
            </svg>
            <p>Fictional example only. The FIRE amount excludes property and is not a guarantee or safe-withdrawal recommendation.</p>
          </div>
        </section>

        <section className="landing-principles" aria-labelledby="principles-title">
          <div>
            <span className="eyebrow">Learn, then explore</span>
            <h2 id="principles-title">Bring the ideas from the guides into a plan.</h2>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Understand the basics</h3><p>Read plain-language guides on cash flow, investing, and financial independence before exploring the numbers.</p><a className="text-button" href="/articles.html">Browse the guide library →</a></article>
            <article><span>02</span><h3>Explore a fictional plan</h3><p>See how income, spending, savings, and debts fit together. Adjust the sample plan to learn how the projection responds.</p><button className="text-button" type="button" onClick={onTryDemo}>Open a sample plan →</button></article>
            <article><span>03</span><h3>Compare possible paths</h3><p>Change assumptions and compare scenarios. Inspect a modeled FIRE year and amount alongside the limits of the estimate.</p><a className="text-button" href="/fire.html">Read FIRE basics →</a></article>
          </div>
          <p className="landing-learning-note">Starting with spending? <a href="/guides/budgeting-without-rigidity.html">Read the budgeting guide</a>, or try the <a href="/cash-flow.html?edition=ca">cash-flow map</a>. The tools use separate inputs.</p>
        </section>

        <section className="account-section" id="account-access" aria-label="Account access">
          <div className="account-copy">
            <span className="eyebrow">Choose how to begin</span>
            <h2>{configured ? 'Explore a sample, or save a plan across devices.' : 'Start exploring with the fictional demo.'}</h2>
            <p>
              {configured
                ? 'Demo Mode uses fictional information for this browser session. An account lets you explicitly save your inputs and scenarios across devices.'
                : 'No sign-up is needed to try the planner. Demo Mode uses fictional information for this browser session. Account sign-in and cloud saving are not enabled in this preview.'}
            </p>
            <button className="button button-secondary" type="button" onClick={onTryDemo}>Open Demo Mode</button>
          </div>
          <AuthPanel />
        </section>

        <section className="planner-disclaimer" aria-label="Important disclaimer">
          <strong>Educational projections, not advice.</strong>
          <p>
            Accessible Finance Planner provides financial projections for informational and educational purposes only.
            It does not constitute financial, investment, tax, accounting, or legal advice.
          </p>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <div><a href="/articles.html">Guides</a><a href="/privacy.html">Privacy</a><a href="/disclaimer.html">Disclaimer</a><span>© 2026 Accessible Finance</span></div>
      </footer>
    </div>
  );
}
