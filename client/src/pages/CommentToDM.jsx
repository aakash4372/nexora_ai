import { useState, useEffect, useRef } from 'react';
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
  finalMessage: "Here's your link 👇",
  finalCtaButtons: [{ name: 'Open Website', url: '' }],
  finalMediaType: 'NONE',
  finalMediaUrl: '',
});

const MEDIA_TYPES = [
  { value: 'NONE', label: 'No Media', icon: 'x' },
  { value: 'IMAGE', label: 'Image', icon: 'image' },
  { value: 'VIDEO', label: 'Video', icon: 'video' },
  { value: 'FILE', label: 'File', icon: 'file' },
  { value: 'YOUTUBE', label: 'YouTube Link', icon: 'youtube' },
];

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
  const [igProfile, setIgProfile] = useState(null);

  useEffect(() => {
    instagramAPI.getStatus()
      .then((res) => {
        if (res.data?.connected) {
          setIgProfile({
            username: res.data.connection?.instagramUsername,
            profilePicture: res.data.connection?.profilePicture,
          });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      finalMessage: automation.finalMessage,
      finalCtaButtons: automation.finalCtaButtons?.length ? automation.finalCtaButtons : [{ name: '', url: '' }],
      finalMediaType: automation.finalMediaType || 'NONE',
      finalMediaUrl: automation.finalMediaUrl || '',
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

    if (form.finalMediaType !== 'NONE' && !isValidUrl(form.finalMediaUrl)) {
      showToast('Add a valid media URL — it must start with http:// or https://', 'error');
      return;
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
      finalMessage: form.finalMessage.trim(),
      finalCtaButtons: cleanCtas,
      finalMediaType: form.finalMediaType,
      finalMediaUrl: form.finalMediaType !== 'NONE' ? form.finalMediaUrl.trim() : '',
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
        igProfile={igProfile}
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
  updateFinalCta, addFinalCta, removeFinalCta, onCancel, onSave, saving, editing, igProfile,
}) {
  const [previewTab, setPreviewTab] = useState('DM');
  const [mode, setMode] = useState('form'); // 'form' | 'flow'

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

      {/* Top-level mode switch: step-by-step form vs. n8n-style flow view */}
      <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        {[{ id: 'form', label: 'Form', icon: 'edit' }, { id: 'flow', label: 'Flow', icon: 'automation' }].map((m) => (
          <div
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 7, cursor: 'pointer',
              background: mode === m.id ? IG_GRADIENT : 'transparent',
              color: mode === m.id ? '#fff' : 'var(--muted)',
              fontSize: 13, fontWeight: 700, transition: 'background 0.12s, color 0.12s',
            }}
          >
            <Icon name={m.icon} size={14} />
            {m.label}
          </div>
        ))}
      </div>

      {mode === 'flow' ? (
        <FlowCanvas form={form} />
      ) : (
      /* Two-column: left workflow form, right big live preview */
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

          <SectionCard title="And then, they will get" subtitle="Final DM, with your link">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                rows={3} value={form.finalMessage}
                onChange={(e) => setForm((f) => ({ ...f, finalMessage: e.target.value }))}
                placeholder={"Here's your link 👇\n\nhttps://yourwebsite.com"}
                style={{ ...inputStyle, resize: 'vertical' }}
              />

              <div>
                <label style={labelStyle}>Attach Media</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: form.finalMediaType !== 'NONE' ? 8 : 0 }}>
                  {MEDIA_TYPES.map((m) => {
                    const active = form.finalMediaType === m.value;
                    return (
                      <div
                        key={m.value}
                        onClick={() => setForm((f) => ({ ...f, finalMediaType: m.value, finalMediaUrl: m.value === 'NONE' ? '' : f.finalMediaUrl }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                          background: active ? 'rgba(225,48,108,0.14)' : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${active ? '#E1306C' : 'rgba(255,255,255,0.08)'}`,
                          fontSize: 12.5, fontWeight: 600, color: active ? '#fff' : 'var(--muted)',
                        }}
                      >
                        <Icon name={m.icon} size={13} />
                        {m.label}
                      </div>
                    );
                  })}
                </div>
                {form.finalMediaType !== 'NONE' && (
                  <input
                    type="text" value={form.finalMediaUrl}
                    onChange={(e) => setForm((f) => ({ ...f, finalMediaUrl: e.target.value }))}
                    placeholder={form.finalMediaType === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : `https://.../file.${form.finalMediaType === 'IMAGE' ? 'jpg' : form.finalMediaType === 'VIDEO' ? 'mp4' : 'pdf'}`}
                    style={inputStyle}
                  />
                )}
              </div>

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
          <PhonePreview form={form} mediaList={mediaList} previewTab={previewTab} igProfile={igProfile} />
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
      )}
    </div>
  );
}

const FLOW_NODE_W = 240;

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

const NODE_COLORS = ['#5B7CFA', '#2ED598', '#F5A623', '#A855F7', '#FB6B6B', '#5B9BFF'];
const NODE_ICONS = ['zap', 'mail', 'send', 'filter', 'tag', 'clock', 'users', 'automation'];

/**
 * One node per section of the Form tab, in the same order they appear
 * there — Automation Name → Select Posts & Reels → Comment Condition →
 * Comment Reply → Opening DM ("They will get") → Final DM ("And then, they
 * will get"), the latter folding in its media + CTA buttons. Laid out as a
 * gentle zigzag like a real workflow canvas.
 */
const seedNodes = (form) => {
  const postCount = form.selectedPostIds.length;
  const ctaCount = form.finalCtaButtons.filter((b) => b.name?.trim() && b.url?.trim()).length;
  const mediaLabel = form.finalMediaType !== 'NONE' && form.finalMediaUrl.trim()
    ? ` · ${form.finalMediaType.charAt(0)}${form.finalMediaType.slice(1).toLowerCase()} attached`
    : '';

  return [
    {
      id: 'n1', x: 20, y: 140, icon: 'tag', color: '#5B7CFA', title: 'Automation Name',
      subtitle: form.name.trim() || 'Untitled Automation',
      hasInput: false, hasOutput: true,
    },
    {
      id: 'n2', x: 300, y: 20, icon: 'image', color: '#A855F7', title: 'Select Posts & Reels',
      subtitle: postCount === 0 ? 'All Posts' : `${postCount} post(s) selected`,
      hasInput: true, hasOutput: true,
    },
    {
      id: 'n3', x: 580, y: 200, icon: 'filter', color: '#F5A623', title: 'Comment Condition',
      subtitle: form.commentMatchType === 'KEYWORDS' && form.keywordsText.trim()
        ? `Keywords: ${truncate(form.keywordsText.trim(), 40)}`
        : 'Any Comment',
      hasInput: true, hasOutput: true,
    },
    {
      id: 'n4', x: 860, y: 40, icon: 'send', color: '#5B9BFF', title: 'Comment Reply',
      subtitle: form.commentReply.trim() ? truncate(form.commentReply.trim(), 50) : 'No reply set',
      hasInput: true, hasOutput: true,
    },
    {
      id: 'n5', x: 1140, y: 220, icon: 'mail', color: '#2ED598', title: 'Opening DM',
      subtitle: form.openingMessage.trim() ? truncate(form.openingMessage.trim(), 60) : 'No message set',
      hasInput: true, hasOutput: true,
    },
    {
      id: 'n6', x: 1420, y: 80, icon: 'zap', color: '#FB6B6B', title: 'Final DM',
      subtitle: (form.finalMessage.trim() ? truncate(form.finalMessage.trim(), 55) : 'No message set') + mediaLabel
        + (ctaCount > 0 ? ` · ${ctaCount} CTA button(s)` : ''),
      hasInput: true, hasOutput: false,
    },
  ];
};

/**
 * n8n-style visual canvas: build your own flow from scratch — add nodes,
 * rename them, drag them around, and draw connections by dragging between
 * output/input port dots. This is presentation only: it starts seeded from
 * the automation's configured steps as a helpful starting point, but every
 * node here is yours to edit, add, or delete. Nothing here changes what
 * actually gets saved — the form on the left still owns the real settings.
 */
function FlowCanvas({ form }) {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState(() => seedNodes(form));
  const [connections, setConnections] = useState([
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
    { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' },
    { from: 'n5', to: 'n6' },
  ]);
  const [dragLine, setDragLine] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const nodeById = (id) => nodes.find((n) => n.id === id);
  const portY = (id) => nodeById(id).y + 44;

  const addNode = () => {
    const idx = nodes.length;
    const newNode = {
      id: `n${Date.now()}`,
      x: 40 + (idx % 3) * 260, y: 40 + Math.floor(idx / 3) * 160 + 320,
      icon: NODE_ICONS[idx % NODE_ICONS.length], color: NODE_COLORS[idx % NODE_COLORS.length],
      title: 'New Step', subtitle: 'Click to edit',
      hasInput: true, hasOutput: true,
    };
    setNodes((prev) => [...prev, newNode]);
    setEditingId(newNode.id);
  };

  const updateNode = (id, patch) => setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const removeNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
  };

  function startNodeDrag(e, id) {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const start = nodeById(id);
    const offsetX = e.clientX - rect.left - start.x;
    const offsetY = e.clientY - rect.top - start.y;
    function onMove(me) {
      updateNode(id, { x: me.clientX - rect.left - offsetX, y: me.clientY - rect.top - offsetY });
    }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function startConnectionDrag(e, fromId) {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    function onMove(me) {
      setDragLine({ from: fromId, x: me.clientX - rect.left, y: me.clientY - rect.top });
    }
    function onUp(me) {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const target = document.elementFromPoint(me.clientX, me.clientY);
      const toId = target?.closest('[data-port-in]')?.getAttribute('data-port-in');
      if (toId && toId !== fromId) {
        setConnections((prev) => (prev.some((c) => c.from === fromId && c.to === toId) ? prev : [...prev, { from: fromId, to: toId }]));
      }
      setDragLine(null);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const removeConnection = (idx) => setConnections((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="card" style={{ padding: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Flow Builder</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Add your own nodes, drag to rearrange, drag a dot to connect · double-click a node to rename</div>
        </div>
        <button
          onClick={addNode}
          style={{
            background: 'rgba(91,124,250,0.14)', color: '#7E97FF', border: '1px dashed rgba(91,124,250,0.4)',
            borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          <Icon name="plus" size={13} /> Add Node
        </button>
      </div>
      <div
        ref={canvasRef}
        style={{
          position: 'relative', height: 520, borderRadius: 16,
          border: '1px dashed var(--glass-brd)', overflow: 'auto',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '22px 22px', background: 'rgba(255,255,255,0.015)',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <marker id="n8n-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill="#5B7CFA" />
            </marker>
          </defs>
          {connections.map((c, idx) => {
            if (!nodeById(c.from) || !nodeById(c.to)) return null;
            const x1 = nodeById(c.from).x + FLOW_NODE_W, y1 = portY(c.from);
            const x2 = nodeById(c.to).x, y2 = portY(c.to);
            const dx = Math.max(Math.abs(x2 - x1) * 0.5, 50);
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
            return (
              <path
                key={idx} d={d} fill="none" stroke="#5B7CFA" strokeWidth="2.5"
                markerEnd="url(#n8n-arrow)" opacity="0.9"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={() => removeConnection(idx)}
              />
            );
          })}
          {dragLine && (() => {
            const x1 = nodeById(dragLine.from).x + FLOW_NODE_W, y1 = portY(dragLine.from);
            const dx = Math.max(Math.abs(dragLine.x - x1) * 0.5, 50);
            const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${dragLine.x - dx} ${dragLine.y}, ${dragLine.x} ${dragLine.y}`;
            return <path d={d} fill="none" stroke="#5B7CFA" strokeWidth="2" strokeDasharray="5 4" opacity="0.7" />;
          })()}
        </svg>

        {nodes.map((node) => (
          <FlowNode
            key={node.id}
            node={node}
            editing={editingId === node.id}
            onStartEdit={() => setEditingId(node.id)}
            onStopEdit={() => setEditingId(null)}
            onChange={(patch) => updateNode(node.id, patch)}
            onRemove={() => removeNode(node.id)}
            onDragStart={(e) => startNodeDrag(e, node.id)}
            onConnectStart={(e) => startConnectionDrag(e, node.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FlowNode({ node, editing, onStartEdit, onStopEdit, onChange, onRemove, onDragStart, onConnectStart }) {
  return (
    <div
      onMouseDown={editing ? undefined : onDragStart}
      onDoubleClick={onStartEdit}
      style={{
        position: 'absolute', left: node.x, top: node.y, width: FLOW_NODE_W,
        background: '#12141F', border: '1px solid var(--glass-brd)', borderRadius: 14,
        padding: 14, cursor: editing ? 'default' : 'grab', boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
      }}
    >
      <button
        onClick={onRemove}
        title="Delete node"
        style={{
          position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%',
          background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.15)', color: '#EF4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
        }}
      >
        <Icon name="x" size={11} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${node.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={node.icon} size={14} style={{ color: node.color }} />
        </div>
        {editing ? (
          <input
            autoFocus
            value={node.title}
            onChange={(e) => onChange({ title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onStopEdit()}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 12.5, fontWeight: 700, flex: 1 }}
          />
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{node.title}</div>
        )}
      </div>

      {editing ? (
        <input
          value={node.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onStopEdit()}
          onBlur={onStopEdit}
          style={{ ...inputStyle, padding: '4px 8px', fontSize: 11.5 }}
        />
      ) : (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{node.subtitle}</div>
      )}

      {node.hasInput && (
        <div
          data-port-in={node.id}
          style={{
            position: 'absolute', left: -6, top: 38, width: 12, height: 12, borderRadius: '50%',
            background: '#0D0F1A', border: '2.5px solid #5B7CFA',
          }}
        />
      )}
      {node.hasOutput && (
        <div
          onMouseDown={onConnectStart}
          style={{
            position: 'absolute', right: -6, top: 38, width: 12, height: 12, borderRadius: '50%',
            background: '#5B7CFA', border: '2.5px solid #0D0F1A', cursor: 'crosshair',
          }}
        />
      )}
    </div>
  );
}

function Avatar({ igProfile, size = 32 }) {
  if (igProfile?.profilePicture) {
    return (
      <img
        src={igProfile.profilePicture} alt={igProfile.username || 'Instagram'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: IG_GRADIENT, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" stroke="#fff" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" />
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 22px 2px', color: '#fff' }}>
      <span style={{ fontSize: 13.5, fontWeight: 700 }}>10:40</span>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 100, height: 20, borderRadius: 11, background: '#000' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill="#fff" /><rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="#fff" /><rect x="9" y="3" width="3" height="8" rx="0.6" fill="#fff" /></svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="#fff" strokeWidth="1.3"><path d="M1 4a10 10 0 0 1 13 0" /><path d="M3.5 6.5a6.5 6.5 0 0 1 8 0" /><circle cx="7.5" cy="9" r="1" fill="#fff" stroke="none" /></svg>
        <svg width="24" height="12" viewBox="0 0 24 12"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="#fff" fill="none" /><rect x="2" y="2" width="17" height="8" rx="1" fill="#fff" /><rect x="21" y="4" width="2" height="4" rx="1" fill="#fff" /></svg>
      </div>
    </div>
  );
}

function PhonePreview({ form, mediaList, previewTab, igProfile }) {
  const selectedMedia = mediaList.filter((m) => form.selectedPostIds.includes(m.id));
  const previewPost = selectedMedia[0] || mediaList[0] || null;

  return (
    <div style={{
      width: 340, borderRadius: 40, border: '9px solid #14151c', background: '#000',
      boxShadow: '0 24px 60px rgba(0,0,0,0.55)', overflow: 'hidden',
    }}>
      <div style={{ position: 'relative' }}>
        <StatusBar />
      </div>

      <div style={{ background: '#000', height: 596 }}>
        {previewTab === 'Post' && <PostPreview post={previewPost} igProfile={igProfile} />}
        {previewTab === 'Comments' && <CommentsPreview post={previewPost} form={form} igProfile={igProfile} />}
        {previewTab === 'DM' && <FlowPreview form={form} igProfile={igProfile} />}
      </div>
    </div>
  );
}

function PostPreview({ post, igProfile }) {
  const username = igProfile?.username || 'your_account';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
        <Icon name="arrowLeft" size={18} style={{ color: '#8E8E93' }} />
        <div style={{ flex: 1, textAlign: 'center', marginRight: 18 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8E8E93', letterSpacing: '0.06em' }}>{username.toUpperCase()}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Posts</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <Avatar igProfile={igProfile} size={30} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{username}</div>
          <div style={{ marginLeft: 'auto', color: '#8E8E93', fontSize: 18 }}>⋯</div>
        </div>
        <div style={{ width: '100%', aspectRatio: '1', background: '#111' }}>
          {post ? (
            <img src={post.media_url || post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8E8E93', fontSize: 12.5, textAlign: 'center', padding: 20 }}>
              Select a post to preview
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', color: '#fff' }}>
          <Icon name="smile" size={22} />
          <Icon name="mail" size={20} />
          <Icon name="send" size={20} />
          <div style={{ marginLeft: 'auto' }}>
            <Icon name="tag" size={20} />
          </div>
        </div>
        {post?.caption && (
          <div style={{ padding: '0 14px 16px', fontSize: 12.5, color: '#ddd', lineHeight: 1.4 }}>
            <strong style={{ color: '#fff' }}>{username}</strong> {post.caption}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsPreview({ post, form, igProfile }) {
  const username = igProfile?.username || 'your_account';
  const sampleComment = form.commentMatchType === 'KEYWORDS' && form.keywordsText.trim()
    ? form.keywordsText.split(',')[0].trim()
    : 'price 🙋';
  const reply = form.commentReply.trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Dimmed post strip behind the sheet */}
      <div style={{ height: 60, opacity: 0.35, overflow: 'hidden', flexShrink: 0 }}>
        {post && <img src={post.media_url || post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      <div style={{ flex: 1, background: '#141414', borderRadius: '18px 18px 0 0', marginTop: -14, display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <div style={{ width: 20 }} />
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff' }}>Comments</div>
          <Icon name="send" size={18} style={{ color: '#fff' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3a3a3a', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: '#fff' }}><strong>Username</strong> <span style={{ color: '#8E8E93', fontWeight: 400 }}>Now</span></div>
              <div style={{ fontSize: 13, color: '#eee', marginTop: 2 }}>{sampleComment}</div>
              <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 4 }}>Reply</div>
            </div>
            <span style={{ fontSize: 13, color: '#8E8E93', flexShrink: 0 }}>♡</span>
          </div>

          {reply && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Avatar igProfile={igProfile} size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#5B9BFF' }}><strong>{username}</strong> <span style={{ color: '#8E8E93', fontWeight: 400 }}>Now</span></div>
                <div style={{ fontSize: 13, color: '#5B9BFF', marginTop: 2 }}>{reply}</div>
                <div style={{ fontSize: 11.5, color: '#8E8E93', marginTop: 4 }}>Reply</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, padding: '8px 16px', fontSize: 19 }}>
          {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((e) => <span key={e}>{e}</span>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px' }}>
          <Avatar igProfile={igProfile} size={26} />
          <div style={{ flex: 1, background: '#242424', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, color: '#8E8E93' }}>
            Add a comment for {username}...
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowPreview({ form, igProfile }) {
  const opening = form.openingMessage.trim();
  const openingBtn = form.openingButtonName.trim() || 'Send me the link';
  const final = form.finalMessage.trim();
  const finalCtas = form.finalCtaButtons.filter((b) => b.name?.trim());
  const username = igProfile?.username || 'Instagram';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
      }}>
        <Icon name="arrowLeft" size={19} style={{ color: '#fff' }} />
        <Avatar igProfile={igProfile} size={32} />
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', flex: 1 }}>{username}</div>
        <Icon name="phone" size={17} style={{ color: '#fff' }} />
        <Icon name="video" size={19} style={{ color: '#fff' }} />
      </div>

      {/* Chat body — full flow, stacked as a conversation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 1. Opening DM — text + button rendered together, one bubble */}
        {opening ? (
          <>
            <MessageCard text={opening} buttons={openingBtn ? [openingBtn] : []} />
            <UserBubble text={openingBtn} />
          </>
        ) : (
          <EmptyHint text="Type your opening DM to preview it here..." />
        )}

        {/* 2. Final DM — optional media, text, and buttons together, one bubble */}
        {final ? (
          <MessageCard
            text={final}
            buttons={finalCtas.map((b) => b.name)}
            media={form.finalMediaType !== 'NONE' && form.finalMediaUrl.trim() ? { type: form.finalMediaType, url: form.finalMediaUrl.trim() } : null}
          />
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

/**
 * One combined bubble matching how Instagram actually renders a button
 * template: optional media on top, then text, then each button as a full-
 * width row separated by a hairline — all in a single message, not floating
 * pieces.
 */
function MessageCard({ text, buttons = [], media }) {
  const cleanButtons = buttons.filter(Boolean);
  if (!text && cleanButtons.length === 0 && !media) return null;

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
      <div style={{ background: '#262626', borderRadius: '18px 18px 18px 4px', overflow: 'hidden' }}>
        {media?.url && <MediaBlock type={media.type} url={media.url} />}
        {text && (
          <div style={{ padding: '10px 15px', color: '#fff', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {text}
          </div>
        )}
        {cleanButtons.map((label, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 15px', color: '#5B9BFF', fontSize: 13.5, fontWeight: 600,
              textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaBlock({ type, url }) {
  if (type === 'IMAGE') {
    return (
      <img
        src={url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  if (type === 'VIDEO') {
    return (
      <div style={{ position: 'relative', background: '#000', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="video" size={20} style={{ color: '#fff' }} />
        </div>
      </div>
    );
  }
  if (type === 'YOUTUBE') {
    return (
      <div style={{ position: 'relative', background: '#111', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 52, height: 36, borderRadius: 8, background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '13px solid #fff', marginLeft: 3 }} />
        </div>
      </div>
    );
  }
  if (type === 'FILE') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(91,124,250,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="file" size={16} style={{ color: '#7E97FF' }} />
        </div>
        <div style={{ fontSize: 12, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url.split('/').pop() || url}
        </div>
      </div>
    );
  }
  return null;
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

function EmptyHint({ text }) {
  return <div style={{ color: '#8E8E93', fontSize: 12.5, fontStyle: 'italic', padding: '6px 4px' }}>{text}</div>;
}
