import { AuthPanel } from '../auth/AuthPanel';
import { Brand } from '../components/Brand';

interface LandingPageProps {
  onTryDemo: () => void;
}

export function LandingPage({ onTryDemo }: LandingPageProps) {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-nav">
        <Brand />
        <a className="back-link" href="/">Back to the main site</a>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="landing-hero">
          <div className="landing-copy">
            <span className="eyebrow">Accessible Finance Planner</span>
            <h1>See where your money is going — and where it <em>could take you.</em></h1>
            <p className="landing-lead">
              Bring income, spending, assets, debt, and retirement goals into one calm Canadian planning view.
              Change an assumption and see the projection update immediately.
            </p>
            <div className="landing-actions">
              <button className="button button-primary" type="button" onClick={onTryDemo}>Try the fictional demo</button>
              <a className="button button-secondary" href="#account-access">Save across devices</a>
            </div>
            <ul className="trust-list" aria-label="Planner highlights">
              <li><span aria-hidden="true">✓</span> Calculations run in your browser</li>
              <li><span aria-hidden="true">✓</span> Demo data stays in this browser session</li>
              <li><span aria-hidden="true">✓</span> Optional Supabase cloud sync</li>
            </ul>
          </div>
          <div className="projection-preview" aria-label="Illustrative projection preview">
            <div className="preview-topline">
              <span>Illustrative net worth</span>
              <span className="mode-pill">Today’s dollars</span>
            </div>
            <strong>$1.24M</strong>
            <span className="preview-caption">Projected at age 60</span>
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
            <p>Fictional example only. Your projection depends entirely on the inputs and assumptions you choose.</p>
          </div>
        </section>

        <section className="landing-principles" aria-labelledby="principles-title">
          <div>
            <span className="eyebrow">Built for clarity</span>
            <h2 id="principles-title">A plan you can inspect, adjust, and take with you.</h2>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Inputs in the cloud</h3><p>Signed-in plans use relational tables protected by row-level security.</p></article>
            <article><span>02</span><h3>Math on your device</h3><p>Projections do not call a server every time a slider moves.</p></article>
            <article><span>03</span><h3>Mobile-ready foundation</h3><p>The same serializable plan and TypeScript engine can move into Expo later.</p></article>
          </div>
        </section>

        <section className="account-section" id="account-access" aria-label="Account access">
          <div className="account-copy">
            <span className="eyebrow">Choose how to begin</span>
            <h2>Explore privately, or keep one plan across devices.</h2>
            <p>
              Demo Mode uses fictional information and session storage only. A cloud-saved plan requires an account and
              uses Supabase as the source of truth.
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
        <div><a href="/privacy.html">Privacy</a><a href="/disclaimer.html">Disclaimer</a><span>© 2026 Accessible Finance</span></div>
      </footer>
    </div>
  );
}
