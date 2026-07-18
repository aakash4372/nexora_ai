import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';

const TEMPLATES = [
  { label: 'Welcome message', prompt: 'Write a warm welcome message for a new Instagram follower who just DM\'d us.' },
  { label: 'Order delayed apology', prompt: 'Write a sincere apology for an order that\'s been delayed by 3 days.' },
  { label: 'Discount offer', prompt: 'Write a friendly message offering a 15% discount code to a hesitant customer.' },
  { label: 'Product recommendation', prompt: 'Recommend complementary products based on a customer asking about [product].' },
];

export default function AIAssist() {
  const { showToast } = useApp();
  const [msgs, setMsgs] = useState([
    { from: 'ai', text: 'Hi! I\'m your Nexora AI assistant. I can help you draft replies, suggest automations, or answer questions about your data.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('nexora-ai-pro');
  const [activeTab, setActiveTab] = useState('chat');

  const AI_RESPONSES = [
    'Great question! Based on your conversation history, I suggest responding with empathy first and then offering a concrete solution.',
    'Here\'s a suggested reply: "Thank you for reaching out! We value your business and want to make this right. Here\'s what we can do..."',
    'I\'ve analyzed your top conversations. Most customers ask about shipping (42%), product availability (28%), and returns (18%).',
    'Your "Welcome DM Flow" automation has a 94% engagement rate. Consider adding a product showcase as a follow-up step.',
  ];

  function sendMsg() {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input.trim() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMsgs(prev => [...prev, { from: 'ai', text: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)] }]);
      setLoading(false);
    }, 1400);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>AI Assist</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Your AI-powered communication co-pilot.</p>
        </div>
        <select value={model} onChange={(e) => setModel(e.target.value)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', color: 'var(--text)', padding: '8px 14px', borderRadius: 999, fontSize: 13.5 }}>
          <option value="nexora-ai-pro">Nexora AI Pro</option>
          <option value="nexora-ai-fast">Nexora AI Fast</option>
          <option value="gpt4o">GPT-4o</option>
        </select>
      </div>

      <div className="tab-row">
        {['chat', 'templates', 'knowledge'].map((t) => (
          <div key={t} className={`tab-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ textTransform: 'capitalize' }}>{t === 'knowledge' ? 'Knowledge Base' : t === 'chat' ? 'AI Chat' : 'Templates'}</div>
        ))}
      </div>

      {activeTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Chat messages */}
            <div style={{ height: 380, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, maxWidth: '80%', alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', flexDirection: m.from === 'user' ? 'row-reverse' : 'row' }}>
                  {m.from === 'ai' && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>✦</div>
                  )}
                  <div style={{ padding: '10px 14px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, background: m.from === 'user' ? 'var(--grad)' : 'rgba(168,85,247,0.15)', border: m.from === 'user' ? 'none' : '1px solid rgba(168,85,247,0.3)' }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✦</div>
                  <div style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                    <div className="typing-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div style={{ borderTop: '1px solid var(--glass-brd)', padding: 12, display: 'flex', gap: 8 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMsg(); }} placeholder="Ask AI anything…" style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-brd)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 13.5, outline: 'none' }} />
              <button className="btn btn-primary btn-icon" onClick={sendMsg} disabled={!input.trim() || loading}><Icon name="send" /></button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Quick Prompts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Summarize today\'s conversations', 'Which contacts need follow-up?', 'Generate weekly report', 'Suggest automation improvements'].map((p) => (
                <button key={p} className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 12.5, textAlign: 'left', borderRadius: 10, padding: '8px 12px', border: '1px solid var(--glass-brd)' }} onClick={() => { setInput(p); }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {TEMPLATES.map((t) => (
            <div key={t.label} className="card" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('chat'); setInput(t.prompt); showToast('Template loaded into chat'); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{t.label}</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{t.prompt}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div>
          <div className="kb-drop" style={{ cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => showToast('File upload coming soon')}>
            <Icon name="upload" style={{ width: 32, height: 32, stroke: 'var(--muted)', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Drop files here or click to upload</div>
            <div style={{ fontSize: 12, color: 'var(--muted-2)' }}>PDF, DOCX, TXT, CSV up to 25MB</div>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Knowledge Sources</div>
            {[
              { name: 'Product FAQ v3.pdf', size: '1.2 MB', status: 'Active' },
              { name: 'Shipping Policy.docx', size: '340 KB', status: 'Active' },
              { name: 'Returns Guide.txt', size: '88 KB', status: 'Indexing' },
            ].map((f) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--glass-brd)', borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="file" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f.size}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${f.status === 'Active' ? 'badge-green' : 'badge-orange'}`}>{f.status}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => showToast('File removed')}><Icon name="trash" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
