import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Icon from './Icon';

function Dropdown({ children, trigger, alignLeft = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>{trigger}</div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)',
          [alignLeft ? 'left' : 'right']: 0,
          minWidth: 220, background: '#12141F',
          border: '1px solid var(--glass-brd)', borderRadius: 14, padding: 8, zIndex: 500,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'modalIn .15s ease',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DdItem({ icon, label, onClick, sub }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9,
        fontSize: 13.5, color: 'var(--text)', fontWeight: 500, cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {icon && <Icon name={icon} style={{ color: 'var(--muted)' }} />}
      <div>
        <div>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function DdSep() {
  return <div style={{ height: 1, background: 'var(--glass-brd)', margin: '6px 4px' }} />;
}

export default function Topbar() {
  const { state, dispatch, showToast, goPage, logout, openModal, closeModal } = useApp();

  const openCreateMenu = () => {
    openModal(
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 19 }}>Create new</h3>
          <button className="btn btn-icon btn-ghost" onClick={closeModal}><Icon name="x" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: 'automation', label: 'Automation', sub: 'Build a new flow' },
            { icon: 'campaigns', label: 'Campaign', sub: 'Broadcast message' },
            { icon: 'contacts', label: 'Contact', sub: 'Add manually' },
            { icon: 'ai', label: 'AI Reply', sub: 'Draft with AI' },
          ].map((item) => (
            <button
              key={item.label}
              className="btn"
              style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px 16px', borderRadius: 12, gap: 6, height: 'auto' }}
              onClick={() => { closeModal(); goPage(item.label.toLowerCase()); }}
            >
              <Icon name={item.icon} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.label}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400 }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      height: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
      borderBottom: '1px solid var(--glass-brd)', background: 'rgba(10,12,22,0.75)',
      backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 200,
    }}>
      {/* Hamburger */}
      <button className="btn btn-icon btn-ghost" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
        <Icon name="menu" />
      </button>

      {/* Workspace switcher */}
      <Dropdown
        alignLeft
        trigger={
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
            borderRadius: 12, border: '1px solid var(--glass-brd)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, background: 'var(--grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            }}>
              {state.workspace.name[0]}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{state.workspace.name}</span>
            <Icon name="chevronDown" />
          </div>
        }
      >
        <DdItem icon="building" label="Switch Account" onClick={() => dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: null })} />
        <DdSep />
        <DdItem icon="plus" label="Create workspace" onClick={() => dispatch({ type: 'SET_ACTIVE_ACCOUNT', payload: null })} />
      </Dropdown>

      {/* Search bar */}
      <div
        onClick={() => showToast('Global search coming soon')}
        style={{
          flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--glass-brd)', color: 'var(--muted)', fontSize: 13.5, cursor: 'pointer',
        }}
      >
        <Icon name="search" style={{ width: 16, height: 16 }} />
        <span>Search contacts, conversations, campaigns…</span>
        <span className="kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Create */}
        <button className="btn btn-icon btn-primary" onClick={openCreateMenu} title="Create">
          <Icon name="plus" />
        </button>

        {/* Theme toggle */}
        <button className="btn btn-icon" onClick={() => showToast('Dark mode on (design locked)')} title="Theme">
          <Icon name="sun" />
        </button>

        {/* Notifications */}
        <Dropdown
          trigger={
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <div className="btn btn-icon"><Icon name="bell" /></div>
              <span style={{
                position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                borderRadius: '50%', background: 'var(--danger)', border: '2px solid var(--bg)',
              }} />
            </div>
          }
        >
          <div style={{ padding: '6px 10px 10px', fontWeight: 700, fontSize: 13 }}>Notifications</div>
          <DdItem label="Riya Kapoor sent a new message" sub="2 minutes ago" onClick={() => { goPage('inbox'); showToast('Opened conversation'); }} />
          <DdItem label='Automation "Welcome DM" published' sub="10 minutes ago" onClick={() => { goPage('automations'); }} />
          <DdItem label="Invoice #1042 paid" sub="1 hour ago" onClick={() => { goPage('billing'); }} />
        </Dropdown>

        {/* Profile */}
        <Dropdown
          trigger={
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px',
              borderRadius: 999, border: '1px solid var(--glass-brd)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
            }}>
              <div className="avatar-sm">{state.user.initials}</div>
              <Icon name="chevronDown" />
            </div>
          }
        >
          <div style={{ padding: '8px 11px 6px' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{state.user.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{state.user.email}</div>
          </div>
          <DdSep />
          <DdItem icon="settings" label="Settings" onClick={() => goPage('settings')} />
          <DdItem icon="billing" label="Billing" onClick={() => goPage('billing')} />
          <DdSep />
          <DdItem icon="logout" label="Log out" onClick={logout} />
        </Dropdown>
      </div>
    </div>
  );
}
