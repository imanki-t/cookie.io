import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CookieLogo } from './Logo';

/* ── Password strength ── */
function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)  s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#10b981'];
  const labels = ['Very weak','Weak','Fair','Strong','Very strong'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div className="pw-strength-bar">
        {[1,2,3,4,5].map((i) => (
          <div
            key={i}
            className="pw-strength-seg"
            style={{ background: i <= score ? colors[score - 1] : 'var(--accents-2)', transition: 'background 0.2s' }}
          />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: 10, marginTop: 3, color: colors[score - 1], transition: 'color 0.2s' }}>
          {labels[score - 1]}
        </p>
      )}
    </div>
  );
}

/* ── Floating label input ── */
function FloatingInput({
  label, type = 'text', value, onChange, error, autoComplete, minLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState(false);
  const inputType = type === 'password' ? (showPass ? 'text' : 'password') : type;
  const hasValue  = value.length > 0;
  const lifted    = focused || hasValue;

  return (
    <div className="floating-input-wrapper">
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder=" "
          className={`floating-input ${error ? 'error' : ''}`}
          style={focused ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-border)' } : {}}
        />
        <label
          className="floating-label"
          style={{
            top: lifted ? 10 : '50%',
            transform: lifted ? 'none' : 'translateY(-50%)',
            fontSize: lifted ? 9.5 : 12.5,
            fontWeight: lifted ? 700 : 400,
            letterSpacing: lifted ? '0.06em' : 0,
            textTransform: lifted ? 'uppercase' : 'none',
            color: focused ? 'var(--accent)' : lifted ? 'var(--accents-4)' : 'var(--accents-4)',
          }}
        >
          {label}
        </label>
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accents-4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 10.5, color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/* ── Main auth page ── */
export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    const errs: Record<string, string> = {};
    if (!username.trim())         errs.username = 'Required';
    else if (username.trim().length < 2) errs.username = 'Min 2 characters';
    if (!password)                errs.password = 'Required';
    else if (password.length < 6) errs.password = 'Min 6 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName.trim() || username.trim());
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode((m) => m === 'login' ? 'register' : 'login');
    setErrors({}); setGlobalError('');
    setUsername(''); setPassword(''); setDisplayName('');
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card"
      >
        {/* Top accent bar */}
        <div className="auth-accent-bar" />

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <motion.div
              initial={{ scale: 0.85, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
            >
              <CookieLogo className="w-12 h-12" style={{ marginBottom: 10 }} />
            </motion.div>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 8 }}>
              cookie<span style={{ color: 'var(--accent)' }}>.io</span>
            </h1>
            <p style={{ fontSize: 11, color: 'var(--accents-5)', marginTop: 3 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="auth-tab-bar" style={{ marginBottom: 20 }}>
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => mode !== 'login' && switchMode()}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => mode !== 'register' && switchMode()}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <FloatingInput
                    label="Display name (optional)"
                    value={displayName}
                    onChange={setDisplayName}
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <FloatingInput
              label="Username"
              value={username}
              onChange={setUsername}
              error={errors.username}
              autoComplete={mode === 'login' ? 'username' : 'new-user'}
              minLength={2}
            />

            <FloatingInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />

            {mode === 'register' && <PasswordStrength password={password} />}

            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 12px',
                    borderRadius: 'var(--r-md)',
                    fontSize: 12,
                    color: 'var(--danger)',
                    background: 'var(--danger-bg)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    marginBottom: 12,
                    marginTop: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {globalError}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn"
              style={{ background: 'var(--fg)', color: 'var(--bg)', marginTop: 8 }}
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, marginTop: 16, color: 'var(--accents-4)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              style={{
                fontWeight: 600,
                color: 'var(--accents-6)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
