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

const emptyTemplate = () => ({ text: '', ctaButtons: [], active: false });

export default function AutoReply() {
  const { state, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [delaySeconds, setDelaySeconds] = useState('');
  const [templates, setTemplates] = useState([{ ...emptyTemplate(), active: true }]);
  const [igProfile, setIgProfile] = useState(null);

  const workspaceName = state.workspace?.name || 'Default Workspace';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [settingsRes, statusRes] = await Promise.all([
          instagramAPI.getAutoReplySettings(),
          instagramAPI.getStatus(workspaceName).catch(() => null),
        ]);
        if (!cancelled && settingsRes.data.success) {
          const s = settingsRes.data.data;
          setEnabled(s.enabled !== false);
          setDelaySeconds(s.delaySeconds ? String(s.delaySeconds) : '');
          setTemplates(s.templates?.length ? s.templates : [{ ...emptyTemplate(), active: true }]);
        }
        if (!cancelled && statusRes?.data?.connected) {
          setIgProfile({
            username: statusRes.data.connection?.instagramUsername,
            profilePicture: statusRes.data.connection?.profilePicture,
          });
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
  }, []);

  const activeIndex = templates.findIndex((t) => t.active);
  const activeTemplate = templates[activeIndex] || templates[0];

  const setActiveTemplate = (idx) => {
    setTemplates((prev) => prev.map((t, i) => ({ ...t, active: i === idx })));
  };

  const updateTemplateText = (idx, value) => {
    setTemplates((prev) => prev.map((t, i) => (i === idx ? { ...t, text: value } : t)));
  };

  const addTemplate = () => {
    setTemplates((prev) => [...prev, emptyTemplate()]);
  };

  const removeTemplate = (idx) => {
    setTemplates((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx]?.active && next.length > 0 && !next.some((t) => t.active)) {
        next[0] = { ...next[0], active: true };
      }
      return next;
    });
  };

  const addCta = (idx) => {
    setTemplates((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      if (t.ctaButtons.length >= 3) {
        showToast('Instagram allows a maximum of 3 buttons per message.', 'error');
        return t;
      }
      return { ...t, ctaButtons: [...t.ctaButtons, { name: '', url: '' }] };
    }));
  };

  const updateCta = (idx, ctaIdx, field, value) => {
    setTemplates((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      const ctaButtons = t.ctaButtons.map((b, bi) => (bi === ctaIdx ? { ...b, [field]: value } : b));
      return { ...t, ctaButtons };
    }));
  };

  const removeCta = (idx, ctaIdx) => {
    setTemplates((prev) => prev.map((t, i) => {
      if (i !== idx) return t;
      return { ...t, ctaButtons: t.ctaButtons.filter((_, bi) => bi !== ctaIdx) };
    }));
  };

  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const cleanTemplates = templates.filter((t) => t.text.trim());
    if (cleanTemplates.length === 0) {
      showToast('At least one message template is required.', 'error');
      return;
    }

    for (const t of cleanTemplates) {
      for (const b of t.ctaButtons) {
        if (b.name?.trim() && b.url?.trim() && !isValidUrl(b.url)) {
          showToast(`CTA button "${b.name}" has an invalid URL — it must start with http:// or https://`, 'error');
          return;
        }
      }
    }

    if (!cleanTemplates.some((t) => t.active)) cleanTemplates[0].active = true;

    setSaving(true);
    try {
      const res = await instagramAPI.saveAutoReplySettings({
        enabled,
        delaySeconds: Number(delaySeconds) || 0,
        templates: cleanTemplates,
      });
      if (res.data.success) {
        showToast('Auto Reply settings saved! 🎉', 'success');
        setTemplates(res.data.data.templates);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

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
          </div>

          {/* Message templates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Welcome Message Templates</label>

            {templates.map((tpl, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  border: tpl.active ? '1.5px solid #E1306C' : '1px solid var(--glass-brd)',
                  background: tpl.active ? 'rgba(225,48,108,0.06)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      onClick={() => setActiveTemplate(idx)}
                      role="radio"
                      aria-checked={tpl.active}
                      title="Set as the live message sent to new DMs"
                      style={{
                        width: 40, height: 23, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                        background: tpl.active ? IG_GRADIENT : 'rgba(255,255,255,0.12)',
                        position: 'relative', transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2.5, left: tpl.active ? 19 : 2.5,
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      }} />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: tpl.active ? '#E1306C' : 'var(--muted)',
                    }}>
                      {tpl.active ? '● LIVE — sent to new DMs' : 'Inactive'}
                    </span>
                  </div>

                  {templates.length > 1 && (
                    <button
                      onClick={() => removeTemplate(idx)}
                      title="Delete this template"
                      style={{
                        background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                        borderRadius: 8, width: 32, height: 32, flexShrink: 0, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={tpl.text}
                  onChange={(e) => updateTemplateText(idx, e.target.value)}
                  placeholder={'Hey there! 👋 Thanks for messaging us.\n\nUse a blank line to start a new paragraph — line breaks are kept exactly as typed.'}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />

                {/* CTA Buttons for this template */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>CTA Buttons (Optional)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tpl.ctaButtons.map((btn, ctaIdx) => (
                      <div key={ctaIdx} style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={btn.name}
                          onChange={(e) => updateCta(idx, ctaIdx, 'name', e.target.value)}
                          placeholder="Button Name (e.g. Visit Website)"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <input
                          type="text"
                          value={btn.url}
                          onChange={(e) => updateCta(idx, ctaIdx, 'url', e.target.value)}
                          placeholder="Button URL (https://example.com)"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => removeCta(idx, ctaIdx)}
                          title="Remove button"
                          style={{
                            background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                            borderRadius: 8, width: 38, flexShrink: 0, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {tpl.ctaButtons.length < 3 && (
                    <button
                      onClick={() => addCta(idx)}
                      style={{
                        marginTop: 8, background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                        border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 8, padding: '7px 12px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 6,
                      }}
                    >
                      <Icon name="plus" size={13} /> Add CTA Button
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addTemplate}
              style={{
                background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 10, padding: '11px 16px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon name="plus" size={15} /> Add Message
            </button>
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
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── Right: Instagram Chat Preview ── */}
        <div style={{ position: 'sticky', top: 84, display: 'flex', justifyContent: 'center' }}>
          <PhonePreview template={activeTemplate} profile={igProfile} />
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ template, profile }) {
  const text = (template?.text || '').trim();
  const ctaButtons = (template?.ctaButtons || []).filter((b) => b.name?.trim());
  const username = profile?.username || 'Instagram';

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
            overflow: 'hidden',
          }}>
            {profile?.profilePicture ? (
              <img src={profile.profilePicture} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{username}</div>
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

          {/* Auto-reply: text + CTA buttons merged into one card */}
          {!text ? (
            <div style={{ alignSelf: 'flex-start', color: '#8E8E93', fontSize: 12.5, fontStyle: 'italic', padding: '6px 4px' }}>
              Type a welcome message to preview it here...
            </div>
          ) : (
            <div style={{
              alignSelf: 'flex-start', maxWidth: '82%', background: '#262626',
              borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{
                color: '#fff', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {text}
              </div>

              {ctaButtons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ctaButtons.map((btn, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.08)', color: '#5B9BFF', padding: '10px 14px',
                      borderRadius: 12, fontSize: 13, fontWeight: 600, textAlign: 'center',
                    }}>
                      {btn.name || 'Button'}
                    </div>
                  ))}
                </div>
              )}
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
