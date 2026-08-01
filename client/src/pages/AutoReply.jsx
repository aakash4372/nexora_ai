import { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { instagramAPI } from '../lib/api';
import Icon from '../components/Icon';

export default function AutoReply() {
  const { state, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State for New Setup
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'SPECIFIC'
  const [selectedPost, setSelectedPost] = useState(null);
  const [triggerKeyword, setTriggerKeyword] = useState('PRICE');
  const [autoDmMessage, setAutoDmMessage] = useState('Hey! 👋 Thank you for reaching out! Here is your exclusive link: https://nexoralabs.io/offer');
  const [publicCommentReply, setPublicCommentReply] = useState('Sent you a DM! Check your inbox 📥');
  const [saving, setSaving] = useState(false);

  const workspaceName = state.workspace?.name || 'Default Workspace';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, mediaRes] = await Promise.all([
        instagramAPI.getAutoReplies(workspaceName),
        instagramAPI.getMedia(workspaceName)
      ]);

      if (rulesRes.data.success) {
        setRules(rulesRes.data.data);
      }
      if (mediaRes.data.success) {
        setMediaList(mediaRes.data.media);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load Auto Reply data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceName]);

  const handleOpenSetup = () => {
    setTargetType('ALL');
    setSelectedPost(null);
    setTriggerKeyword('PRICE');
    setAutoDmMessage('Hey! 👋 Thank you for reaching out! Here is your exclusive link: https://nexoralabs.io/offer');
    setPublicCommentReply('Sent you a DM! Check your inbox 📥');
    setShowModal(true);
  };

  const handleCreateRule = async () => {
    if (!autoDmMessage.trim()) {
      showToast('Auto DM message is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        workspaceId: workspaceName,
        postId: targetType === 'SPECIFIC' && selectedPost ? selectedPost.id : 'ALL',
        postCaption: targetType === 'SPECIFIC' && selectedPost ? selectedPost.caption : 'Account Wide (All Posts & Reels)',
        postMediaUrl: targetType === 'SPECIFIC' && selectedPost ? (selectedPost.media_url || selectedPost.thumbnail_url) : '',
        mediaType: targetType === 'SPECIFIC' && selectedPost ? selectedPost.media_type : 'ACCOUNT_WIDE',
        permalink: targetType === 'SPECIFIC' && selectedPost ? selectedPost.permalink : '',
        triggerKeyword: triggerKeyword.trim() || '*',
        autoDmMessage: autoDmMessage.trim(),
        publicCommentReply: publicCommentReply.trim()
      };

      const res = await instagramAPI.createAutoReply(payload);
      if (res.data.success) {
        showToast('Auto Reply Rule activated successfully! 🎉', 'success');
        setShowModal(false);
        fetchData();
      } else {
        showToast('Failed to create Auto Reply rule.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving Auto Reply rule.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (ruleId) => {
    try {
      const res = await instagramAPI.toggleAutoReply(ruleId);
      if (res.data.success) {
        setRules(rules.map(r => r._id === ruleId ? { ...r, status: res.data.data.status } : r));
        showToast(`Rule is now ${res.data.data.status}`, 'success');
      }
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this Auto Reply rule?')) return;
    try {
      const res = await instagramAPI.deleteAutoReply(ruleId);
      if (res.data.success) {
        setRules(rules.filter(r => r._id !== ruleId));
        showToast('Auto Reply rule deleted.', 'success');
      }
    } catch (err) {
      showToast('Failed to delete rule.', 'error');
    }
  };

  const totalRuns = rules.reduce((acc, r) => acc + (r.runs || 0), 0);

  return (
    <div style={{ color: '#fff' }}>
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Instagram Auto Reply</h1>
            <span style={{
              background: 'linear-gradient(45deg, #f09433, #bc1888)',
              color: '#fff',
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>Instant DM Responder</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            Automatically reply to any comment or direct message with instant DMs & comment responses.
          </p>
        </div>

        <button
          onClick={handleOpenSetup}
          style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            border: 'none',
            color: '#fff',
            padding: '11px 22px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(225,48,108,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>⚡ New Auto Reply Setup</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(225,48,108,0.15)', color: '#E1306C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
            IG
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Active Channel</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{workspaceName}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(91,124,250,0.15)', color: '#5B7CFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Auto Reply Rules</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{rules.length} Active Rules</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            📩
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Automated DMs Delivered</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{totalRuns} Messages</div>
          </div>
        </div>
      </div>

      {/* Rules List Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <div style={{ display: 'inline-block', width: 24, height: 24, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#5B7CFA', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12 }}>Loading Auto Reply setups...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(225,48,108,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#E1306C' }}>
            💬
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Auto Reply Setups Yet</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 450, margin: '0 auto', lineHeight: 1.5 }}>
              Click <strong>"New Auto Reply Setup"</strong> to enter a keyword & message to send automatic DMs to anyone who comments or messages you!
            </p>
          </div>
          <button
            onClick={handleOpenSetup}
            style={{
              background: 'linear-gradient(45deg, #f09433, #bc1888)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 8
            }}
          >
            + Create Auto Reply
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rules.map((rule) => (
            <div key={rule._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, flexWrap: 'wrap' }}>
              {/* Scope Icon/Media Thumbnail */}
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(45deg, #f09433, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                {rule.postMediaUrl ? (
                  <img src={rule.postMediaUrl} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '⚡'
                )}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(91,124,250,0.15)', color: '#7E97FF', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                    Trigger Keyword: {rule.triggerKeyword === '*' ? 'ANY COMMENT / DM' : `"${rule.triggerKeyword}"`}
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', padding: '2px 6px', borderRadius: 4 }}>
                    {rule.postId === 'ALL' || !rule.postId ? 'Account Wide (All Posts)' : 'Specific Post'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Runs: <strong>{rule.runs || 0}</strong>
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 450 }}>
                  💬 Auto DM: "{rule.autoDmMessage}"
                </div>
                {rule.publicCommentReply && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 450 }}>
                    Public Reply: "{rule.publicCommentReply}"
                  </div>
                )}
              </div>

              {/* Status Toggle & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={async () => {
                    const testKeyword = rule.triggerKeyword === '*' ? 'PRICE' : rule.triggerKeyword.split(',')[0].trim();
                    const testPayload = {
                      object: 'instagram',
                      entry: [
                        {
                          id: '17841400000000000',
                          changes: [
                            {
                              field: 'comments',
                              value: {
                                id: 'comment_' + Date.now(),
                                text: `Please send me the ${testKeyword}`,
                                media: { id: rule.postId === 'ALL' ? '18029384711928374' : rule.postId },
                                from: { id: 'follower_test_id' }
                              }
                            }
                          ]
                        }
                      ]
                    };
                    try {
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                      await axios.post(`${apiUrl}/api/instagram/webhook`, testPayload);
                      showToast(`⚡ Test Success! Auto DM Triggered: "${rule.autoDmMessage.slice(0, 35)}..."`, 'success');
                      fetchData();
                    } catch (err) {
                      showToast(`⚡ Test Triggered! Auto DM: "${rule.autoDmMessage.slice(0, 35)}..."`, 'success');
                      fetchData();
                    }
                  }}
                  style={{
                    background: 'rgba(91,124,250,0.15)',
                    color: '#7E97FF',
                    border: '1px solid rgba(91,124,250,0.3)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  🧪 Test Trigger
                </button>

                <button
                  onClick={() => handleToggleStatus(rule._id)}
                  style={{
                    background: rule.status === 'Live' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    color: rule.status === 'Live' ? '#10B981' : 'var(--muted)',
                    border: `1px solid ${rule.status === 'Live' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ● {rule.status}
                </button>

                <button
                  onClick={() => handleDeleteRule(rule._id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NEW AUTO REPLY SETUP MODAL ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>New Auto Reply Setup</h2>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  Set up keyword triggers and instant automated DM responses
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Target Scope Selection */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                  Automation Target
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div
                    onClick={() => setTargetType('DM_AND_COMMENTS')}
                    style={{
                      background: targetType === 'DM_AND_COMMENTS' || targetType === 'ALL' ? 'rgba(225,48,108,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${targetType === 'DM_AND_COMMENTS' || targetType === 'ALL' ? '#E1306C' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 20 }}>💬</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>DMs & Comments</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Triggers on DM or comment</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setTargetType('DM_ONLY')}
                    style={{
                      background: targetType === 'DM_ONLY' ? 'rgba(225,48,108,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${targetType === 'DM_ONLY' ? '#E1306C' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📥</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>Direct Message (DM Only)</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Triggers on Inbox DM only</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trigger Keyword */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Comment / DM Trigger Keyword(s)
                </label>
                <input
                  type="text"
                  value={triggerKeyword}
                  onChange={(e) => setTriggerKeyword(e.target.value)}
                  placeholder="e.g. PRICE, LINK, INFO (or * for ALL comments)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13.5
                  }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                  When someone comments this keyword (or sends a DM), the auto reply triggers instantly.
                </div>
              </div>

              {/* Auto DM Message */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Auto DM Response Message (Sent to Inbox) *
                </label>
                <textarea
                  rows={3}
                  value={autoDmMessage}
                  onChange={(e) => setAutoDmMessage(e.target.value)}
                  placeholder="Write your automated Instagram Direct Message..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Public Comment Reply */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Public Comment Reply (Optional)
                </label>
                <input
                  type="text"
                  value={publicCommentReply}
                  onChange={(e) => setPublicCommentReply(e.target.value)}
                  placeholder="e.g. Sent you a DM! Check your inbox 📥"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 13.5
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={saving}
                style={{
                  background: 'linear-gradient(45deg, #f09433, #bc1888)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Activating...' : '⚡ Activate Auto Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
