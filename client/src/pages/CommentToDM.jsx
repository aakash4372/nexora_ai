import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { instagramAPI, commentAutomationsAPI } from '../lib/api';
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

function Toggle({ on, onClick, size = 'md' }) {
  const w = size === 'sm' ? 36 : 46;
  const h = size === 'sm' ? 20 : 26;
  const dot = size === 'sm' ? 14 : 20;
  const pad = size === 'sm' ? 3 : 3;
  return (
    <div
      onClick={onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: w, height: h, borderRadius: 20, cursor: 'pointer', flexShrink: 0,
        background: on ? IG_GRADIENT : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute', top: pad, left: on ? w - dot - pad : pad,
        width: dot, height: dot, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </div>
  );
}

function SectionCard({ title, subtitle, right, children }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: children ? 14 : 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

const emptyForm = () => ({
  name: '',
  selectedPostIds: [],
  commentMatchType: 'ANY',
  keywordsText: '',
  commentReply: 'Thanks! Please check your DM 😊',
  openingMessage: 'Hey 👋\nThanks for your interest.\n\nClick below to continue.',
  openingButtonName: 'Send me the link',
  requireFollow: false,
  followGateMessage: 'Please follow us first, then tap below to continue 👇',
  followGateButtonName: "I've Followed ✅",
  finalMessage: "Here's your link 👇",
  finalCtaButtons: [{ name: 'Open Website', url: '' }],
});

const isValidUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function CommentToDM() {
  const { showToast, openModal, closeModal } = useApp();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState([]);

  const [view, setView] = useState('list'); // 'list' | 'builder'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const fetchAutomations = async () => {
    setLoading(true);
    try {
      const res = await commentAutomationsAPI.list();
      if (res.data.success) setAutomations(res.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load comment automations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await instagramAPI.getMedia();
      if (res.data.success) setMediaList(res.data.media || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  const openCreateBuilder = () => {
    setEditingId(null);
    setForm(emptyForm());
    setView('builder');
    loadMedia();
  };

  const openEditBuilder = (automation) => {
    setEditingId(automation._id);
    setForm({
      name: automation.name || '',
      selectedPostIds: automation.postIds || [],
      commentMatchType: automation.commentMatchType,
      keywordsText: (automation.keywords || []).join(', '),
      commentReply: automation.commentReply,
      openingMessage: automation.openingMessage,
      openingButtonName: automation.openingButtonName,
      requireFollow: automation.requireFollow,
      followGateMessage: automation.followGateMessage,
      followGateButtonName: automation.followGateButtonName,
      finalMessage: automation.finalMessage,
      finalCtaButtons: automation.finalCtaButtons?.length ? automation.finalCtaButtons : [{ name: '', url: '' }],
    });
    setView('builder');
    loadMedia();
  };

  const togglePostSelection = (postId) => {
    setForm((f) => ({
      ...f,
      selectedPostIds: f.selectedPostIds.includes(postId)
        ? f.selectedPostIds.filter((id) => id !== postId)
        : [...f.selectedPostIds, postId],
    }));
  };

  const updateFinalCta = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      finalCtaButtons: f.finalCtaButtons.map((b, i) => (i === idx ? { ...b, [field]: value } : b)),
    }));
  };

  const addFinalCta = () => {
    setForm((f) => {
      if (f.finalCtaButtons.length >= 3) {
        showToast('Instagram allows a maximum of 3 buttons per message.', 'error');
        return f;
      }
      return { ...f, finalCtaButtons: [...f.finalCtaButtons, { name: '', url: '' }] };
    });
  };

  const removeFinalCta = (idx) => {
    setForm((f) => ({ ...f, finalCtaButtons: f.finalCtaButtons.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    const postIds = form.selectedPostIds.length ? form.selectedPostIds : ['ALL'];
    const keywords = form.keywordsText.split(',').map((k) => k.trim()).filter(Boolean);

    if (form.commentMatchType === 'KEYWORDS' && keywords.length === 0) {
      showToast('Add at least one keyword, or switch to "Any Comment".', 'error');
      return;
    }
    if (!form.commentReply.trim()) {
      showToast('The public comment reply message is required.', 'error');
      return;
    }
    if (!form.openingMessage.trim()) {
      showToast('The opening DM message is required.', 'error');
      return;
    }
    if (!form.finalMessage.trim()) {
      showToast('The final DM message is required.', 'error');
      return;
    }

    const cleanCtas = form.finalCtaButtons.filter((b) => b.name?.trim() && b.url?.trim());
    for (const b of cleanCtas) {
      if (!isValidUrl(b.url)) {
        showToast(`CTA button "${b.name}" has an invalid URL — it must start with http:// or https://`, 'error');
        return;
      }
    }

    const selectedMedia = mediaList.filter((m) => form.selectedPostIds.includes(m.id));

    const payload = {
      name: form.name.trim() || undefined,
      postIds,
      posts: selectedMedia.map((m) => ({
        id: m.id, caption: m.caption, mediaUrl: m.media_url || m.thumbnail_url,
        mediaType: m.media_type, permalink: m.permalink,
      })),
      commentMatchType: form.commentMatchType,
      keywords,
      commentReply: form.commentReply.trim(),
      openingMessage: form.openingMessage.trim(),
      openingButtonName: form.openingButtonName.trim() || 'Send me the link',
      requireFollow: form.requireFollow,
      followGateMessage: form.followGateMessage.trim(),
      followGateButtonName: form.followGateButtonName.trim(),
      finalMessage: form.finalMessage.trim(),
      finalCtaButtons: cleanCtas,
    };

    setSaving(true);
    try {
      const res = editingId
        ? await commentAutomationsAPI.update(editingId, payload)
        : await commentAutomationsAPI.create(payload);
      if (res.data.success) {
        showToast(editingId ? 'Automation updated! 🎉' : 'Automation created! 🎉', 'success');
        setView('list');
        fetchAutomations();
      } else {
        showToast(res.data.message || 'Failed to save automation.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error saving automation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await commentAutomationsAPI.toggleStatus(id);
      if (res.data.success) {
        setAutomations((prev) => prev.map((a) => (a._id === id ? res.data.data : a)));
      }
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const confirmDelete = (automation) => {
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
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#fff' }}>Delete this automation?</h3>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>This action cannot be undone.</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', marginBottom: 22, lineHeight: 1.5 }}>
          "{automation.name || 'Untitled Automation'}" will stop replying to comments and DMs immediately.
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
            onClick={async () => {
              try {
                await commentAutomationsAPI.delete(automation._id);
                setAutomations((prev) => prev.filter((a) => a._id !== automation._id));
                showToast('Automation deleted.', 'default');
              } catch (err) {
                showToast('Failed to delete automation.', 'error');
              }
              closeModal();
            }}
            style={{
              padding: '8px 16px', borderRadius: 8, background: '#EF4444',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(239,68,68,0.3)'
            }}
          >
            Delete Automation
          </button>
        </div>
      </div>
    );
  };

  if (view === 'builder') {
    return (
      <BuilderView
        form={form}
        setForm={setForm}
        mediaList={mediaList}
        mediaLoading={mediaLoading}
        togglePostSelection={togglePostSelection}
        updateFinalCta={updateFinalCta}
        addFinalCta={addFinalCta}
        removeFinalCta={removeFinalCta}
        onCancel={() => setView('list')}
        onSave={handleSave}
        saving={saving}
        editing={!!editingId}
      />
    );
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Comment to DM</h1>
            <span style={{
              background: IG_GRADIENT, color: '#fff', fontSize: 11, padding: '3px 8px',
              borderRadius: 6, fontWeight: 700, textTransform: 'uppercase',
            }}>Instagram Comments</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            Auto-reply to comments on specific posts/reels and follow up with an automated DM.
          </p>
        </div>
        <button
          onClick={openCreateBuilder}
          style={{
            background: IG_GRADIENT, border: 'none', color: '#fff', padding: '11px 22px',
            borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(225,48,108,0.3)', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          ⚡ New Automation
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#5B7CFA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Loading automations...</p>
        </div>
      ) : automations.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(225,48,108,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#E1306C' }}>
            💬
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Comment Automations Yet</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 450, margin: '0 auto', lineHeight: 1.5 }}>
              Pick a post or reel, set a comment keyword, and automatically DM anyone who comments.
            </p>
          </div>
          <button
            onClick={openCreateBuilder}
            style={{
              background: IG_GRADIENT, border: 'none', color: '#fff', padding: '10px 20px',
              borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 8,
            }}
          >
            + Create Automation
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {automations.map((a) => (
            <div key={a._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, flexWrap: 'wrap' }}>
              <div style={{
                position: 'relative', width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22,
              }}>
                {a.posts?.[0]?.mediaUrl ? (
                  <img src={a.posts[0].mediaUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : '⚡'}
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{a.name || 'Untitled Automation'}</span>
                  <span style={{ background: 'rgba(91,124,250,0.15)', color: '#7E97FF', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    {a.commentMatchType === 'ANY' ? 'ANY COMMENT' : `"${a.keywords.join(', ')}"`}
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>
                    {a.postIds.includes('ALL') ? 'All Posts' : `${a.postIds.length} post(s)`}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Runs: <strong>{a.runs || 0}</strong></span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
                  💬 "{a.commentReply}" → 📩 "{a.openingMessage.split('\n')[0]}"
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => openEditBuilder(a)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleStatus(a._id)}
                  style={{
                    background: a.status === 'Live' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    color: a.status === 'Live' ? '#10B981' : 'var(--muted)',
                    border: `1px solid ${a.status === 'Live' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ● {a.status}
                </button>
                <button
                  onClick={() => confirmDelete(a)}
                  style={{
                    background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: 'none',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuilderView({
  form, setForm, mediaList, mediaLoading, togglePostSelection,
  updateFinalCta, addFinalCta, removeFinalCta, onCancel, onSave, saving, editing,
}) {
  const [previewTab, setPreviewTab] = useState('DM');

  return (
    <div style={{ color: '#fff' }}>
      <style>{`
        @media (max-width: 980px) {
          .cmt-dm-layout { grid-template-columns: 1fr !important; }
          .cmt-dm-preview { position: static !important; order: -1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
              width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="arrowLeft" size={17} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{editing ? 'Edit Automation' : 'New Comment-to-DM Automation'}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Reply to a comment, then follow up with an automated DM</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              background: IG_GRADIENT, border: 'none', color: '#fff', padding: '10px 24px',
              borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : editing ? 'Save Changes' : '⚡ Activate Automation'}
          </button>
        </div>
      </div>

      {/* Two-column: left workflow form, right big live preview */}
      <div className="cmt-dm-layout" style={{ display: 'grid', gridTemplateColumns: '380px minmax(0, 1fr)', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Left: workflow form (scrolls independently, like the preview stays fixed) ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 16,
          maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: 6,
        }}>

          <SectionCard title="Automation Name" subtitle="Optional — for your own reference">
            <input
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Course Launch Post"
              style={inputStyle}
            />
          </SectionCard>

          <SectionCard title="Select Posts & Reels" subtitle={form.selectedPostIds.length === 0 ? 'None selected — applies to ALL posts' : `${form.selectedPostIds.length} selected`}>
            {mediaLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading your posts...</div>
            ) : mediaList.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>No posts found — connect Instagram to load your posts &amp; reels.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
                {mediaList.map((m) => {
                  const selected = form.selectedPostIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => togglePostSelection(m.id)}
                      style={{
                        position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                        cursor: 'pointer', border: selected ? '2.5px solid #E1306C' : '2.5px solid transparent',
                      }}
                    >
                      <img src={m.media_url || m.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 5,
                        background: selected ? '#E1306C' : 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && <Icon name="check" size={12} style={{ color: '#fff' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Comment Condition">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['ANY', 'KEYWORDS'].map((type) => (
                <div
                  key={type}
                  onClick={() => setForm((f) => ({ ...f, commentMatchType: type }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: form.commentMatchType === type ? 'rgba(225,48,108,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${form.commentMatchType === type ? '#E1306C' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${form.commentMatchType === type ? '#E1306C' : 'var(--muted)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {form.commentMatchType === type && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E1306C' }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{type === 'ANY' ? 'Any Comment' : 'Specific Words'}</span>
                </div>
              ))}
            </div>
            {form.commentMatchType === 'KEYWORDS' && (
              <input
                type="text" value={form.keywordsText}
                onChange={(e) => setForm((f) => ({ ...f, keywordsText: e.target.value }))}
                placeholder="price, details, info, course"
                style={{ ...inputStyle, marginTop: 10 }}
              />
            )}
          </SectionCard>

          <SectionCard title="Comment Reply" subtitle="Public reply left on the comment">
            <input
              type="text" value={form.commentReply}
              onChange={(e) => setForm((f) => ({ ...f, commentReply: e.target.value }))}
              placeholder='"Thanks! Please check your DM 😊"'
              style={inputStyle}
            />
          </SectionCard>

          <SectionCard title="They will get" subtitle="Opening DM, sent right after their comment">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                rows={3} value={form.openingMessage}
                onChange={(e) => setForm((f) => ({ ...f, openingMessage: e.target.value }))}
                placeholder={'Hey 👋\nThanks for your interest.\n\nClick below to continue.'}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <input
                type="text" value={form.openingButtonName}
                onChange={(e) => setForm((f) => ({ ...f, openingButtonName: e.target.value }))}
                placeholder="Send me the link"
                style={inputStyle}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Ask user to follow before continuing"
            subtitle="Optional — self-reported (Instagram has no API to verify follows)"
            right={<Toggle on={form.requireFollow} onClick={() => setForm((f) => ({ ...f, requireFollow: !f.requireFollow }))} />}
          >
            {form.requireFollow && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="text" value={form.followGateMessage}
                  onChange={(e) => setForm((f) => ({ ...f, followGateMessage: e.target.value }))}
                  placeholder="Please follow us first, then tap below to continue 👇"
                  style={inputStyle}
                />
                <input
                  type="text" value={form.followGateButtonName}
                  onChange={(e) => setForm((f) => ({ ...f, followGateButtonName: e.target.value }))}
                  placeholder="I've Followed ✅"
                  style={inputStyle}
                />
              </div>
            )}
          </SectionCard>

          <SectionCard title="And then, they will get" subtitle="Final DM, with your link">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                rows={3} value={form.finalMessage}
                onChange={(e) => setForm((f) => ({ ...f, finalMessage: e.target.value }))}
                placeholder={"Here's your link 👇\n\nhttps://yourwebsite.com"}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div>
                <label style={labelStyle}>CTA Buttons</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.finalCtaButtons.map((btn, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text" value={btn.name}
                        onChange={(e) => updateFinalCta(idx, 'name', e.target.value)}
                        placeholder="Button Name (e.g. Open Website)"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        type="text" value={btn.url}
                        onChange={(e) => updateFinalCta(idx, 'url', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => removeFinalCta(idx)}
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
                {form.finalCtaButtons.length < 3 && (
                  <button
                    onClick={addFinalCta}
                    style={{
                      marginTop: 8, background: 'rgba(91,124,250,0.12)', color: '#7E97FF',
                      border: '1px dashed rgba(91,124,250,0.4)', borderRadius: 8, padding: '7px 12px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Icon name="plus" size={13} /> Add CTA Button
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Right: big live preview ── */}
        <div className="cmt-dm-preview" style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <PhonePreview form={form} mediaList={mediaList} previewTab={previewTab} />
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4 }}>
            {['Post', 'Comments', 'DM'].map((tab) => (
              <div
                key={tab}
                onClick={() => setPreviewTab(tab)}
                style={{
                  padding: '7px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  background: previewTab === tab ? IG_GRADIENT : 'transparent',
                  color: previewTab === tab ? '#fff' : 'var(--muted)',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ form, mediaList, previewTab }) {
  const selectedMedia = mediaList.filter((m) => form.selectedPostIds.includes(m.id));
  const previewPost = selectedMedia[0] || mediaList[0] || null;

  return (
    <div style={{
      width: 340, borderRadius: 40, border: '9px solid #14151c', background: '#14151c',
      boxShadow: '0 24px 60px rgba(0,0,0,0.55)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', background: '#14151c', padding: '7px 0 3px' }}>
        <div style={{ width: 100, height: 20, borderRadius: 11, background: '#000' }} />
      </div>

      <div style={{ background: '#000', height: 620 }}>
        {previewTab === 'Post' && <PostPreview post={previewPost} />}
        {previewTab === 'Comments' && <CommentsPreview post={previewPost} form={form} />}
        {previewTab === 'DM' && <FlowPreview form={form} />}
      </div>
    </div>
  );
}

function PostPreview({ post }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: IG_GRADIENT, flexShrink: 0 }} />
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>your_account</div>
      </div>
      <div style={{ width: '100%', aspectRatio: '1', background: '#111' }}>
        {post ? (
          <img src={post.media_url || post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8E8E93', fontSize: 12.5 }}>
            Select a post to preview
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, padding: '12px 14px', color: '#fff' }}>
        <Icon name="smile" size={22} />
        <span style={{ fontSize: 18 }}>💬</span>
        <span style={{ fontSize: 18 }}>📤</span>
      </div>
      {post?.caption && (
        <div style={{ padding: '0 14px', fontSize: 12.5, color: '#ddd', lineHeight: 1.4 }}>
          <strong>your_account</strong> {post.caption}
        </div>
      )}
    </div>
  );
}

function CommentsPreview({ post, form }) {
  const sampleComment = form.commentMatchType === 'KEYWORDS' && form.keywordsText.trim()
    ? form.keywordsText.split(',')[0].trim()
    : 'price 🙋';
  const reply = form.commentReply.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Comments</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#444', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12.5, color: '#fff' }}><strong>a_follower</strong> {sampleComment}</div>
            <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 3 }}>2m</div>
          </div>
        </div>
        {reply && (
          <div style={{ display: 'flex', gap: 10, marginLeft: 30 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: IG_GRADIENT, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12.5, color: '#fff' }}><strong>your_account</strong> {reply}</div>
              <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 3 }}>Just now</div>
            </div>
          </div>
        )}
        {!post && (
          <div style={{ color: '#8E8E93', fontSize: 12, fontStyle: 'italic' }}>Sample comment — select a post to match your real content.</div>
        )}
      </div>
    </div>
  );
}

function FlowPreview({ form }) {
  const opening = form.openingMessage.trim();
  const openingBtn = form.openingButtonName.trim() || 'Send me the link';
  const followMsg = form.followGateMessage.trim();
  const followBtn = form.followGateButtonName.trim() || "I've Followed ✅";
  const final = form.finalMessage.trim();
  const finalCtas = form.finalCtaButtons.filter((b) => b.name?.trim());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <Icon name="arrowLeft" size={19} style={{ color: '#fff' }} />
        <div style={{
          width: 34, height: 34, borderRadius: '50%', background: IG_GRADIENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Instagram</div>
          <div style={{ fontSize: 11, color: '#8E8E93' }}>Active now</div>
        </div>
      </div>

      {/* Chat body — full flow, stacked as a conversation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 1. Opening DM */}
        {opening ? (
          <>
            <BotBubble text={opening} />
            {openingBtn && <ButtonRow label={openingBtn} />}
            <UserBubble text={openingBtn} />
          </>
        ) : (
          <EmptyHint text="Type your opening DM to preview it here..." />
        )}

        {/* 2. Follow gate (optional) */}
        {form.requireFollow && (
          <>
            {followMsg && <BotBubble text={followMsg} />}
            {followBtn && <ButtonRow label={followBtn} />}
            <UserBubble text={followBtn} />
          </>
        )}

        {/* 3. Final DM */}
        {final ? (
          <>
            <BotBubble text={final} />
            {finalCtas.map((btn, idx) => <ButtonRow key={idx} label={btn.name} />)}
          </>
        ) : (
          <EmptyHint text="Type your final DM to preview it here..." />
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
        borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <div style={{ flex: 1, background: '#1c1c1e', borderRadius: 20, padding: '9px 14px', fontSize: 13, color: '#8E8E93' }}>
          Message...
        </div>
      </div>
    </div>
  );
}

function BotBubble({ text }) {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
      <div style={{ background: '#262626', color: '#fff', padding: '10px 15px', borderRadius: '18px 18px 18px 4px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
      <div style={{ background: IG_GRADIENT, color: '#fff', padding: '9px 15px', borderRadius: '18px 18px 4px 18px', fontSize: 13.5, fontWeight: 600 }}>
        {text}
      </div>
    </div>
  );
}

function ButtonRow({ label }) {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
      <div style={{
        background: '#262626', color: '#5B9BFF', padding: '10px 15px', borderRadius: 12,
        fontSize: 13.5, fontWeight: 600, textAlign: 'center', marginTop: -2,
      }}>
        {label}
      </div>
    </div>
  );
}

function EmptyHint({ text }) {
  return <div style={{ color: '#8E8E93', fontSize: 12.5, fontStyle: 'italic', padding: '6px 4px' }}>{text}</div>;
}
