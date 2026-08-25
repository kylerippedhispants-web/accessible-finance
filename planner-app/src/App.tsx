import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppShell, PlannerLoading } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { IncomePage, ExpensesPage, AssetsPage, DebtsPage } from './pages/CollectionPages';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RetirementPage } from './pages/RetirementPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { SettingsPage } from './pages/SettingsPage';
import { usePlanner } from './state/PlannerContext';

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
  if (!auth.ready) return <PlannerLoading />;

  return (
    <Routes>
      <Route path="/" element={<StartRoute />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route element={<PlannerGate />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/retirement" element={<RetirementPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/profile" element={<SettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
