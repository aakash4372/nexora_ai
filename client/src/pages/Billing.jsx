import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

const PLANS = [
  {
    name: 'Starter', price: '$29', period: '/mo', current: false,
    features: ['3 channels', '2 team members', '5 automations', '10k messages/mo', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro', price: '$79', period: '/mo', current: true,
    features: ['All channels', '10 team members', 'Unlimited automations', '100k messages/mo', 'Advanced analytics', 'AI Assist included', 'Priority support', 'Custom webhooks'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', current: false,
    features: ['Unlimited everything', 'Dedicated account manager', 'SLA guarantee', 'Custom AI training', 'SSO / SAML', 'On-premise option'],
  },
];

const INVOICES = [
  { id: '#1042', date: 'Jul 1, 2026', amount: '$79.00', status: 'Paid' },
  { id: '#1031', date: 'Jun 1, 2026', amount: '$79.00', status: 'Paid' },
  { id: '#1020', date: 'May 1, 2026', amount: '$79.00', status: 'Paid' },
];

export default function Billing() {
  const { state, showToast } = useApp();

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, marginBottom: 4 }}>Billing</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Manage your plan and billing history.</p>
      </div>

      {/* Current plan badge */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="zap" style={{ stroke: '#fff' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Pro Plan</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>$79/mo · Renews Aug 1, 2026</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => showToast('Opening portal…')}>Manage payment</button>
          <button className="btn btn-danger" onClick={() => showToast('Contact support to cancel')}>Cancel plan</button>
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="card"
            style={{
              borderColor: plan.current ? 'var(--blue)' : 'var(--glass-brd)',
              boxShadow: plan.current ? '0 0 0 2px rgba(91,124,250,0.25)' : 'none',
              position: 'relative',
            }}
          >
            {plan.current && (
              <span className="badge badge-blue" style={{ position: 'absolute', top: 16, right: 16 }}>Current</span>
            )}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, margin: '10px 0' }}>
              {plan.price}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{plan.period}</span>
            </div>
            <ul className="check-list" style={{ listStyle: 'none', fontSize: 13, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="check" style={{ width: 15, height: 15, stroke: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`btn ${plan.current ? 'btn-ghost' : 'btn-primary'}`}
              style={{ width: '100%' }}
              onClick={() => showToast(plan.current ? 'Already on Pro' : plan.name === 'Enterprise' ? 'Contact sales' : `Upgraded to ${plan.name}`, 'success')}
              disabled={plan.current}
            >
              {plan.current ? 'Current plan' : plan.name === 'Enterprise' ? 'Contact sales' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Invoice history */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Invoice History</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id} className="row-btn">
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{inv.id}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{inv.date}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td><span className="badge badge-green">{inv.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-ghost" onClick={() => showToast('Invoice downloaded', 'success')}>
                      <Icon name="download" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
