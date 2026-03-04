import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CookieLogo } from './Logo';

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

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];
  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score - 1] : 'var(--accents-2)' }} />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: score ? colors[score - 1] : 'var(--accents-4)' }}>
        {password ? labels[score - 1] : ''}
      </p>
    </div>
  );
}

function FloatingInput({
  label, type = 'text', value, onChange, error, autoComplete, minLength
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string;
  autoComplete?: string; minLength?: number;
}) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState(false);
  const inputType = type === 'password' ? (showPass ? 'text' : 'password') : type;
  const hasValue = value.length > 0;

  return (
    <div className="relative mb-4">
      <div className={`relative rounded-xl border transition-all duration-200 ${
        focused ? 'border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-border)]' :
        error   ? 'border-red-400' : 'border-[var(--accents-2)]'
      } bg-[var(--accents-1)] overflow-hidden`}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder=" "
          className="w-full pt-5 pb-2 px-4 bg-transparent text-[var(--fg)] text-sm outline-none peer"
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <label className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${(focused || hasValue)
            ? 'top-2 text-[10px] font-semibold tracking-wider uppercase text-[var(--accent)]'
            : 'top-1/2 -translate-y-1/2 text-sm text-[var(--accents-4)]'
          }
        `}>{label}</label>
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accents-4)] hover:text-[var(--fg)] transition-colors"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Required';
    else if (username.trim().length < 2) errs.username = 'Min 2 characters';
    if (!password) errs.password = 'Required';
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card"
      >
        {/* Top accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-[var(--accent)] via-orange-400 to-[var(--accent)] animate-[gradient-slide_3s_linear_infinite] bg-[length:200%_100%]" />

        <div className="p-8 pb-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              <CookieLogo className="w-14 h-14 mb-3" />
            </motion.div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              cookie<span className="text-accent">.io</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--accents-5)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode()}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-[var(--bg)] shadow-sm text-[var(--fg)]'
                    : 'text-[var(--accents-5)] hover:text-[var(--fg)]'
                }`}
                style={{ border: mode === m ? '1px solid var(--accents-2)' : '1px solid transparent' }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-0">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
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
                  className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-400"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  {globalError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-2"
                style={{ background: 'var(--fg)', color: 'var(--bg)' }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--accents-4)' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={switchMode} className="underline underline-offset-2 font-medium transition-colors hover:text-[var(--accent)]"
              style={{ color: 'var(--accents-6)' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
