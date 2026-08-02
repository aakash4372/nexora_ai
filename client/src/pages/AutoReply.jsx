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
  const { state, showToast, openModal, closeModal } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [delaySeconds, setDelaySeconds] = useState('');
  const [templates, setTemplates] = useState([{ ...emptyTemplate(), active: true }]);
  const [igProfile, setIgProfile] = useState(null);
  const [expandedIdx, setExpandedIdx] = useState(null);

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
  }, [workspaceName]);

  const activeIndex = templates.findIndex((t) => t.active);
  const activeTemplate = templates[activeIndex >= 0 ? activeIndex : 0] || templates[0];

  const setActiveTemplate = (idx) => {
    setTemplates((prev) => prev.map((t, i) => ({ ...t, active: i === idx })));
  };

  const updateTemplateText = (idx, value) => {
    setTemplates((prev) => prev.map((t, i) => (i === idx ? { ...t, text: value } : t)));
  };

  const addTemplate = () => {
    setTemplates((prev) => {
      const next = [...prev, emptyTemplate()];
      setExpandedIdx(next.length - 1);
      return next;
    });
  };

  const removeTemplate = (idx) => {
    setTemplates((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx]?.active && next.length > 0 && !next.some((t) => t.active)) {
        next[0] = { ...next[0], active: true };
      }
      return next;
    });
    setExpandedIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
  };

  const confirmDeleteTemplate = (idx) => {
    const tplName = `Message #${idx + 1}`;
    openModal(
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.15)',
            color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon name="trash" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#fff' }}>Delete {tplName}?</h3>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>This action cannot be undone.</div>
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginBottom: 22, lineHeight: 1.5 }}>
          Are you sure you want to delete this welcome message template?
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={closeModal}
            style={{
              padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              removeTemplate(idx);
              closeModal();
              showToast(`${tplName} deleted`, 'default');
            }}
            style={{
              padding: '8px 16px', borderRadius: 8, background: '#EF4444',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(239,68,68,0.3)'
            }}
          >
            Delete Template
          </button>
        </div>
      </div>
    );
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
      <style>{`
        @media (max-width: 960px) {
          .auto-reply-layout {
            grid-template-columns: 1fr !important;
          }
          .phone-preview-wrapper {
            position: relative !important;
            top: 0 !important;
            margin-top: 12px;
          }
        }
        @media (max-width: 540px) {
          .card-header-responsive {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .card-header-right {
            width: 100% !important;
            justify-content: space-between !important;
          }
          .cta-input-group {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
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
      <div className="auto-reply-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left: Settings Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Enable / Disable */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>24h Cooldown</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {enabled
                    ? 'ON — each sender gets the auto-reply once every 24 hours'
                    : 'OFF — the auto-reply is sent for every incoming message'}
                </div>
              </div>
              <div
                onClick={() => setEnabled((e) => !e)}
                role="switch"
                aria-checked={enabled}
                style={{
                  width: 36, height: 20, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                  background: enabled ? IG_GRADIENT : 'rgba(255,255,255,0.12)',
                  position: 'relative', transition: 'background 0.15s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: enabled ? 19 : 3,
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
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
                  style={{ ...inputStyle, width: 100, padding: '7px 10px', fontSize: 12.5 }}
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>seconds before sending the reply</span>
              </div>
            </div>
          </div>

          {/* Message templates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Welcome Message Templates</label>

            {templates.map((tpl, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    borderRadius: 10,
                    border: tpl.active ? '1.5px solid #E1306C' : '1px solid var(--glass-brd)',
                    background: tpl.active ? 'rgba(225,48,108,0.05)' : 'rgba(255,255,255,0.02)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header (Rectangular preview & toggle bar) */}
                  <div
                    className="card-header-responsive"
                    onClick={() => {
                      setExpandedIdx(isExpanded ? null : idx);
                      setActiveTemplate(idx);
                    }}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                    }}
                  >
                    {/* Left: Chevron + Index/Title & Snippet */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1, marginRight: 10 }}>
                      <Icon
                        name="chevronDown"
                        size={14}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                          color: tpl.active ? '#E1306C' : 'var(--muted)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            Message #{idx + 1}
                          </span>
                          {tpl.ctaButtons?.length > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
                              background: 'rgba(91,124,250,0.18)', color: '#7E97FF'
                            }}>
                              {tpl.ctaButtons.length} {tpl.ctaButtons.length === 1 ? 'CTA' : 'CTAs'}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 12, color: 'var(--muted)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: 260,
                        }}>
                          {tpl.text?.trim() ? tpl.text.replace(/\n+/g, ' ') : 'No message text yet...'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Live Toggle + LIVE label + Trash */}
                    <div className="card-header-right" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: tpl.active ? '#E1306C' : 'var(--muted)',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {tpl.active ? (
                            <>
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#E1306C',
                                boxShadow: '0 0 6px #E1306C', display: 'inline-block'
                              }} />
                              LIVE
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </span>

                        <div
                          onClick={() => {
                            setActiveTemplate(idx);
                            setExpandedIdx(idx);
                          }}
                          role="switch"
                          aria-checked={tpl.active}
                          title={tpl.active ? 'This message is live' : 'Set as live message'}
                          style={{
                            width: 36, height: 20, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
                            background: tpl.active ? IG_GRADIENT : 'rgba(255,255,255,0.12)',
                            position: 'relative', transition: 'background 0.15s',
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 3, left: tpl.active ? 19 : 3,
                            width: 14, height: 14, borderRadius: '50%', background: '#fff',
                            transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }} />
                        </div>
                      </div>

                      {templates.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteTemplate(idx);
                          }}
                          title="Delete this template"
                          style={{
                            background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                            borderRadius: 6, width: 26, height: 26, flexShrink: 0, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body Content when expanded */}
                  {isExpanded && (
                    <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Auto Reply Message</label>
                        <textarea
                          rows={4}
                          value={tpl.text}
                          onChange={(e) => updateTemplateText(idx, e.target.value)}
                          placeholder={'Hey there! 👋 Thanks for messaging us.\n\nUse a blank line to start a new paragraph — line breaks are kept exactly as typed.'}
                          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontSize: 13, padding: '8px 12px' }}
                        />
                      </div>

                      {/* CTA Buttons for this template */}
                      <div>
                        <label style={{ ...labelStyle, marginBottom: 6 }}>CTA Buttons (Optional)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {tpl.ctaButtons.map((btn, ctaIdx) => (
                            <div key={ctaIdx} className="cta-input-group" style={{ display: 'flex', gap: 6 }}>
                              <input
                                type="text"
                                value={btn.name}
                                onChange={(e) => updateCta(idx, ctaIdx, 'name', e.target.value)}
                                placeholder="Button Name"
                                style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12.5 }}
                              />
                              <input
                                type="text"
                                value={btn.url}
                                onChange={(e) => updateCta(idx, ctaIdx, 'url', e.target.value)}
                                placeholder="Button URL (https://...)"
                                style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12.5 }}
                              />
                              <button
                                onClick={() => removeCta(idx, ctaIdx)}
                                title="Remove button"
                                style={{
                                  background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                                  borderRadius: 6, width: 32, flexShrink: 0, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Icon name="trash" size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {tpl.ctaButtons.length < 3 && (
                          <button
                            onClick={() => addCta(idx)}
                            style={{
                              marginTop: 6, background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                              border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 6, padding: '5px 10px',
                              fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
                              alignItems: 'center', gap: 5, width: 'fit-content',
                            }}
                          >
                            <Icon name="plus" size={12} /> Add CTA Button
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={addTemplate}
              style={{
                background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 8, padding: '8px 14px',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', gap: 6, width: 'fit-content',
              }}
            >
              <Icon name="plus" size={13} /> Add Message
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: IG_GRADIENT,
              border: 'none',
              color: '#fff',
              padding: '9px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              boxShadow: '0 3px 12px rgba(225,48,108,0.25)',
              opacity: saving ? 0.7 : 1,
              width: 'fit-content',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ── Right: Instagram Chat Preview ── */}
        <div className="phone-preview-wrapper" style={{ position: 'sticky', top: 84, display: 'flex', justifyContent: 'center' }}>
          <PhonePreview template={activeTemplate} profile={igProfile} />
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ template, profile }) {
  const { state } = useApp();
  const text = (template?.text || '').trim();
  const ctaButtons = (template?.ctaButtons || []).filter((b) => b.name?.trim());

  const rawUsername = profile?.username || state.activeAccount?.name || state.workspace?.name || 'nexoralabsai';
  const username = rawUsername.startsWith('@') ? rawUsername.substring(1) : rawUsername;
  const avatarUrl = profile?.profilePicture || state.activeAccount?.raw?.profilePicture;

  const [imgError, setImgError] = useState(false);

  const renderAvatar = (size = 28) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: IG_GRADIENT,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)',
    }}>
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={username}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ color: '#fff', fontSize: size * 0.42, fontWeight: 700, textTransform: 'uppercase' }}>
          {username ? username[0] : 'N'}
        </span>
      )}
    </div>
  );

  return (
    <div style={{
      width: 300,
      borderRadius: 38,
      border: '8px solid #14151c',
      background: '#14151c',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Phone Notch & Status Bar */}
      <div style={{ background: '#000', padding: '6px 14px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', marginLeft: 4 }}>10:53</span>
        <div style={{ width: 70, height: 14, borderRadius: 10, background: '#14151c' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 10 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 21l3.52-.61C9.37 20.73 10.64 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>
          <span style={{ fontWeight: 600 }}>100%</span>
        </div>
      </div>

      <div style={{ background: '#000', display: 'flex', flexDirection: 'column', height: 500 }}>
        {/* Chat header (matches Image 2) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          <Icon name="arrowLeft" size={18} style={{ color: '#fff' }} />
          {renderAvatar(28)}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {username}
            </div>
          </div>
          {/* Header Action Icons: Phone Call & Video Call */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', opacity: 0.9, marginRight: 2 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
        </div>

        {/* Chat body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Customer message */}
          <div style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6342E8, #A259FF)', color: '#fff', padding: '8px 14px',
              borderRadius: '18px 18px 4px 18px', fontSize: 13, fontWeight: 500,
            }}>
              Hi
            </div>
          </div>

          {/* Auto-reply message with DP avatar icon on left */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '90%' }}>
            {renderAvatar(24)}
            {!text ? (
              <div style={{ color: '#8E8E93', fontSize: 12, fontStyle: 'italic', padding: '6px 4px' }}>
                Type a welcome message to preview it here...
              </div>
            ) : (
              <div style={{
                background: '#262626',
                borderRadius: '18px 18px 18px 4px', padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                width: '100%',
              }}>
                <div style={{
                  color: '#fff', fontSize: 13, lineHeight: 1.45, whiteSpace: 'pre-wrap',
                }}>
                  {text}
                </div>

                {ctaButtons.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {ctaButtons.map((btn, idx) => (
                      <div key={idx} style={{
                        background: '#343434', color: '#5B9BFF', padding: '9px 12px',
                        borderRadius: 10, fontSize: 12.5, fontWeight: 600, textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <span style={{ fontSize: 12 }}></span> {btn.name || 'Button'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar (matches Image 2) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
        }}>
          {/* Blue Camera button */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#0095F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff',
          }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>

          {/* Input field */}
          <div style={{
            flex: 1, background: '#1c1c1e', borderRadius: 20, padding: '7px 12px',
            fontSize: 12.5, color: '#8E8E93', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            Message...
          </div>

          {/* Right icons: Gallery, Mic/Sticker, Plus */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', opacity: 0.85 }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
