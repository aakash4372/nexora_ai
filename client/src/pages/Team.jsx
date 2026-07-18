import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { ModalHead } from '../components/Modal';

const ROLE_COLORS = { Owner: '#5B7CFA', Admin: '#A855F7', Support: '#2ED598' };

export default function Team() {
  const { state, dispatch, showToast, openModal, closeModal } = useApp();

  function openInviteModal() {
    openModal(
      <div>
        <ModalHead title="Invite Team Member" />
        <div className="field"><label>Email address</label><input id="inv-email" type="email" placeholder="colleague@company.com" /></div>
        <div className="field">
          <label>Role</label>
          <select id="inv-role">
            <option>Support</option><option>Admin</option>
          </select>
        </div>
        <div className="section-note">An invitation email will be sent. They'll need to create a Nexora account.</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
            const email = document.getElementById('inv-email').value.trim();
            const role = document.getElementById('inv-role').value;
            if (!email) return showToast('Enter an email address', 'error');
            dispatch({ type: 'ADD_TEAM_MEMBER', payload: { id: Date.now(), name: email.split('@')[0], email, role } });
            showToast(`Invitation sent to ${email}`, 'success');
            closeModal();
          }}>Send Invite</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Team</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{state.team.length} members in {state.workspace.name}.</p>
        </div>
        <button className="btn btn-primary" onClick={openInviteModal}><Icon name="plus" /> Invite Member</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Member</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {state.team.map((m) => (
                <tr key={m.id} className="row-btn">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-md" style={{ width: 32, height: 32, fontSize: 12 }}>{m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <span style={{ fontWeight: 700 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12.5 }}>{m.email}</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: `${ROLE_COLORS[m.role]}20`, color: ROLE_COLORS[m.role] }}>
                      {m.role}
                    </span>
                  </td>
                  <td>
                    {m.role !== 'Owner' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => showToast('Role updated')}>Change role</button>
                        <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'REMOVE_TEAM_MEMBER', id: m.id }); showToast('Member removed'); }}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    )}
                    {m.role === 'Owner' && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>Workspace owner</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles explainer */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Role Permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { role: 'Owner', perms: ['All permissions', 'Billing & plan', 'Delete workspace', 'Manage team'] },
            { role: 'Admin', perms: ['Manage conversations', 'Manage automations', 'View analytics', 'Invite members'] },
            { role: 'Support', perms: ['View & reply to inbox', 'View contacts', 'View analytics', 'No admin access'] },
          ].map((r) => (
            <div key={r.role} style={{ padding: '14px 16px', border: '1px solid var(--glass-brd)', borderRadius: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: ROLE_COLORS[r.role] }}>{r.role}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {r.perms.map((p) => (
                  <li key={p} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--muted)' }}>
                    <Icon name="check" style={{ width: 14, height: 14, stroke: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
