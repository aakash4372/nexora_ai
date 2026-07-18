import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(state.user.name);
  const [email, setEmail] = useState(state.user.email);
  const [wsName, setWsName] = useState(state.workspace.name);
  const [notifs, setNotifs] = useState({ newMsg: true, assigned: true, automation: false, billing: true });

  function saveProfile() {
    dispatch({ type: 'SET_USER', payload: { name, email, initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) } });
    showToast('Profile updated', 'success');
  }

  function saveWorkspace() {
    dispatch({ type: 'SET_WORKSPACE', payload: { name: wsName } });
    showToast('Workspace settings saved', 'success');
  }

  const TABS = ['profile', 'workspace', 'notifications', 'security'];

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Manage your account and workspace preferences.</p>
      </div>

      <div className="tab-row">
        {TABS.map((t) => (
          <div key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</div>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="avatar-md" style={{ width: 60, height: 60, fontSize: 22 }}>{state.user.initials}</div>
            <div>
              <button className="btn btn-sm" onClick={() => showToast('Avatar upload coming soon')}><Icon name="upload" /> Change avatar</button>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>JPG, PNG, GIF up to 2MB</div>
            </div>
          </div>
          <div className="field"><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Email address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label>Timezone</label><select><option>Asia/Kolkata (IST +5:30)</option><option>UTC</option><option>America/New_York</option></select></div>
          <button className="btn btn-primary" onClick={saveProfile}>Save changes</button>
        </div>
      )}

      {tab === 'workspace' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="field"><label>Workspace name</label><input value={wsName} onChange={(e) => setWsName(e.target.value)} /></div>
          <div className="field"><label>Industry</label><select><option>E-commerce</option><option>SaaS</option><option>Agency</option><option>Other</option></select></div>
          <div className="field"><label>Default language</label><select><option>English</option><option>Hindi</option><option>Spanish</option></select></div>
          <div className="field"><label>Business hours</label><select><option>24/7</option><option>Mon-Fri 9am-6pm</option><option>Custom</option></select></div>
          <div style={{ height: 1, background: 'var(--glass-brd)', margin: '18px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Delete Workspace</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>This action is permanent and cannot be undone.</div>
            </div>
            <button className="btn btn-danger" onClick={() => showToast('Contact support to delete workspace')}>Delete</button>
          </div>
          <button className="btn btn-primary" onClick={saveWorkspace}>Save changes</button>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card" style={{ maxWidth: 560 }}>
          {[
            { key: 'newMsg', label: 'New message received', desc: 'Get notified when a customer sends a new message' },
            { key: 'assigned', label: 'Conversation assigned to me', desc: 'Notification when a conversation is assigned to you' },
            { key: 'automation', label: 'Automation triggered', desc: 'When an automation flow runs' },
            { key: 'billing', label: 'Billing alerts', desc: 'Invoice payments and plan changes' },
          ].map((n) => (
            <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--glass-brd)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{n.desc}</div>
              </div>
              <div
                className={`switch ${notifs[n.key] ? 'on' : ''}`}
                onClick={() => { setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key] })); showToast('Preference updated', 'success'); }}
              />
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => showToast('Notification preferences saved', 'success')}>Save preferences</button>
        </div>
      )}

      {tab === 'security' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Change Password</div>
          <div className="field"><label>Current password</label><input type="password" placeholder="••••••••" /></div>
          <div className="field"><label>New password</label><input type="password" placeholder="New password" /></div>
          <div className="field"><label>Confirm new password</label><input type="password" placeholder="Confirm password" /></div>
          <button className="btn btn-primary" onClick={() => showToast('Password updated', 'success')}>Update password</button>

          <div style={{ height: 1, background: 'var(--glass-brd)', margin: '24px 0' }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Two-Factor Authentication</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14 }}>Authenticator app</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Use an app like Google Authenticator or Authy.</div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => showToast('2FA setup coming soon')}>Enable</button>
          </div>

          <div style={{ height: 1, background: 'var(--glass-brd)', margin: '24px 0' }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Active Sessions</div>
          {[
            { device: 'Chrome on macOS', location: 'Mumbai, IN', current: true },
            { device: 'Safari on iPhone', location: 'Delhi, IN', current: false },
          ].map((s) => (
            <div key={s.device} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-brd)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.device}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.location} {s.current && <span className="badge badge-green" style={{ marginLeft: 4 }}>Current</span>}</div>
              </div>
              {!s.current && <button className="btn btn-sm btn-danger" onClick={() => showToast('Session revoked')}>Revoke</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
