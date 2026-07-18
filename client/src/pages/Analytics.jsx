import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

const CHANNELS = [
  { name: 'Instagram', msgs: 5210, pct: 41, color: '#E1306C' },
  { name: 'WhatsApp', msgs: 4180, pct: 33, color: '#25D366' },
  { name: 'Facebook', msgs: 2320, pct: 18, color: '#1877F2' },
  { name: 'Other', msgs: 1137, pct: 9, color: '#9398B3' },
];

const WEEKLY = [
  { day: 'Mon', h: 77 }, { day: 'Tue', h: 88 }, { day: 'Wed', h: 67 },
  { day: 'Thu', h: 100 }, { day: 'Fri', h: 95 }, { day: 'Sat', h: 46 }, { day: 'Sun', h: 43 },
];

export default function Analytics() {
  const { showToast } = useApp();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Analytics</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Performance insights across all channels.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', color: 'var(--text)', padding: '8px 14px', borderRadius: 999, fontSize: 13.5 }}>
            <option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option>
          </select>
          <button className="btn" onClick={() => showToast('Report exported', 'success')}><Icon name="download" /> Export</button>
        </div>
      </div>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Messages', val: '12,847', delta: '+18%', up: true, icon: 'inbox' },
          { label: 'AI Handled', val: '9,204', delta: '+24%', up: true, icon: 'ai' },
          { label: 'Avg Response Time', val: '1m 12s', delta: '-32%', up: true, icon: 'clock' },
          { label: 'CSAT Score', val: '94%', delta: '+2%', up: true, icon: 'sparkle' },
        ].map((s) => (
          <div key={s.label} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="stat-icon"><Icon name={s.icon} style={{ width: 18, height: 18, stroke: '#B9C6FF' }} /></div>
              <span className={`stat-delta ${s.up ? 'up' : 'down'}`}>{s.delta}</span>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
        {/* Weekly bar chart */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Weekly Message Volume</div>
          <div className="bars">
            {WEEKLY.map((b) => (
              <div key={b.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', height: '100%' }}>
                <div className="bar" style={{ height: `${b.h}%` }} />
              </div>
            ))}
          </div>
          <div className="bar-labels">{WEEKLY.map((b) => <span key={b.day}>{b.day}</span>)}</div>
        </div>

        {/* Channel breakdown */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Channel Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CHANNELS.map((c) => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13.5 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)' }}>{c.msgs.toLocaleString()} msgs · {c.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Performance */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>AI Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'Response Accuracy', val: 92, color: 'var(--success)' },
            { label: 'Escalation Rate', val: 8, color: 'var(--danger)' },
            { label: 'Avg Confidence', val: 88, color: 'var(--blue)' },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: m.color }}>{m.val}%</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{m.label}</div>
              <div style={{ marginTop: 8 }} className="progress-bar"><div style={{ width: `${m.val}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
