import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppShell, PlannerLoading, PlannerRouteLoading } from './components/AppShell';
import { usePlanner } from './state/PlannerContext';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const GuidePage = lazy(() => import('./pages/GuidePage').then((module) => ({ default: module.GuidePage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const RetirementPage = lazy(() => import('./pages/RetirementPage').then((module) => ({ default: module.RetirementPage })));
const ScenariosPage = lazy(() => import('./pages/ScenariosPage').then((module) => ({ default: module.ScenariosPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const IncomePage = lazy(() => import('./pages/CollectionPages').then((module) => ({ default: module.IncomePage })));
const ExpensesPage = lazy(() => import('./pages/CollectionPages').then((module) => ({ default: module.ExpensesPage })));
const AssetsPage = lazy(() => import('./pages/CollectionPages').then((module) => ({ default: module.AssetsPage })));
const DebtsPage = lazy(() => import('./pages/CollectionPages').then((module) => ({ default: module.DebtsPage })));

function PlannerUnavailable() {
  const planner = usePlanner();
  const auth = useAuth();
  return (
    <main className="centered-page">
      <section className="standalone-card" aria-labelledby="load-error-title">
        <span className="eyebrow">Cloud plan unavailable</span>
        <h1 id="load-error-title">Your plan was not opened.</h1>
        <p>{planner.loadError ?? 'The cloud plan is unavailable. No data was changed.'}</p>
        <div className="form-actions">
          <button className="button button-primary" type="button" onClick={planner.retryCloudLoad}>Try again</button>
          <button className="button button-secondary" type="button" onClick={() => void auth.signOut()}>Sign out</button>
        </div>
      </section>
    </main>
  );
}

function PlannerGate() {
  const planner = usePlanner();
  if (!planner.mode) return <Navigate to="/" replace />;
  if (planner.loading) return <PlannerLoading />;
  if (!planner.snapshot) return <PlannerUnavailable />;
  if (planner.onboardingRequired) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function StartRoute() {
  const planner = usePlanner();
  if (!planner.mode) return <LandingPage onTryDemo={planner.startDemo} />;
  if (planner.loading) return <PlannerLoading />;
  return <Navigate to={planner.onboardingRequired ? '/onboarding' : '/dashboard'} replace />;
}

function OnboardingRoute() {
  const planner = usePlanner();
  if (!planner.mode) return <Navigate to="/" replace />;
  if (planner.loading) return <PlannerLoading />;
  if (!planner.snapshot) return <PlannerUnavailable />;
  if (!planner.onboardingRequired) return <Navigate to="/dashboard" replace />;
  return <OnboardingPage />;
}

export function App() {
  const auth = useAuth();
  const { clearRecoveryMode } = auth;
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/reset-password') clearRecoveryMode();
  }, [clearRecoveryMode, location.pathname]);

  if (!auth.ready) return <PlannerLoading />;

  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<PlannerLoading />}><StartRoute /></Suspense>} />
      <Route path="/reset-password" element={<Suspense fallback={<PlannerLoading />}><ResetPasswordPage /></Suspense>} />
      <Route path="/onboarding" element={<Suspense fallback={<PlannerLoading />}><OnboardingRoute /></Suspense>} />
      <Route element={<PlannerGate />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Suspense fallback={<PlannerRouteLoading />}><DashboardPage /></Suspense>} />
          <Route path="/guide" element={<Suspense fallback={<PlannerRouteLoading />}><GuidePage /></Suspense>} />
          <Route path="/income" element={<Suspense fallback={<PlannerRouteLoading />}><IncomePage /></Suspense>} />
          <Route path="/expenses" element={<Suspense fallback={<PlannerRouteLoading />}><ExpensesPage /></Suspense>} />
          <Route path="/assets" element={<Suspense fallback={<PlannerRouteLoading />}><AssetsPage /></Suspense>} />
          <Route path="/debts" element={<Suspense fallback={<PlannerRouteLoading />}><DebtsPage /></Suspense>} />
          <Route path="/retirement" element={<Suspense fallback={<PlannerRouteLoading />}><RetirementPage /></Suspense>} />
          <Route path="/scenarios" element={<Suspense fallback={<PlannerRouteLoading />}><ScenariosPage /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<PlannerRouteLoading />}><SettingsPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PlannerRouteLoading />}><SettingsPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
