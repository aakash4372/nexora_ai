import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { conversationsAPI } from '../lib/api';

const CHAN_COLOR = { instagram: '#E1306C', whatsapp: '#25D366', facebook: '#1877F2' };
const CHAN_BADGE = { instagram: 'badge-purple', whatsapp: 'badge-green', facebook: 'badge-blue' };

const FILTERS = [
  { id: 'all', label: 'All', count: null },
  { id: 'unread', label: 'Unread', count: 3 },
  { id: 'assigned', label: 'Assigned to me', count: null },
  { id: 'ai', label: 'AI handled', count: null },
  { id: 'instagram', label: 'Instagram', count: null },
  { id: 'whatsapp', label: 'WhatsApp', count: null },
  { id: 'facebook', label: 'Facebook', count: null },
];

export default function Inbox() {
  const { state, dispatch, showToast } = useApp();
  const [msgText, setMsgText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await conversationsAPI.list();
        if (response.data?.success) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.data });
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        showToast('Failed to load conversations', 'error');
      }
    }
    loadConversations();
  }, [dispatch, showToast]);

  const convs = state.conversations.filter((c) => {
    if (state.inboxFilter === 'unread') return c.unread > 0;
    if (state.inboxFilter === 'assigned') return c.assigned !== 'Unassigned';
    if (state.inboxFilter === 'ai') return c.assigned === 'AI';
    if (['instagram', 'whatsapp', 'facebook'].includes(state.inboxFilter)) return c.channel === state.inboxFilter;
    return true;
  });

  const selectedConv = state.conversations.find((c) => c.id === state.selectedConvId);

  function selectConv(id) {
    dispatch({ type: 'SET_SELECTED_CONV', payload: id });
    dispatch({ type: 'MARK_READ', convId: id });
    conversationsAPI.update(id, { unread: 0 }).catch((err) => console.error(err));
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    const textToSend = msgText.trim();
    setMsgText('');
    try {
      const response = await conversationsAPI.sendMessage(state.selectedConvId, { text: textToSend });
      if (response.data?.success) {
        dispatch({ type: 'ADD_MESSAGE', convId: state.selectedConvId, payload: response.data.data });
        showToast('Message sent', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    }
  }

  function handleAiSuggest() {
    setAiLoading(true);
    setTimeout(() => {
      setMsgText('Thank you for reaching out! I\'d be happy to help you with that. Could you share a bit more detail so I can assist you better?');
      setAiLoading(false);
      showToast('AI suggestion generated', 'success');
    }, 1200);
  }

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [selectedConv?.msgs]);

  const MsgBubble = ({ msg }) => {
    const isOut = msg.from === 'out';
    const isAI = msg.from === 'ai';
    return (
      <div style={{ display: 'flex', gap: 8, maxWidth: '72%', alignSelf: isOut ? 'flex-end' : 'flex-start', flexDirection: isOut ? 'row-reverse' : 'row' }}>
        {!isOut && (
          <div className="avatar-md" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, background: isAI ? 'rgba(168,85,247,0.3)' : 'var(--grad)' }}>
            {isAI ? '✦' : selectedConv?.name.split(' ').map(w => w[0]).join('')}
          </div>
        )}
        <div>
          <div style={{
            padding: '10px 14px', borderRadius: 16, fontSize: 13.5, lineHeight: 1.5,
            background: isOut ? 'var(--grad)' : isAI ? 'rgba(168,85,247,0.16)' : 'rgba(255,255,255,0.06)',
            border: isOut ? 'none' : isAI ? '1px solid rgba(168,85,247,0.3)' : '1px solid var(--glass-brd)',
          }}>
            {msg.text}
          </div>
          {isAI && <div style={{ fontSize: 10, color: 'var(--muted-2)', marginTop: 3 }}>✦ AI handled</div>}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 23, marginBottom: 4 }}>Inbox</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Manage all your customer conversations in one place.</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '190px 300px 1fr',
        border: '1px solid var(--glass-brd)', borderRadius: 18, overflow: 'hidden',
        background: 'var(--glass)', backdropFilter: 'blur(16px)',
        height: 'calc(100vh - 200px)', minHeight: 500,
      }}>
        {/* ── Filter col ── */}
        <div style={{ borderRight: '1px solid var(--glass-brd)', overflowY: 'auto', padding: '14px 10px' }}>
          {FILTERS.map((f) => (
            <div
              key={f.id}
              onClick={() => dispatch({ type: 'SET_INBOX_FILTER', payload: f.id })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                color: state.inboxFilter === f.id ? '#DCE3FF' : 'var(--muted)',
                background: state.inboxFilter === f.id ? 'var(--grad-soft)' : 'transparent',
                marginBottom: 2,
              }}
            >
              {f.label}
              {f.count && <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 999, background: 'rgba(91,124,250,0.25)', color: '#B9C6FF', fontWeight: 700 }}>{f.count}</span>}
            </div>
          ))}
        </div>

        {/* ── Conversation list ── */}
        <div style={{ borderRight: '1px solid var(--glass-brd)', overflowY: 'auto' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--glass-brd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', color: 'var(--muted)', fontSize: 13 }}>
              <Icon name="search" style={{ width: 14, height: 14 }} />
              <span>Search…</span>
            </div>
          </div>
          {convs.map((c) => (
            <div
              key={c.id}
              onClick={() => selectConv(c.id)}
              style={{
                display: 'flex', gap: 10, padding: '13px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: state.selectedConvId === c.id ? 'var(--grad-soft)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
            >
              <div className="avatar-md" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0, background: `${CHAN_COLOR[c.channel]}33` }}>
                {c.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{c.last}</span>
                  {c.unread > 0 && (
                    <span style={{ background: 'var(--grad)', color: '#fff', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Thread + customer panel ── */}
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread head */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--glass-brd)', flexShrink: 0 }}>
              <div className="avatar-md">{selectedConv.name.split(' ').map(w => w[0]).join('')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedConv.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>via <span style={{ textTransform: 'capitalize' }}>{selectedConv.channel}</span> · {selectedConv.assigned}</div>
              </div>
              <button className="btn btn-sm" onClick={() => showToast('Assigned to Priya')}>Assign</button>
              <button className="btn btn-sm btn-ghost" onClick={() => showToast('Conversation resolved', 'success')}>Resolve</button>
            </div>

            {/* Messages */}
            <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedConv.msgs.map((msg) => <MsgBubble key={msg.id} msg={msg} />)}
              {selectedConv.typing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="avatar-md" style={{ width: 28, height: 28, fontSize: 10 }}>{selectedConv.name.split(' ').map(w => w[0]).join('')}</div>
                  <div style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-brd)' }}>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid var(--glass-brd)', padding: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={handleAiSuggest} disabled={aiLoading}>
                  <Icon name="sparkle" /> {aiLoading ? 'Generating…' : 'AI Suggest'}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast('Attach file')}><Icon name="paperclip" /></button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast('Insert emoji')}><Icon name="smile" /></button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast('Voice message')}><Icon name="mic" /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex: 1, resize: 'none', height: 42, padding: '11px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', color: 'var(--text)', fontSize: 13.5, outline: 'none' }}
                />
                <button className="btn btn-primary btn-icon" onClick={sendMessage} disabled={!msgText.trim()}>
                  <Icon name="send" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Icon name="inbox" style={{ width: 38, height: 38, stroke: 'var(--muted-2)', marginBottom: 14 }} />
            <h4>Select a conversation</h4>
            <p>Choose a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}
