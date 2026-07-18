import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

const STATS = [
  { label: 'Total Messages', val: '12,847', delta: '+18%', up: true, icon: 'inbox' },
  { label: 'AI Handled', val: '9,204', delta: '+24%', up: true, icon: 'ai' },
  { label: 'Avg Response', val: '1m 12s', delta: '-32%', up: true, icon: 'clock' },
  { label: 'CSAT Score', val: '94%', delta: '+2%', up: true, icon: 'sparkle' },
];

const BAR_DATA = [
  { day: 'Mon', h: 75 }, { day: 'Tue', h: 85 }, { day: 'Wed', h: 60 },
  { day: 'Thu', h: 100 }, { day: 'Fri', h: 92 }, { day: 'Sat', h: 45 }, { day: 'Sun', h: 40 },
];

const RECENT_ACTIVITY = [
  { icon: 'ai', text: 'AI replied to Riya Kapoor about Spring Drop', time: '2m ago', color: '#A855F7' },
  { icon: 'automation', text: '"Welcome DM Flow" triggered 12 times', time: '18m ago', color: '#5B7CFA' },
  { icon: 'contacts', text: 'New contact: Devansh Rao from Instagram', time: '1h ago', color: '#2ED598' },
  { icon: 'campaigns', text: '"Spring Drop Launch" scheduled for Jul 22', time: '3h ago', color: '#F5A623' },
  { icon: 'ai', text: 'AI escalated Neha Verma to Priya', time: '5h ago', color: '#FB6B6B' },
];

export default function Dashboard() {
  const { state, goPage, showToast } = useApp();

  const unread = state.conversations.reduce((a, c) => a + c.unread, 0);
  const liveAutos = state.automations.filter((a) => a.status === 'Live').length;

  return (
    <div>
      {/* Page head */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Good morning, {state.user.name.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Here's what's happening across your channels today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => goPage('analytics')}><Icon name="analytics" /> View analytics</button>
          <button className="btn btn-primary" onClick={() => goPage('inbox')}><Icon name="inbox" /> Open inbox</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map((s) => (
          <div key={s.label} className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="stat-icon"><Icon name={s.icon} style={{ width: 18, height: 18, stroke: '#B9C6FF' }} /></div>
              <span className={`stat-delta ${s.up ? 'up' : 'down'}`}>{s.delta}</span>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2: chart + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Message Volume</span>
            <select style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12.5, cursor: 'pointer' }}>
              <option>Last 7 days</option><option>Last 30 days</option>
            </select>
          </div>
          <div className="bars">
            {BAR_DATA.map((b) => (
              <div key={b.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', height: '100%' }}>
                <div className="bar" style={{ height: `${b.h}%` }} title={`${b.day}: ${Math.round(b.h * 18)}msgs`} />
              </div>
            ))}
          </div>
          <div className="bar-labels">
            {BAR_DATA.map((b) => <span key={b.day}>{b.day}</span>)}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={item.icon} style={{ width: 14, height: 14, stroke: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: conversations + quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
        {/* Recent conversations */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Recent Conversations</span>
            <button className="btn btn-sm" onClick={() => goPage('inbox')}>View all</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contact</th><th>Channel</th><th>Last Message</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {state.conversations.slice(0, 4).map((c) => (
                  <tr key={c.id} className="row-btn" onClick={() => goPage('inbox')}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar-md" style={{ width: 30, height: 30, fontSize: 11 }}>{c.name.split(' ').map(w => w[0]).join('')}</div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.channel === 'instagram' ? 'purple' : c.channel === 'whatsapp' ? 'green' : 'blue'}`} style={{ textTransform: 'capitalize' }}>
                        {c.channel}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last}</td>
                    <td>
                      {c.unread > 0
                        ? <span className="badge badge-red">{c.unread} new</span>
                        : <span className="badge badge-gray">Read</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); goPage('inbox'); }}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 200 }}>
          {[
            { label: 'Unread Messages', val: unread, color: 'var(--danger)', icon: 'inbox' },
            { label: 'Live Automations', val: liveAutos, color: 'var(--success)', icon: 'automation' },
            { label: 'Contacts', val: state.contacts.length, color: 'var(--blue)', icon: 'contacts' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
