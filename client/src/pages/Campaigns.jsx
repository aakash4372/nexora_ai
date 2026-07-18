import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { ModalHead } from '../components/Modal';

const STATUS_BADGE = { Scheduled: 'badge-blue', Completed: 'badge-green', Draft: 'badge-gray', Sending: 'badge-orange' };

export default function Campaigns() {
  const { state, dispatch, showToast, openModal, closeModal } = useApp();

  function openCreateModal() {
    openModal(
      <div>
        <ModalHead title="New Campaign" />
        <div className="field"><label>Campaign name</label><input id="camp-name" type="text" placeholder="e.g. Summer Sale Blast" /></div>
        <div className="field">
          <label>Audience</label>
          <select id="camp-audience">
            <option>All Contacts</option><option>VIP Tag</option><option>Lead Tag</option><option>Cart Segment</option><option>Instagram</option><option>WhatsApp</option>
          </select>
        </div>
        <div className="field"><label>Message</label><textarea id="camp-msg" rows={3} placeholder="Write your broadcast message…" style={{ resize: 'vertical' }} /></div>
        <div className="field"><label>Schedule date</label><input id="camp-date" type="date" /></div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
            const name = document.getElementById('camp-name').value.trim();
            if (!name) return showToast('Enter a campaign name', 'error');
            const date = document.getElementById('camp-date').value;
            dispatch({ type: 'ADD_CAMPAIGN', payload: { id: Date.now(), name, audience: document.getElementById('camp-audience').value, status: date ? 'Scheduled' : 'Draft', date: date || '—', sent: 0 } });
            showToast('Campaign created', 'success');
            closeModal();
          }}>Create Campaign</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Campaigns</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Send broadcast messages to your audience segments.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}><Icon name="plus" /> New Campaign</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Campaigns', val: state.campaigns.length, icon: 'campaigns', color: 'var(--blue)' },
          { label: 'Messages Sent', val: state.campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString(), icon: 'send', color: 'var(--success)' },
          { label: 'Scheduled', val: state.campaigns.filter(c => c.status === 'Scheduled').length, icon: 'clock', color: 'var(--warn)' },
        ].map((s) => (
          <div key={s.label} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="stat-icon"><Icon name={s.icon} style={{ width: 18, height: 18, stroke: '#B9C6FF' }} /></div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.val}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Campaign</th><th>Audience</th><th>Status</th><th>Date</th><th>Sent</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {state.campaigns.map((c) => (
                <tr key={c.id} className="row-btn">
                  <td><span style={{ fontWeight: 700 }}>{c.name}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{c.audience}</td>
                  <td><span className={`badge ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{c.date}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.sent.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.status === 'Draft' && (
                        <button className="btn btn-sm btn-primary" onClick={() => { showToast(`${c.name} scheduled`, 'success'); }}>Schedule</button>
                      )}
                      <button className="btn btn-sm btn-ghost" onClick={() => showToast(`Editing ${c.name}`)}><Icon name="edit" /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'DELETE_CAMPAIGN', id: c.id }); showToast('Campaign deleted'); }}>
                        <Icon name="trash" />
                      </button>
                    </div>
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
