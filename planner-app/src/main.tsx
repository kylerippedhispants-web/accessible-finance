import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './auth/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlannerProvider } from './state/PlannerContext';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Planner root element is missing.');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/planner">
        <AuthProvider>
          <PlannerProvider>
            <App />
          </PlannerProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
