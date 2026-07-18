import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { ModalHead } from '../components/Modal';

export default function APIPage() {
  const { state, dispatch, showToast, openModal, closeModal } = useApp();
  const [copied, setCopied] = useState(null);

  function copyKey(key) {
    navigator.clipboard.writeText(key).catch(() => {});
    setCopied(key);
    showToast('API key copied to clipboard', 'success');
    setTimeout(() => setCopied(null), 2000);
  }

  function openCreateKeyModal() {
    openModal(
      <div>
        <ModalHead title="Create API Key" />
        <div className="field"><label>Key name</label><input id="key-name" type="text" placeholder="e.g. Production, Staging, Mobile App" /></div>
        <div className="field">
          <label>Permissions</label>
          <select id="key-perms">
            <option>Full access</option><option>Read only</option><option>Conversations only</option>
          </select>
        </div>
        <div className="section-note">The key will only be shown once. Store it securely.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
            const name = document.getElementById('key-name').value.trim();
            if (!name) return showToast('Enter a key name', 'error');
            const key = `nx_live_${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`;
            dispatch({ type: 'ADD_API_KEY', payload: { id: Date.now(), name, key, created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } });
            showToast('API key created', 'success');
            closeModal();
          }}>Create Key</button>
        </div>
      </div>
    );
  }

  const EXAMPLE_CODE = `import axios from 'axios';

const nexora = axios.create({
  baseURL: 'https://api.nexoralabs.io/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});

// List conversations
const { data } = await nexora.get('/conversations');

// Send a message
await nexora.post('/conversations/1/messages', {
  text: 'Hello from the API!',
});`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>API Access</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Integrate Nexora into your own apps and workflows.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateKeyModal}><Icon name="plus" /> Create API Key</button>
      </div>

      {/* Keys table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>API Keys</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Key</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {state.apiKeys.map((k) => (
                <tr key={k.id}>
                  <td><span style={{ fontWeight: 700 }}>{k.name}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>{k.key}</span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{k.created}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => copyKey(k.key)}>
                        <Icon name={copied === k.key ? 'check' : 'copy'} /> {copied === k.key ? 'Copied' : 'Copy'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'DELETE_API_KEY', id: k.id }); showToast('Key revoked'); }}>
                        <Icon name="trash" /> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {state.apiKeys.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>No API keys yet. Create your first one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code example */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Quick Start (Axios)</div>
          <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(EXAMPLE_CODE).catch(() => {}); showToast('Code copied', 'success'); }}>
            <Icon name="copy" /> Copy
          </button>
        </div>
        <pre className="code-box" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{EXAMPLE_CODE}</pre>
      </div>
    </div>
  );
}
