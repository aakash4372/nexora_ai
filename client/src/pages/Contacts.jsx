import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { ModalHead } from '../components/Modal';

export default function Contacts() {
  const { state, dispatch, showToast, openModal, closeModal } = useApp();
  const [search, setSearch] = useState('');

  const filtered = state.contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAddModal() {
    openModal(
      <div>
        <ModalHead title="Add Contact" />
        <div className="field"><label>Full name</label><input id="c-name" type="text" placeholder="e.g. Arjun Malhotra" /></div>
        <div className="field-row">
          <div className="field">
            <label>Email</label><input id="c-email" type="email" placeholder="arjun@example.com" />
          </div>
          <div className="field">
            <label>Phone</label><input id="c-phone" type="tel" placeholder="+91 98765 43210" />
          </div>
        </div>
        <div className="field">
          <label>Channel</label>
          <select id="c-channel"><option>Instagram</option><option>WhatsApp</option><option>Facebook</option><option>Manual</option></select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
            const name = document.getElementById('c-name').value.trim();
            const email = document.getElementById('c-email').value.trim();
            if (!name || !email) return showToast('Name and email are required', 'error');
            dispatch({ type: 'ADD_CONTACT', payload: { id: Date.now(), name, email, phone: document.getElementById('c-phone').value, channel: document.getElementById('c-channel').value, score: Math.floor(Math.random() * 60 + 30), tags: [] } });
            showToast('Contact added', 'success');
            closeModal();
          }}>Add Contact</button>
        </div>
      </div>
    );
  }

  const CHAN_BADGE = { Instagram: 'badge-purple', WhatsApp: 'badge-green', Facebook: 'badge-blue', Manual: 'badge-gray' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Contacts</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{state.contacts.length} contacts across all channels.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => showToast('CSV import coming soon')}><Icon name="upload" /> Import CSV</button>
          <button className="btn" onClick={() => showToast('Contacts exported', 'success')}><Icon name="download" /> Export</button>
          <button className="btn btn-primary" onClick={openAddModal}><Icon name="plus" /> Add Contact</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', marginBottom: 16, maxWidth: 380 }}>
        <Icon name="search" style={{ color: 'var(--muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14, width: '100%' }} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Channel</th><th>Email</th><th>Phone</th><th>Score</th><th>Tags</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="row-btn">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar-md" style={{ width: 32, height: 32, fontSize: 11 }}>{c.name.split(' ').map(w => w[0]).join('')}</div>
                      <span style={{ fontWeight: 700 }}>{c.name}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${CHAN_BADGE[c.channel] || 'badge-gray'}`}>{c.channel}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{c.email}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }}>{c.phone}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.score}%`, background: c.score > 70 ? 'var(--success)' : c.score > 40 ? 'var(--warn)' : 'var(--danger)', borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.score}</span>
                    </div>
                  </td>
                  <td>
                    {c.tags.map((t) => <span key={t} className="tag-chip">{t}</span>)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => showToast(`Editing ${c.name}`)}><Icon name="edit" /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'DELETE_CONTACT', id: c.id }); showToast('Contact deleted'); }}>
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No contacts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
