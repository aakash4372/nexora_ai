import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { authAPI } from './lib/api';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Layout
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Modal from './components/Modal';

import AuthView from './pages/auth/AuthView';
import Onboarding from './pages/auth/Onboarding';
import AccountsSelector from './pages/auth/AccountsSelector';
import Dashboard from './pages/Dashboard';
import Inbox from './pages/Inbox';
import Automations from './pages/Automations';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';
import AIAssist from './pages/AIAssist';
import Team from './pages/Team';
import Integrations from './pages/Integrations';
import InstagramIntegration from './pages/InstagramIntegration';
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
  instagram: InstagramIntegration,
  api: APIPage,
  billing: Billing,
  settings: Settings,
};

function AppInner() {
  const { state, logout, login } = useApp();

  // Auto-login on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('nexora_token');
    if (token) {
      authAPI.me()
        .then((res) => {
          login({ token, user: res.data.user });
        })
        .catch(() => {
          logout();
        });
    }
  }, [login, logout]);

  // Listen for 401 unauthorized events from axios interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('nexora:unauthorized', handler);
    return () => window.removeEventListener('nexora:unauthorized', handler);
  }, [logout]);

  // ── Auth ────────────────────────────────────
  if (!state.loggedIn) return <AuthView />;

  // ── Accounts Selector ───────────────────────
  if (!state.activeAccount) return <AccountsSelector />;

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProvider>
        <AppInner />
        <ToastContainer />
        <Modal />
      </AppProvider>
    </GoogleOAuthProvider>
  );
}
