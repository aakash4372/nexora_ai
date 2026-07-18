import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { instagramAPI } from '../lib/api';
import Icon from '../components/Icon';

export default function InstagramIntegration() {
  const { state, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(null);

  const workspaceName = state.workspace?.name || 'Default Workspace';

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await instagramAPI.getStatus(workspaceName);
      if (res.data.success && res.data.connected) {
        setConnection(res.data.connection);
      } else {
        setConnection(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve connection status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Handle redirect status message parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success') {
      showToast('Instagram Business Account connected successfully! 🎉', 'success');
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchStatus();
    } else if (params.get('error')) {
      showToast(`Connection failed: ${decodeURIComponent(params.get('error'))}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [workspaceName]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await instagramAPI.connect(workspaceName);
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      } else {
        showToast('Could not retrieve login URL.', 'error');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to start connection flow.', 'error');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Instagram Business Account?')) return;
    setLoading(true);
    try {
      const res = await instagramAPI.disconnect(workspaceName);
      if (res.data.success) {
        showToast('Instagram disconnected successfully.', 'success');
        setConnection(null);
      } else {
        showToast('Disconnect failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to disconnect account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#5B7CFA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: 12, color: 'var(--muted)' }}>Loading status...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, marginBottom: 4 }}>Instagram Integration</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Manage your connected Instagram Business Account and webhook sync.</p>
      </div>

      {connection ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 32 }}>
          {/* Header info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              {connection.profilePicture ? (
                <img
                  src={connection.profilePicture}
                  alt={connection.instagramUsername}
                  style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #7E97FF', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #bc1888)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700
                }}>
                  IG
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%',
                background: '#10B981', border: '3px solid var(--card-bg)', display: 'inline-block'
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: '#fff' }}>@{connection.instagramUsername}</h2>
                <span className="badge badge-green">Connected</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: 0 }}>Linked to Facebook Page: <strong>{connection.facebookPageName}</strong></p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={handleConnect} disabled={loading}>
                Reconnect
              </button>
              <button className="btn btn-danger" onClick={handleDisconnect} disabled={loading}>
                Disconnect
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-brd)', margin: 0 }} />

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Instagram Business ID</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{connection.instagramBusinessId}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Token Status</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                Active
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Token Expiration</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>
                {connection.expiresAt ? new Date(connection.expiresAt).toLocaleDateString() : 'Never Expires (Long Lived)'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Webhook Status</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: connection.webhookSubscribed ? '#10B981' : '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                {connection.webhookSubscribed ? '● Subscribed' : '● Unsubscribed'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Last Sync</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>
                {new Date(connection.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 70, height: 70, borderRadius: 20,
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 700,
            boxShadow: '0 8px 24px rgba(225,48,108,0.2)'
          }}>
            IG
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Connect your Instagram Business Account</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
              Enable automatic comment replies, direct message answering, story mention triggers, and message reactions using Meta OAuth.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="btn btn-primary"
            style={{
              padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14,
              boxShadow: '0 4px 14px rgba(91,124,250,0.3)', marginTop: 10
            }}
          >
            Connect Instagram Business
          </button>
        </div>
      )}
    </div>
  );
}
