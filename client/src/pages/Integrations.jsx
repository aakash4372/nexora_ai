import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

export default function Integrations() {
  const { state, dispatch, showToast, goPage } = useApp();

  function toggle(id) {
    if (id === 'instagram') {
      goPage('instagram');
      return;
    }
    const integration = state.integrations.find((i) => i.id === id);
    dispatch({ type: 'TOGGLE_INTEGRATION', id });
    showToast(integration.connected ? `${integration.name} disconnected` : `${integration.name} connected`, 'success');
  }

  const connected = state.integrations.filter((i) => i.connected);
  const available = state.integrations.filter((i) => !i.connected);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Integrations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{connected.length} of {state.integrations.length} integrations connected.</p>
        </div>
        <button className="btn" onClick={() => showToast('Browse marketplace coming soon')}><Icon name="globe" /> Browse Marketplace</button>
      </div>

      {/* Connected */}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Connected</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {connected.map((intg) => (
          <IntegrationCard key={intg.id} intg={intg} onToggle={toggle} />
        ))}
      </div>

      {/* Available */}
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Available</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {available.map((intg) => (
          <IntegrationCard key={intg.id} intg={intg} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ intg, onToggle }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="integration-logo" style={{ background: `${intg.color}20`, color: intg.color }}>
          {intg.name.slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{intg.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{intg.desc}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={`badge ${intg.connected ? 'badge-green' : 'badge-gray'}`}>
          {intg.connected ? 'Connected' : 'Not connected'}
        </span>
        <button
          className={`btn btn-sm ${intg.connected ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => onToggle(intg.id)}
        >
          {intg.connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
