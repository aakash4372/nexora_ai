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

const sectionLabelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#fff',
  marginBottom: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

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
  const { state, showToast, openModal, closeModal } = useApp();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState([]);

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [mediaList, setMediaList] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const workspaceName = state.workspace?.name || 'Default Workspace';

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

  const openCreateModal = async () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowBuilder(true);
    setMediaLoading(true);
    try {
      const res = await instagramAPI.getMedia(workspaceName);
      if (res.data.success) setMediaList(res.data.media || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  const openEditModal = async (automation) => {
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
    setShowBuilder(true);
    setMediaLoading(true);
    try {
      const res = await instagramAPI.getMedia(workspaceName);
      if (res.data.success) setMediaList(res.data.media || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
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
        setShowBuilder(false);
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
          onClick={openCreateModal}
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
            onClick={openCreateModal}
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
                  onClick={() => openEditModal(a)}
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

      {showBuilder && (
        <BuilderModal
          form={form}
          setForm={setForm}
          mediaList={mediaList}
          mediaLoading={mediaLoading}
          togglePostSelection={togglePostSelection}
          updateFinalCta={updateFinalCta}
          addFinalCta={addFinalCta}
          removeFinalCta={removeFinalCta}
          onCancel={() => setShowBuilder(false)}
          onSave={handleSave}
          saving={saving}
          editing={!!editingId}
        />
      )}
    </div>
  );
}

function BuilderModal({
  form, setForm, mediaList, mediaLoading, togglePostSelection,
  updateFinalCta, addFinalCta, removeFinalCta, onCancel, onSave, saving, editing,
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18,
        width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{editing ? 'Edit Automation' : 'New Comment-to-DM Automation'}</h2>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Reply to a comment, then follow up with an automated DM</div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Automation Name (Optional)</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Course Launch Post"
              style={inputStyle}
            />
          </div>

          {/* Step 1: Post/Reel picker */}
          <div>
            <div style={sectionLabelStyle}><span>1️⃣</span> Select Posts &amp; Reels</div>
            {mediaLoading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading your posts...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
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
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
              {form.selectedPostIds.length === 0 ? 'None selected — this automation will apply to ALL posts.' : `${form.selectedPostIds.length} post(s)/reel(s) selected.`}
            </div>
          </div>

          {/* Step 2: Comment condition */}
          <div>
            <div style={sectionLabelStyle}><span>2️⃣</span> Comment Condition</div>
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
          </div>

          {/* Step 3: Comment reply */}
          <div>
            <div style={sectionLabelStyle}><span>3️⃣</span> Comment Reply (Public)</div>
            <input
              type="text" value={form.commentReply}
              onChange={(e) => setForm((f) => ({ ...f, commentReply: e.target.value }))}
              placeholder='"Thanks! Please check your DM 😊"'
              style={inputStyle}
            />
          </div>

          {/* Step 4: Opening DM */}
          <div>
            <div style={sectionLabelStyle}><span>4️⃣</span> Opening DM</div>
            <textarea
              rows={3} value={form.openingMessage}
              onChange={(e) => setForm((f) => ({ ...f, openingMessage: e.target.value }))}
              placeholder={'Hey 👋\nThanks for your interest.\n\nClick below to continue.'}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
            />
            <label style={labelStyle}>Button Name</label>
            <input
              type="text" value={form.openingButtonName}
              onChange={(e) => setForm((f) => ({ ...f, openingButtonName: e.target.value }))}
              placeholder="Send me the link"
              style={inputStyle}
            />
          </div>

          {/* Step 5: Follow gate (optional) */}
          <div>
            <div
              onClick={() => setForm((f) => ({ ...f, requireFollow: !f.requireFollow }))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: form.requireFollow ? 12 : 0 }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${form.requireFollow ? '#E1306C' : 'var(--muted)'}`,
                background: form.requireFollow ? '#E1306C' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {form.requireFollow && <Icon name="check" size={12} style={{ color: '#fff' }} />}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Ask user to follow before continuing (Optional)</span>
            </div>
            {form.requireFollow && (
              <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                  Instagram doesn't provide a way to verify follows via API — the user self-confirms by tapping the button below.
                </div>
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
          </div>

          {/* Step 6: Final DM */}
          <div>
            <div style={sectionLabelStyle}><span>5️⃣</span> Final DM</div>
            <textarea
              rows={3} value={form.finalMessage}
              onChange={(e) => setForm((f) => ({ ...f, finalMessage: e.target.value }))}
              placeholder={"Here's your link 👇\n\nhttps://yourwebsite.com"}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
            />
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

        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
    </div>
  );
}
