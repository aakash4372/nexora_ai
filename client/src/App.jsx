import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Modal from './components/Modal';

// Pages
import AuthView from './pages/auth/AuthView';
import Onboarding from './pages/auth/Onboarding';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Automations from './pages/Automations';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import AIAssist from './pages/AIAssist';
import Team from './pages/Team';
import Integrations from './pages/Integrations';
import APIPage from './pages/APIPage';
import Billing from './pages/Billing';
import Settings from './pages/Settings';

const PAGE_MAP = {
  dashboard: Dashboard,
  inbox: Inbox,
  automations: Automations,
  contacts: Contacts,
  campaigns: Campaigns,
  analytics: Analytics,
  ai: AIAssist,
  team: Team,
  integrations: Integrations,
  api: APIPage,
  billing: Billing,
  settings: Settings,
};

function AppInner() {
  const { state, logout } = useApp();

  // Listen for 401 unauthorized events from axios interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('nexora:unauthorized', handler);
    return () => window.removeEventListener('nexora:unauthorized', handler);
  }, [logout]);

  // ── Auth ────────────────────────────────────
  if (!state.loggedIn) return <AuthView />;

  // ── Onboarding ──────────────────────────────
  if (!state.onboarded) return <Onboarding />;

  // ── App shell ───────────────────────────────
  const PageComponent = PAGE_MAP[state.page] || Dashboard;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '26px 28px 60px' }}>
          <PageComponent />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
      <ToastContainer />
      <Modal />
    </AppProvider>
  );
}
