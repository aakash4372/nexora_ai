import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { instagramAPI } from '../lib/api';
import Icon from '../components/Icon';

const IG_GRADIENT = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: 13.5,
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--muted-2)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  marginBottom: 6,
  display: 'block',
};

export default function AutoReply() {
  const { state, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [messages, setMessages] = useState(['Hello! 👋 Thanks for messaging us.', 'How can we help you today?']);
  const [delaySeconds, setDelaySeconds] = useState('');
  const [ctaButtons, setCtaButtons] = useState([]);

  const workspaceName = state.workspace?.name || 'Default Workspace';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await instagramAPI.getAutoReplySettings();
        if (!cancelled && res.data.success) {
          const s = res.data.data;
          setEnabled(s.enabled !== false);
          setMessages(s.messages?.length ? s.messages : ['']);
          setDelaySeconds(s.delaySeconds ? String(s.delaySeconds) : '');
          setCtaButtons(s.ctaButtons || []);
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to load Auto Reply settings.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceName]);

  const updateMessage = (idx, value) => {
    setMessages((prev) => prev.map((m, i) => (i === idx ? value : m)));
  };
  const addMessage = () => setMessages((prev) => [...prev, '']);
  const removeMessage = (idx) => setMessages((prev) => prev.filter((_, i) => i !== idx));

  const updateCta = (idx, field, value) => {
    setCtaButtons((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  };
  const addCta = () => {
    if (ctaButtons.length >= 3) {
      showToast('Instagram allows a maximum of 3 buttons per message.', 'error');
      return;
    }
    setCtaButtons((prev) => [...prev, { name: '', url: '' }]);
  };
  const removeCta = (idx) => setCtaButtons((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const cleanMessages = messages.map((m) => m.trim()).filter(Boolean);
    if (cleanMessages.length === 0) {
      showToast('At least one welcome message is required.', 'error');
      return;
    }
    const cleanCtas = ctaButtons.filter((b) => b.name?.trim() && b.url?.trim());

    setSaving(true);
    try {
      const res = await instagramAPI.saveAutoReplySettings({
        enabled,
        messages: cleanMessages,
        delaySeconds: Number(delaySeconds) || 0,
        ctaButtons: cleanCtas,
      });
      if (res.data.success) {
        showToast('Auto Reply settings saved! 🎉', 'success');
        setMessages(cleanMessages);
        setCtaButtons(cleanCtas);
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
        <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#5B7CFA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 12 }}>Loading Auto Reply settings...</p>
      </div>
    );
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Auto Reply Setup</h1>
          <span style={{
            background: IG_GRADIENT,
            color: '#fff',
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>Instagram Direct Messages</span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Automatically replies only to Instagram DMs.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) 340px', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left: Settings Form ── */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Enable / Disable */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Auto Reply</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                Automatically message anyone who sends you a DM
              </div>
            </div>
            <div
              onClick={() => setEnabled((e) => !e)}
              role="switch"
              aria-checked={enabled}
              style={{
                width: 46, height: 26, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                background: enabled ? IG_GRADIENT : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.15s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: enabled ? 23 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }} />
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Welcome Messages */}
          <div>
            <label style={labelStyle}>Welcome Message</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <textarea
                    rows={2}
                    value={msg}
                    onChange={(e) => updateMessage(idx, e.target.value)}
                    placeholder={idx === 0 ? 'Hello! 👋 Thanks for messaging us.' : 'Add another message in the sequence...'}
                    style={{ ...inputStyle, resize: 'vertical', flex: 1 }}
                  />
                  {messages.length > 1 && (
                    <button
                      onClick={() => removeMessage(idx)}
                      title="Remove message"
                      style={{
                        background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                        borderRadius: 8, width: 34, height: 34, flexShrink: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 3,
                      }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addMessage}
              style={{
                marginTop: 10, background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 8, padding: '8px 14px',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6,
              }}
            >
              <Icon name="plus" size={14} /> Add Message
            </button>
          </div>

          {/* Delay */}
          <div>
            <label style={labelStyle}>Delay (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min="0"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                placeholder="0"
                style={{ ...inputStyle, width: 120 }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>seconds before sending the reply</span>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* CTA Buttons */}
          <div>
            <label style={labelStyle}>CTA Buttons (Optional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ctaButtons.map((btn, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={btn.name}
                    onChange={(e) => updateCta(idx, 'name', e.target.value)}
                    placeholder="Button Name (e.g. Visit Website)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <input
                    type="text"
                    value={btn.url}
                    onChange={(e) => updateCta(idx, 'url', e.target.value)}
                    placeholder="Button URL (https://example.com)"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={() => removeCta(idx)}
                    title="Remove button"
                    style={{
                      background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                      borderRadius: 8, width: 38, flexShrink: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
            {ctaButtons.length < 3 && (
              <button
                onClick={addCta}
                style={{
                  marginTop: 10, background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                  border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 8, padding: '8px 14px',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 6,
                }}
              >
                <Icon name="plus" size={14} /> Add CTA Button
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: IG_GRADIENT,
              border: 'none',
              color: '#fff',
              padding: '13px 22px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14.5,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(225,48,108,0.3)',
              opacity: saving ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── Right: Instagram Chat Preview ── */}
        <div style={{ position: 'sticky', top: 84, display: 'flex', justifyContent: 'center' }}>
          <PhonePreview messages={messages} ctaButtons={ctaButtons} />
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ messages, ctaButtons }) {
  const visibleMessages = messages.filter((m) => m.trim());
  const visibleCtas = ctaButtons.filter((b) => b.name?.trim());

  return (
    <div style={{
      width: 300,
      borderRadius: 36,
      border: '8px solid #14151c',
      background: '#14151c',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', background: '#14151c', padding: '6px 0 2px' }}>
        <div style={{ width: 90, height: 18, borderRadius: 10, background: '#000' }} />
      </div>

      <div style={{ background: '#000', display: 'flex', flexDirection: 'column', height: 520 }}>
        {/* Chat header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          <Icon name="arrowLeft" size={18} style={{ color: '#fff' }} />
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: IG_GRADIENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Instagram</div>
            <div style={{ fontSize: 11, color: '#8E8E93' }}>Active now</div>
          </div>
        </div>

        {/* Chat body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Customer message */}
          <div style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
            <div style={{
              background: IG_GRADIENT, color: '#fff', padding: '8px 14px',
              borderRadius: '18px 18px 4px 18px', fontSize: 13.5,
            }}>
              Hi
            </div>
          </div>

          {/* Auto-reply messages */}
          {visibleMessages.length === 0 ? (
            <div style={{ alignSelf: 'flex-start', color: '#8E8E93', fontSize: 12.5, fontStyle: 'italic', padding: '6px 4px' }}>
              Type a welcome message to preview it here...
            </div>
          ) : (
            visibleMessages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: 'flex-start', maxWidth: '78%' }}>
                <div style={{
                  background: '#262626', color: '#fff', padding: '8px 14px',
                  borderRadius: '18px 18px 18px 4px', fontSize: 13.5, lineHeight: 1.4,
                }}>
                  {msg}
                </div>
              </div>
            ))
          )}

          {/* CTA buttons */}
          {visibleCtas.length > 0 && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
              {visibleCtas.map((btn, idx) => (
                <div key={idx} style={{
                  background: '#262626', color: '#5B9BFF', padding: '10px 14px',
                  borderRadius: 14, fontSize: 13, fontWeight: 600, textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {btn.name || 'Button'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message input bar (visual only) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          <div style={{
            flex: 1, background: '#1c1c1e', borderRadius: 20, padding: '8px 14px',
            fontSize: 12.5, color: '#8E8E93',
          }}>
            Message...
          </div>
        </div>
      </div>
    </div>
  );
}
