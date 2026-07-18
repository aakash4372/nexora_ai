import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Icon from '../components/Icon';
import { ModalHead } from '../components/Modal';

const STATUS_BADGE = { Live: 'badge-green', Paused: 'badge-orange', Draft: 'badge-gray' };

export default function Automations() {
  const { state, dispatch, showToast, openModal, closeModal } = useApp();
  const [view, setView] = useState('list'); // list | builder
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([
    { id: 1, type: 'trigger', label: 'New Follower', x: 40, y: 40 },
    { id: 2, type: 'condition', label: 'Is first DM?', x: 300, y: 40 },
    { id: 3, type: 'action', label: 'Send Welcome DM', x: 300, y: 180 },
    { id: 4, type: 'action', label: 'Add Tag: Lead', x: 300, y: 310 },
  ]);

  const NODE_COLORS = { trigger: '#5B7CFA', condition: '#F5A623', action: '#2ED598' };

  function openCreateModal() {
    let name = '', trigger = '';
    openModal(
      <div>
        <ModalHead title="New Automation" />
        <div className="field"><label>Automation name</label><input id="auto-name" type="text" placeholder="e.g. Welcome DM Flow" /></div>
        <div className="field">
          <label>Trigger</label>
          <select id="auto-trigger">
            <option>New Follower</option>
            <option>Keyword: order</option>
            <option>Comment</option>
            <option>Story Reply</option>
            <option>DM received</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
            const n = document.getElementById('auto-name').value.trim();
            const t = document.getElementById('auto-trigger').value;
            if (!n) return showToast('Enter a name', 'error');
            const newItem = { id: Date.now(), name: n, trigger: t, status: 'Paused', runs: 0 };
            dispatch({ type: 'ADD_AUTOMATION', payload: newItem });
            showToast('Automation created', 'success');
            closeModal();
          }}>Create</button>
        </div>
      </div>
    );
  }

  /* ── Drag logic for flow nodes ── */
  function startDrag(e, nodeId) {
    e.preventDefault();
    const canvas = e.currentTarget.closest('[data-canvas]');
    const rect = canvas.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    const offsetX = e.clientX - rect.left - node.x;
    const offsetY = e.clientY - rect.top - node.y;
    function onMove(me) {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: me.clientX - rect.left - offsetX, y: me.clientY - rect.top - offsetY } : n));
    }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 23, marginBottom: 4 }}>Automations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>Build powerful workflows to automate your customer communication.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${view === 'list' ? '' : 'btn-ghost'}`} onClick={() => setView('list')}><Icon name="layers" /> List</button>
          <button className={`btn ${view === 'builder' ? 'btn-primary' : ''}`} onClick={() => setView('builder')}><Icon name="zap" /> Flow Builder</button>
          <button className="btn btn-primary" onClick={openCreateModal}><Icon name="plus" /> New Automation</button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Trigger</th><th>Status</th><th>Runs</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {state.automations.map((a) => (
                  <tr key={a.id} className="row-btn">
                    <td><span style={{ fontWeight: 700 }}>{a.name}</span></td>
                    <td><span className="badge badge-blue">{a.trigger}</span></td>
                    <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{a.runs.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" onClick={() => { dispatch({ type: 'TOGGLE_AUTOMATION', id: a.id }); showToast(`${a.status === 'Live' ? 'Paused' : 'Published'}`, 'success'); }}>
                          {a.status === 'Live' ? 'Pause' : 'Publish'}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setView('builder')}><Icon name="edit" /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => { dispatch({ type: 'DELETE_AUTOMATION', id: a.id }); showToast('Automation deleted'); }}>
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
          {/* Node palette */}
          <div className="card" style={{ padding: '14px 12px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Add Node</div>
            {[
              { type: 'trigger', label: 'Trigger', icon: 'zap', color: '#5B7CFA' },
              { type: 'condition', label: 'Condition', icon: 'filter', color: '#F5A623' },
              { type: 'action', label: 'Send Message', icon: 'send', color: '#2ED598' },
              { type: 'action', label: 'Add Tag', icon: 'tag', color: '#A855F7' },
              { type: 'action', label: 'Assign Agent', icon: 'users', color: '#FB6B6B' },
              { type: 'action', label: 'Wait', icon: 'clock', color: '#9398B3' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => { setNodes(prev => [...prev, { id: Date.now(), type: item.type, label: item.label, x: 40 + Math.random() * 100, y: 40 + Math.random() * 200 }]); showToast(`Added ${item.label} node`); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--glass-brd)', background: 'rgba(255,255,255,0.03)', marginBottom: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(91,124,250,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-brd)'; }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={item.icon} style={{ width: 12, height: 12, stroke: item.color }} />
                </div>
                {item.label}
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div
            data-canvas="1"
            style={{
              position: 'relative', height: 560,
              border: '1px dashed var(--glass-brd)', borderRadius: 18,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              background: 'rgba(255,255,255,0.015)',
              overflow: 'hidden',
            }}
          >
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`flow-node${selectedNode === node.id ? ' selected' : ''}`}
                style={{ left: node.x, top: node.y }}
                onClick={() => setSelectedNode(node.id)}
                onMouseDown={(e) => startDrag(e, node.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: `${NODE_COLORS[node.type]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_COLORS[node.type] }} />
                  </div>
                  <span style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', color: NODE_COLORS[node.type] }}>{node.type}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{node.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
