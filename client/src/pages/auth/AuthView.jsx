import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { authAPI } from '../../lib/api';

/* ── Logo ─────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: 'var(--grad)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
      }}>N</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>Nexora Labs</div>
    </div>
  );
}

/* ── Divider ─────────────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0', color: 'var(--muted-2)', fontSize: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--glass-brd)' }} />
      <span>OR</span>
      <div style={{ flex: 1, height: 1, background: 'var(--glass-brd)' }} />
    </div>
  );
}

/* ── Main Auth View ──────────────────────────────────────── */
export default function AuthView() {
  const { state, dispatch, showToast, login } = useApp();
  const { screen } = state;

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'online' | 'offline' | 'unknown'

  // Shared form state
  const [form, setForm] = useState({
    name: '',
    email: 'aarav@nexoralabs.io',
    password: 'password123',
    confirm: '',
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* ── Helpers ─────────────────────────────────────────────── */
  /** Returns true if the error is a network/connection error (server offline) */
  function isNetworkError(err) {
    return !err.response; // axios sets response=undefined for network errors
  }

  /** Handle successful API response — store token + user */
  function handleAuthSuccess(data) {
    // Store token in localStorage for future Axios requests
    if (data.token) {
      localStorage.setItem('nexora_token', data.token);
    }
    login({ token: data.token, user: data.user });
    setServerStatus('online');
  }

  /* ── Login ───────────────────────────────────────────────── */
  async function doLogin() {
    if (!form.email.trim()) return showToast('Enter your email address', 'error');
    if (!form.password) return showToast('Enter your password', 'error');

    setLoading(true);
    try {
      const res = await authAPI.login({ email: form.email.trim(), password: form.password });
      handleAuthSuccess(res.data);
      showToast(`Welcome back, ${res.data.user.name}! 👋`, 'success');
    } catch (err) {
      if (isNetworkError(err)) {
        // Server offline — use demo mode
        setServerStatus('offline');
        showToast('Server offline — using demo mode', 'default');
        login({
          user: { name: 'Aarav Sharma', email: form.email.trim(), initials: 'AS' },
        });
      } else {
        // Server responded with an error (wrong password, not found, etc.)
        setServerStatus('online');
        const msg = err.response?.data?.message || 'Login failed. Please try again.';
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Google Login ─────────────────────────────────────────── */
  async function doGoogleLogin() {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin();
      handleAuthSuccess(res.data);
      showToast('Signed in with Google ✓', 'success');
    } catch (err) {
      if (isNetworkError(err)) {
        setServerStatus('offline');
        showToast('Server offline — demo Google sign-in', 'default');
        login({ user: { name: 'Aarav Sharma', email: 'aarav@nexoralabs.io', initials: 'AS' } });
      } else {
        showToast(err.response?.data?.message || 'Google login failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Register ────────────────────────────────────────────── */
  async function doRegister() {
    if (!form.name.trim()) return showToast('Enter your full name', 'error');
    if (!form.email.trim()) return showToast('Enter your email address', 'error');
    if (!form.password || form.password.length < 6) return showToast('Password must be at least 6 characters', 'error');

    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      handleAuthSuccess(res.data);
      showToast('Account created! Welcome to Nexora 🎉', 'success');
    } catch (err) {
      if (isNetworkError(err)) {
        setServerStatus('offline');
        showToast('Server offline — demo account created', 'default');
        const initials = form.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        login({ user: { name: form.name.trim(), email: form.email.trim(), initials } });
      } else {
        showToast(err.response?.data?.message || 'Registration failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Forgot Password ─────────────────────────────────────── */
  async function doForgot() {
    if (!form.email.trim()) return showToast('Enter your email address', 'error');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(form.email.trim());
      showToast(res.data.message || `Reset link sent to ${form.email}`, 'success');
      setTimeout(() => dispatch({ type: 'SET_SCREEN', payload: 'reset' }), 1000);
    } catch (err) {
      if (isNetworkError(err)) {
        showToast(`Reset link sent to ${form.email} (demo)`, 'success');
        setTimeout(() => dispatch({ type: 'SET_SCREEN', payload: 'reset' }), 1000);
      } else {
        showToast(err.response?.data?.message || 'Could not send reset link', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Reset Password ──────────────────────────────────────── */
  async function doReset() {
    if (!form.password) return showToast('Enter a new password', 'error');
    if (form.password !== form.confirm) return showToast('Passwords do not match', 'error');
    setLoading(true);
    try {
      await authAPI.resetPassword({ password: form.password, confirmPassword: form.confirm });
      showToast('Password updated — please log in', 'success');
      dispatch({ type: 'SET_SCREEN', payload: 'login' });
    } catch (err) {
      if (isNetworkError(err)) {
        showToast('Password updated (demo) — please log in', 'success');
        dispatch({ type: 'SET_SCREEN', payload: 'login' });
      } else {
        showToast(err.response?.data?.message || 'Reset failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Field helper ────────────────────────────────────────── */
  const Field = ({ label, fieldKey, type = 'text', placeholder = '' }) => (
    <div className="field">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type === 'password' && showPass ? 'text' : type}
          value={form[fieldKey]}
          onChange={set(fieldKey)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' && screen === 'login') doLogin(); }}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex',
            }}
          >
            <Icon name={showPass ? 'eyeOff' : 'eye'} />
          </button>
        )}
      </div>
    </div>
  );

  /* ── Server status indicator ─────────────────────────────── */
  const StatusDot = () => {
    if (serverStatus === 'unknown') return null;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted-2)', marginBottom: 10 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: serverStatus === 'online' ? 'var(--success)' : 'var(--warn)',
          display: 'inline-block',
        }} />
        {serverStatus === 'online' ? 'Server connected' : 'Server offline — demo mode'}
      </div>
    );
  };

  /* ── Layout constants ────────────────────────────────────── */
  const orbStyle = (pos) => ({
    position: 'absolute', width: 480, height: 480, borderRadius: '50%',
    filter: 'blur(90px)', opacity: 0.35, zIndex: 0,
    background: pos === 'a' ? 'var(--blue)' : 'var(--purple)',
    ...(pos === 'a' ? { top: -140, left: -140 } : { bottom: -160, right: -120 }),
  });

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div style={orbStyle('a')} />
      <div style={orbStyle('b')} />

      <div className="glass" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 410, padding: '34px 32px' }}>
        <LogoMark />
        <StatusDot />

        {/* ── LOGIN ── */}
        {screen === 'login' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 6 }}>Welcome back</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 26 }}>
              Log in to manage your conversations & automations.
            </div>

            <Field label="Email address" fieldKey="email" type="email" placeholder="you@company.com" />
            <Field label="Password" fieldKey="password" type="password" placeholder="••••••••" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember me
              </label>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_SCREEN', payload: 'forgot' }); }}
                style={{ fontSize: 13, color: '#9BB1FF', fontWeight: 600 }}
              >
                Forgot password?
              </a>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={doLogin} disabled={loading}>
              {loading ? (
                <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Logging in…</>
              ) : 'Log in'}
            </button>

            <Divider />

            <button className="btn" style={{ width: '100%' }} onClick={doGoogleLogin} disabled={loading}>
              <Icon name="globe" /> Continue with Google
            </button>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'var(--muted)' }}>
              Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_SCREEN', payload: 'register' }); }} style={{ color: '#9BB1FF', fontWeight: 600 }}>
                Sign up free
              </a>
            </div>

            {/* Demo hint */}
            <div style={{ marginTop: 16, padding: '8px 12px', borderRadius: 8, background: 'rgba(91,124,250,0.08)', border: '1px solid rgba(91,124,250,0.2)', fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>
              Demo: <strong style={{ color: '#9BB1FF' }}>aarav@nexoralabs.io</strong> · <strong style={{ color: '#9BB1FF' }}>password123</strong>
            </div>
          </>
        )}

        {/* ── REGISTER ── */}
        {screen === 'register' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 6 }}>Create your account</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 26 }}>Start your 14-day free trial. No credit card required.</div>

            <Field label="Full name" fieldKey="name" placeholder="Jordan Lee" />
            <Field label="Work email" fieldKey="email" type="email" placeholder="you@company.com" />
            <Field label="Password" fieldKey="password" type="password" placeholder="Create a password (min. 6 chars)" />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', marginBottom: 18, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> I agree to the Terms & Privacy Policy
            </label>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={doRegister} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <Divider />
            <button className="btn" style={{ width: '100%' }} onClick={doGoogleLogin} disabled={loading}>
              <Icon name="globe" /> Continue with Google
            </button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'var(--muted)' }}>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_SCREEN', payload: 'login' }); }} style={{ color: '#9BB1FF', fontWeight: 600 }}>Log in</a>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {screen === 'forgot' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 6 }}>Reset your password</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 26 }}>Enter your email and we'll send a reset link.</div>
            <Field label="Email address" fieldKey="email" type="email" placeholder="you@company.com" />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={doForgot} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_SCREEN', payload: 'login' }); }} style={{ color: '#9BB1FF' }}>
                ← Back to login
              </a>
            </div>
          </>
        )}

        {/* ── RESET PASSWORD ── */}
        {screen === 'reset' && (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 6 }}>Set a new password</div>
            <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 26 }}>Choose a strong password you haven't used before.</div>
            <Field label="New password" fieldKey="password" type="password" placeholder="New password" />
            <Field label="Confirm password" fieldKey="confirm" type="password" placeholder="Confirm password" />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={doReset} disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
