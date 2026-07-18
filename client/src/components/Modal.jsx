import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Icon from './Icon';

export default function Modal() {
  const { state, closeModal } = useApp();
  const { modal } = state;

  // Close on Escape
  useEffect(() => {
    if (!modal) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, closeModal]);

  if (!modal) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8888,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      {/* Overlay */}
      <div
        onClick={closeModal}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(4,5,10,0.72)', backdropFilter: 'blur(4px)',
          animation: 'fadeIn .15s ease',
        }}
      />
      {/* Box */}
      <div
        className="modal-enter"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: modal.wide ? 760 : 520,
          maxHeight: '86vh',
          overflow: 'auto',
          background: '#12141F',
          border: '1px solid var(--glass-brd)',
          borderRadius: 20,
          padding: 26,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        {modal.content}
      </div>
    </div>
  );
}

/* ─── Modal head helper ──────────────────────────────────── */
export function ModalHead({ title, onClose }) {
  const { closeModal } = useApp();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h3 style={{ fontSize: 19 }}>{title}</h3>
      <button className="btn btn-icon btn-ghost" onClick={onClose || closeModal}>
        <Icon name="x" />
      </button>
    </div>
  );
}
