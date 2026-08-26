import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePlanner } from '../state/PlannerContext';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: '⌁' },
  { to: '/guide', label: 'Planning guide', icon: '?' },
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
  const menuButton = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(location.pathname);
  const cloudOffline = planner.mode === 'cloud' && planner.offline;
  const saveConflict = planner.saveState === 'conflict';

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButton.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    setMenuOpen(false);
    window.requestAnimationFrame(() => document.getElementById('planner-main')?.focus());
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen && compactNavigation) firstLink.current?.focus();
  }, [compactNavigation, menuOpen]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1000px)');
    const update = () => setCompactNavigation(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!compactNavigation) setMenuOpen(false);
  }, [compactNavigation]);

  useEffect(() => {
    if (!compactNavigation || !menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [compactNavigation, menuOpen]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== 'Tab' || !compactNavigation || !menuOpen) return;

    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getAttribute('aria-hidden') !== 'true');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable.at(-1)!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
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

  const discardConflictedDraft = () => {
    if (!window.confirm('Discard this unsaved local draft and reload the latest cloud copy? Export the draft first if you may need it. This cannot be undone.')) return;
    planner.discardAndReloadCloud();
  };

  return (
    <div className={`app-shell${compactNavigation && menuOpen ? ' menu-open' : ''}`}>
      <a className="skip-link" href="#planner-main">Skip to planner content</a>
      <header className="app-header">
        <Link className="brand" to="/dashboard" aria-label="Accessible Finance Planner dashboard" tabIndex={compactNavigation && menuOpen ? -1 : undefined}>
          <img src="/Logo-256.png" alt="" width="40" height="40" />
          <span>Accessible Finance <small>Planner</small></span>
        </Link>
        <div className="header-actions">
          <span className={`mode-badge ${cloudOffline ? 'offline' : planner.mode}`}>
            <span aria-hidden="true" />{planner.mode === 'demo' ? 'Demo Mode' : cloudOffline ? 'Offline · Local Draft' : 'Cloud Plan'}
          </span>
          <button
            className="button button-primary save-button"
            type="button"
            onClick={() => void planner.save()}
            disabled={!planner.dirty || planner.saveState === 'saving' || saveConflict}
            tabIndex={compactNavigation && menuOpen ? -1 : undefined}
          >
            {planner.saveState === 'saving' ? 'Saving…' : saveConflict ? 'Resolve conflict' : planner.dirty ? 'Save changes' : 'Saved'}
          </button>
          <button
            id="planner-menu-button"
            ref={menuButton}
            className="planner-menu-button"
            type="button"
            aria-label={menuOpen ? 'Close planner menu' : 'Open planner menu'}
            aria-expanded={menuOpen}
            aria-controls="planner-sidebar"
            onClick={() => menuOpen ? closeMenu() : setMenuOpen(true)}
          >
            <span className="planner-menu-label" aria-hidden="true">{menuOpen ? 'Close' : 'Menu'}</span>
            <span className="planner-menu-lines" aria-hidden="true"><span /><span /><span /></span>
          </button>
        </div>
      </header>

      <div className="app-body">
        {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Close planner menu" onClick={() => closeMenu(true)} />}
        <aside
          className={`app-sidebar${menuOpen ? ' open' : ''}`}
          id="planner-sidebar"
          aria-label="Planner navigation and account"
          aria-hidden={compactNavigation && !menuOpen ? true : undefined}
          aria-modal={compactNavigation && menuOpen ? true : undefined}
          role={compactNavigation && menuOpen ? 'dialog' : undefined}
          inert={compactNavigation && !menuOpen ? true : undefined}
          onKeyDown={handleMenuKeyDown}
        >
          <button className="sidebar-close-button" type="button" aria-label="Close planner menu" onClick={() => closeMenu(true)}>
            <span aria-hidden="true">×</span>
          </button>
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

        <div className="app-content" inert={compactNavigation && menuOpen ? true : undefined}>
          {cloudOffline && !saveConflict && (
            <div className="connection-banner" role="status">
              <strong>You’re offline.</strong>
              <span>Your cloud plan cannot sync, but changes remain open on this page.</span>
            </div>
          )}
          {saveConflict && (
            <section className="conflict-banner" role="alert" aria-labelledby="save-conflict-title">
              <div><strong id="save-conflict-title">Cloud plan changed elsewhere.</strong><span>This local draft is still open and has not been overwritten.</span></div>
              <div className="conflict-actions">
                <Link className="text-button" to="/settings">Export draft in Settings</Link>
                <button className="text-button danger" type="button" onClick={discardConflictedDraft}>Discard draft and reload</button>
              </div>
            </section>
          )}
          {planner.mode === 'demo' && (
            <div className="demo-banner" role="status">
              <strong>Demo Mode</strong>
              <span>Starts with fictional values. Use fictional data only; nothing uploads to Supabase.</span>
            </div>
          )}
          {!saveConflict && <div className={`save-announcement ${planner.saveState}`} role={planner.saveState === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true">
            {planner.saveMessage}
          </div>}
          <main id="planner-main" tabIndex={-1}>
            <Outlet />
          </main>
          <footer className="app-footer">
            <p>Educational estimates only — not financial, investment, tax, accounting, or legal advice.</p>
            <div><Link to="/guide">Planning guide</Link><a href="/privacy.html">Privacy</a><a href="/disclaimer.html">Full disclaimer</a></div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export function PlannerLoading() {
  return (
    <main className="centered-page planner-loading-page" aria-busy="true" aria-labelledby="planner-loading-title">
      <section className="loading-card" role="status" aria-live="polite">
        <div className="loading-brand" aria-hidden="true">
          <img src="/Logo-256.png" alt="" width="42" height="42" />
          <span>Accessible Finance <small>Planner</small></span>
        </div>
        <div className="loading-mark" aria-hidden="true" />
        <h1 id="planner-loading-title">Opening your plan…</h1>
        <p>Loading your saved inputs. Projections will run on this device.</p>
        <div className="loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </section>
    </main>
  );
}

export function PlannerRouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-mark" aria-hidden="true" />
      <div>
        <strong>Loading this section…</strong>
        <span>Your plan stays open while this page is prepared.</span>
      </div>
    </div>
  );
}
