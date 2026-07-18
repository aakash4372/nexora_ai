import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Icon from './Icon';

/* ─── Single Toast ─────────────────────────────────────── */
function Toast({ toast }) {
  const { dispatch } = useApp();
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id: toast.id });
    }, 2800);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, dispatch]);

  const dotColor =
    toast.type === 'success' ? 'var(--success)' :
    toast.type === 'error' ? 'var(--danger)' :
    'var(--blue)';

  const borderColor =
    toast.type === 'success' ? 'rgba(46,213,152,0.35)' :
    toast.type === 'error' ? 'rgba(251,107,107,0.35)' :
    'var(--glass-brd)';

  return (
    <div
      className="toast-enter"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderRadius: 12, background: 'rgba(18,20,34,0.95)', border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(20px)', fontSize: 13.5, fontWeight: 500,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)', maxWidth: 320,
        transition: 'opacity .2s, transform .2s',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'block' }} />
      <span style={{ flex: 1 }}>{toast.msg}</span>
      <button
        onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

/* ─── Toast Container ──────────────────────────────────── */
export default function ToastContainer() {
  const { state } = useApp();
  return (
    <div style={{
      position: 'fixed', bottom: 22, right: 22, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
    }}>
      {state.toasts.map((t) => <Toast key={t.id} toast={t} />)}
    </div>
  );
}
