import { useApp } from '../context/AppContext';
import Icon from './Icon';

const NAV = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'inbox', icon: 'inbox', label: 'Inbox', badge: 3 },
  { id: 'contacts', icon: 'contacts', label: 'Contacts' },
  { id: 'campaigns', icon: 'campaigns', label: 'Campaigns' },
  { id: 'automations', icon: 'automation', label: 'Automations' },
  { id: 'analytics', icon: 'analytics', label: 'Analytics' },
  { id: 'ai', icon: 'ai', label: 'AI Assist' },
];

const BOTTOM_NAV = [
  { id: 'team', icon: 'team', label: 'Team' },
  { id: 'integrations', icon: 'integrations', label: 'Integrations' },
  { id: 'api', icon: 'api', label: 'API' },
  { id: 'billing', icon: 'billing', label: 'Billing' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

export default function Sidebar() {
  const { state, goPage } = useApp();
  const collapsed = state.sidebarCollapsed;

  const NavItem = ({ item }) => {
    const active = state.page === item.id;
    return (
      <div
        onClick={() => goPage(item.id)}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px',
          borderRadius: 11, cursor: 'pointer', marginBottom: 2,
          color: active ? '#DCE3FF' : 'var(--muted)',
          background: active ? 'var(--grad-soft)' : 'transparent',
          boxShadow: active ? 'inset 0 0 0 1px rgba(91,124,250,0.3)' : 'none',
          fontWeight: 600, fontSize: 13.8,
          transition: 'all 0.12s',
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; } }}
      >
        <Icon name={item.icon} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            {item.badge && (
              <span style={{
                fontSize: 10.5, padding: '1px 7px', borderRadius: 999,
                background: 'rgba(91,124,250,0.25)', color: '#B9C6FF', fontWeight: 700,
              }}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  const SectionLabel = ({ label }) =>
    !collapsed ? (
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--muted-2)', margin: '16px 10px 6px', fontWeight: 700,
      }}>
        {label}
      </div>
    ) : <div style={{ height: 16 }} />;

  return (
    <div
      style={{
        width: collapsed ? 70 : 230,
        flexShrink: 0,
        borderRight: '1px solid var(--glass-brd)',
        minHeight: 'calc(100vh - 60px)',
        padding: '16px 12px',
        position: 'sticky',
        top: 60,
        transition: 'width 0.18s ease',
        overflow: 'hidden',
      }}
    >
      <SectionLabel label="Workspace" />
      {NAV.map((item) => <NavItem key={item.id} item={item} />)}

      <SectionLabel label="Admin" />
      {BOTTOM_NAV.map((item) => <NavItem key={item.id} item={item} />)}
    </div>
  );
}
