import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { instagramAPI } from '../../lib/api';

export default function AccountsSelector() {
  const { state, dispatch, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('accounts');
  const [view, setView] = useState('list'); // 'list' | 'connect'
  const [searchQuery, setSearchQuery] = useState('');

  // Default accounts state
  const [accounts, setAccounts] = useState([]);

  const workspaceName = state.workspace?.name || 'Default Workspace';

  const fetchStatus = async () => {
    try {
      const res = await instagramAPI.getStatus(workspaceName);
      if (res.data.success && res.data.connected) {
        const conn = res.data.connection;
        setAccounts([
          {
            id: conn.id,
            name: `@${conn.instagramUsername}`,
            plan: 'PRO',
            role: 'Admin',
            chats: 0,
            contacts: 780,
            pinned: conn.webhookSubscribed,
            logo: 'instagram',
            raw: conn
          }
        ]);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check query params for redirect notifications
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      showToast('Instagram Business Account connected successfully! 🎉', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchStatus();
    } else if (params.get('error')) {
      showToast(`Connection failed: ${decodeURIComponent(params.get('error'))}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [workspaceName]);

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectInstagram = async () => {
    try {
      const res = await instagramAPI.connect(workspaceName);
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      } else {
        showToast('Could not retrieve login URL.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to start connection flow.', 'error');
    }
  };

  const handleSelectAccount = (acc) => {
    dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: acc });
    dispatch({ type: 'SET_WORKSPACE', payload: { name: acc.name } });
    showToast(`Switched to workspace: ${acc.name}`, 'success');
  };

  if (view === 'connect') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#fff' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 40px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: '#0F172A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            }}>N</div>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Nexora</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 13.5, color: 'var(--muted)', cursor: 'pointer' }}>🌐 English</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar-md" style={{ width: 28, height: 28, fontSize: 11 }}>{state.user?.initials || 'US'}</div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{state.user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Connection Wizard */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          maxWidth: 1100,
          width: '100%',
          margin: '40px auto',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          {/* Left Panel */}
          <div style={{
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(91, 124, 250, 0.03)',
            borderRight: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  padding: 20,
                  borderRadius: 20,
                  display: 'inline-flex'
                }}>
                  <div style={{ width: 70, height: 50, border: '2px solid #7E97FF', borderRadius: 10, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 4 }}>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F472B6' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5B9BFF' }} />
                    </div>
                    <div style={{ height: 10, background: '#7E97FF', borderRadius: 3 }} />
                  </div>
                </div>
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 14, color: '#fff', fontFamily: 'var(--font-display)' }}>
                Where would you like to start?
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.5 }}>
                Don't worry, you can connect other channels later.
              </p>
            </div>

            <button
              onClick={() => setView('list')}
              style={{
                background: 'none',
                border: 'none',
                color: '#9BB1FF',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 0
              }}
            >
              <span>← Back</span>
            </button>
          </div>

          {/* Right Panel */}
          <div style={{ padding: '60px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted-2)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Available Integrations
            </div>

            {/* Instagram Only */}
            <div
              onClick={connectInstagram}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(91, 124, 250, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 700
                }}>
                  IG
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Instagram</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                    Supercharge your social media marketing with Instagram Automation.
                  </p>
                </div>
              </div>
              <div style={{ color: '#9BB1FF', fontSize: 16, fontWeight: 600 }}>Connect →</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0F172A'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          }}>N</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Nexora</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13.5, color: 'var(--muted)', cursor: 'pointer' }}>🌐 English</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar-md" style={{ width: 28, height: 28, fontSize: 11 }}>{state.user?.initials || 'US'}</div>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{state.user?.name || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Selector Container */}
      <div style={{ maxWidth: 1000, width: '100%', margin: '40px auto', padding: '0 20px', flex: 1 }}>
        
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 28,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 28,
          paddingBottom: 2
        }}>
          {[
            { id: 'accounts', label: 'Accounts' },
            { id: 'templates', label: 'My Templates' },
            { id: 'settings', label: 'API Settings' },
            { id: 'reports', label: 'Message reports' }
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: active ? '#fff' : 'var(--muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14.5,
                  padding: '8px 4px 12px 4px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {tab.label}
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#5B7CFA',
                    borderRadius: 1
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'accounts' && (
          <>
            {/* Search and Action Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              gap: 16
            }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 16px 9px 36px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: '#fff',
                    fontSize: 13.5
                  }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: 13 }}>
                  🔍
                </span>
              </div>

              <button
                onClick={() => setView('connect')}
                style={{
                  background: '#5B7CFA',
                  border: 'none',
                  color: '#fff',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(91, 124, 250, 0.2)'
                }}
              >
                + Add New Account
              </button>
            </div>

            {/* Table */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Subscription</th>
                    <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Assigned Inbox chats</th>
                    <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Contacts</th>
                    <th style={{ textAlign: 'center', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Pin</th>
                    <th style={{ textAlign: 'center', padding: '12px 18px', fontSize: 12.5, color: 'var(--muted-2)', fontWeight: 700 }}>Hide</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: acc.logo === 'instagram' ? 'linear-gradient(45deg, #f09433, #bc1888)' : 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            color: '#fff',
                            fontWeight: 600
                          }}>
                            {acc.logo === 'instagram' ? 'IG' : 'N'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{acc.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--muted)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 750,
                        }}>{acc.plan}</span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--muted)', fontSize: 13.5 }}>{acc.role}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--muted)', fontSize: 13.5 }}>{acc.chats}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--muted)', fontSize: 13.5 }}>{acc.contacts}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setAccounts(accounts.map(a => a.id === acc.id ? { ...a, pinned: !a.pinned } : a));
                            showToast(acc.pinned ? 'Account unpinned' : 'Account pinned', 'default');
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: acc.pinned ? 1 : 0.3, fontSize: 14 }}
                        >
                          📌
                        </button>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => showToast('Visibility toggled', 'default')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3, fontSize: 14 }}
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab !== 'accounts' && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            This tab is simulated. Please go back to the <strong>Accounts</strong> tab.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'var(--muted)', fontSize: 12 }}>
        ❓ Help
      </footer>
    </div>
  );
}
