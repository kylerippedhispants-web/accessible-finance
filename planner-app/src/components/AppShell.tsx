import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePlanner } from '../state/PlannerContext';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌁' },
  { to: '/income', label: 'Income', icon: '↗' },
  { to: '/expenses', label: 'Expenses', icon: '↙' },
  { to: '/assets', label: 'Assets', icon: '◇' },
  { to: '/debts', label: 'Debts', icon: '−' },
  { to: '/retirement', label: 'Retirement', icon: '◎' },
  { to: '/scenarios', label: 'Scenarios', icon: '⑂' },
  { to: '/settings', label: 'Profile & settings', icon: '○' },
] as const;

export function AppShell() {
  const auth = useAuth();
  const planner = usePlanner();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactNavigation, setCompactNavigation] = useState(
    () => window.matchMedia('(max-width: 1000px)').matches,
  );
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) firstLink.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1000px)');
    const update = () => setCompactNavigation(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      document.getElementById('planner-menu-button')?.focus();
    }
  };

  const leavePlanner = async () => {
    if (planner.dirty && !window.confirm('Leave without saving your planner changes?')) return;
    if (planner.mode === 'demo') {
      if (!window.confirm('Exit Demo Mode and remove its fictional session data?')) return;
      planner.exitDemo();
      return;
    }
    const result = await auth.signOut();
    if (result.error) {
      window.alert(`This browser attempted to sign out, but Supabase could not confirm global session revocation: ${result.error}`);
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#planner-main">Skip to planner content</a>
      <header className="app-header">
        <Link className="brand" to="/dashboard" aria-label="Accessible Finance Planner dashboard">
          <img src="/Logo-256.png" alt="" width="40" height="40" />
          <span>Accessible Finance <small>Planner</small></span>
        </Link>
        <div className="header-actions">
          <span className={`mode-badge ${planner.mode}`}>
            <span aria-hidden="true" />{planner.mode === 'demo' ? 'Demo Mode' : 'Cloud Saved Plan'}
          </span>
          <button
            className="button button-primary save-button"
            type="button"
            onClick={() => void planner.save()}
            disabled={!planner.dirty || planner.saveState === 'saving'}
          >
            {planner.saveState === 'saving' ? 'Saving…' : planner.dirty ? 'Save changes' : 'Saved'}
          </button>
          <button
            id="planner-menu-button"
            className="planner-menu-button"
            type="button"
            aria-label={menuOpen ? 'Close planner menu' : 'Open planner menu'}
            aria-expanded={menuOpen}
            aria-controls="planner-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className="app-body">
        {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Close planner menu" onClick={() => setMenuOpen(false)} />}
        <aside
          className={`app-sidebar${menuOpen ? ' open' : ''}`}
          id="planner-sidebar"
          aria-label="Planner navigation and account"
          aria-hidden={compactNavigation && !menuOpen ? true : undefined}
          inert={compactNavigation && !menuOpen ? true : undefined}
          onKeyDown={handleMenuKeyDown}
        >
          <nav aria-label="Planner sections">
            {navigation.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                ref={index === 0 ? firstLink : undefined}
                className={({ isActive }) => isActive ? 'active' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <p>{planner.mode === 'demo' ? 'Session-only demo data' : auth.user?.email}</p>
            <button className="text-button" type="button" onClick={() => void leavePlanner()}>
              {planner.mode === 'demo' ? 'Exit Demo Mode' : 'Sign out'}
            </button>
            <a href="/" className="text-button">Main Accessible Finance site</a>
          </div>
        </aside>

        <div className="app-content">
          {planner.mode === 'demo' && (
            <div className="demo-banner" role="status">
              <strong>Demo Mode</strong>
              <span>Starts with fictional values. Use fictional data only; nothing uploads to Supabase.</span>
            </div>
          )}
          <div className={`save-announcement ${planner.saveState}`} aria-live="polite" aria-atomic="true">
            {planner.saveMessage}
          </div>
          <main id="planner-main" tabIndex={-1}>
            <Outlet />
          </main>
          <footer className="app-footer">
            <p>Educational estimates only — not financial, investment, tax, accounting, or legal advice.</p>
            <div><a href="/privacy.html">Privacy</a><a href="/disclaimer.html">Full disclaimer</a></div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function PlannerLoading() {
  return (
    <main className="centered-page" aria-busy="true">
      <div className="loading-mark" aria-hidden="true" />
      <h1>Opening your plan…</h1>
      <p>Loading inputs securely. Projections will run on this device.</p>
    </main>
  );
}
