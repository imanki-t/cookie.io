import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─── Floating SVG elements ─────────────────────────────── */
function FloatingElement({
  x, y, delay, duration, children, opacity = 0.6,
}: {
  x: number; y: number; delay: number; duration: number;
  children: React.ReactNode; opacity?: number;
}) {
  return (
    <motion.div
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, opacity }}
      animate={{
        y: [0, -16, -8, -20, 0],
        x: [0, 4, -3, 2, 0],
        rotate: [0, 5, -3, 2, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Sparkle dot ───────────────────────────────────────── */
function Sparkle({ x, y, delay, size = 4 }: { x: number; y: number; delay: number; size?: number }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--accent)',
        pointerEvents: 'none',
      }}
      animate={{ scale: [0, 1.2, 0], opacity: [0, 0.8, 0] }}
      transition={{
        duration: 2 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: 3 + Math.random() * 4,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ─── Background scene ──────────────────────────────────── */
function AuthBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Warm gradient blobs */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(217,119,6,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.10) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, -15, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(180,83,9,0.07) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Dot grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--accents-2) 1.2px, transparent 1.2px)',
        backgroundSize: '28px 28px',
        opacity: 0.7,
      }} />

      {/* Floating quill pen */}
      <FloatingElement x={8} y={15} delay={0} duration={5} opacity={0.2}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M28 4C28 4 20 6 12 18L10 28L20 22C28 14 28 4 28 4Z"
            stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18C12 18 8 14 8 10" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 28L12 18" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </FloatingElement>

      {/* Floating book */}
      <FloatingElement x={85} y={20} delay={1.5} duration={6} opacity={0.18}>
        <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
          <rect x="2" y="4" width="14" height="20" rx="1" stroke="var(--accent)" strokeWidth="1.4"/>
          <rect x="20" y="4" width="14" height="20" rx="1" stroke="var(--accent)" strokeWidth="1.4"/>
          <path d="M16 4v20M2 7h12M2 11h12M2 15h8" stroke="var(--accent)" strokeWidth="1" opacity="0.6"/>
          <path d="M22 7h12M22 11h12M22 15h8" stroke="var(--accent)" strokeWidth="1" opacity="0.6"/>
        </svg>
      </FloatingElement>

      {/* Floating star */}
      <FloatingElement x={75} y={70} delay={0.8} duration={4.5} opacity={0.22}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
            stroke="var(--accent)" strokeWidth="1.4" fill="var(--accent-bg)"/>
        </svg>
      </FloatingElement>

      {/* Floating ink dot */}
      <FloatingElement x={15} y={72} delay={2.2} duration={7} opacity={0.2}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 4 8 4 13a6 6 0 0012 0C16 8 10 2 10 2z"
            stroke="var(--accent)" strokeWidth="1.4" fill="var(--accent-bg)"/>
        </svg>
      </FloatingElement>

      {/* Floating leaf */}
      <FloatingElement x={88} y={55} delay={3} duration={6.5} opacity={0.16}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 18C4 18 6 10 14 6C20 3 20 3 20 3C20 3 18 10 12 14C8 17 4 18 4 18Z"
            stroke="var(--accent)" strokeWidth="1.4" fill="var(--accent-bg)"/>
          <path d="M4 18L10 11" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </FloatingElement>

      {/* Floating diamond */}
      <FloatingElement x={5} y={45} delay={1.2} duration={5.5} opacity={0.18}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2L16 9L9 16L2 9L9 2Z" stroke="var(--accent)" strokeWidth="1.4" fill="var(--accent-bg)"/>
        </svg>
      </FloatingElement>

      {/* Sparkles */}
      <Sparkle x={20} y={30} delay={0} size={5} />
      <Sparkle x={80} y={25} delay={1.5} size={4} />
      <Sparkle x={60} y={75} delay={0.8} size={6} />
      <Sparkle x={35} y={85} delay={2.5} size={4} />
      <Sparkle x={92} y={45} delay={1} size={5} />
      <Sparkle x={10} y={60} delay={3} size={4} />
      <Sparkle x={50} y={10} delay={0.5} size={5} />
      <Sparkle x={70} y={88} delay={2} size={4} />
    </div>
  );
}

/* ─── Password strength ──────────────────────────────────── */
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
  const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#16a34a'];
  const labels = ['Very weak','Weak','Fair','Strong','Very strong'];
  if (!password) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 8 }}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4,5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 9999,
              background: i <= score ? colors[score - 1] : 'var(--accents-2)',
              transition: 'background 0.25s',
            }}
          />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: 10.5, marginTop: 4, color: colors[score - 1], transition: 'color 0.25s' }}>
          {labels[score - 1]}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Floating label input ──────────────────────────────── */
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
            fontSize: lifted ? 9.5 : 13,
            fontWeight: lifted ? 700 : 400,
            letterSpacing: lifted ? '0.06em' : 0,
            textTransform: lifted ? 'uppercase' : 'none',
            color: focused ? 'var(--accent)' : lifted ? 'var(--accents-4)' : 'var(--accents-4)',
            transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
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
              right: 13,
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
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 11, color: 'var(--danger)', marginTop: 5 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─── Cookie SVG Logo — professional ───────────────────── */
function AuthLogo() {
  return (
    <motion.div
      initial={{ scale: 0.7, rotate: -12, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
      style={{ marginBottom: 14 }}
    >
      <motion.div
        animate={{ rotate: [0, 4, -3, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Warm glow ring */}
          <circle cx="32" cy="33" r="28" fill="rgba(217,119,6,0.08)" />
          <circle cx="32" cy="33" r="24" fill="rgba(217,119,6,0.05)" />
          {/* Main cookie body */}
          <path
            d="M32 7C40 7 47.5 10.5 52 16C56 21 58 27 58 33C58 39 56 45 52 49.5C48 54 42 57 36 58C30 59 24 57.5 19 55C14 52 10 47 8 41C6 36 6 30 8 24.5C10 19 13.5 14 18 11C22 8 27 7 32 7Z"
            fill="#D97706"
          />
          {/* Cookie surface — lighter shade */}
          <path
            d="M32 10C39.5 10 46.5 13.2 51 18.5C55 23 57 29 57 33C57 38.5 55 44 51 48C47 52 41.5 55 36 55.8C30 56.7 24.5 55.2 19.5 52.5C15 50 11 45.5 9 40C7.2 35 7.2 29.5 9 24C11 18.5 14.5 14 19 11.2C23 8.7 27.5 10 32 10Z"
            fill="#F59E0B"
            opacity="0.95"
          />
          {/* Light highlight on cookie */}
          <ellipse cx="22" cy="19" rx="10" ry="6" fill="white" opacity="0.10" transform="rotate(-20 22 19)" />
          {/* Chocolate chips — larger, more prominent */}
          <ellipse cx="19" cy="27" rx="5" ry="4.2" fill="#78350F" opacity="0.90" transform="rotate(-12 19 27)" />
          <ellipse cx="37" cy="23" rx="4.5" ry="3.8" fill="#78350F" opacity="0.90" transform="rotate(9 37 23)" />
          <ellipse cx="25" cy="40" rx="5" ry="4" fill="#78350F" opacity="0.90" transform="rotate(-6 25 40)" />
          <ellipse cx="44" cy="37" rx="4" ry="3.4" fill="#78350F" opacity="0.85" transform="rotate(14 44 37)" />
          <ellipse cx="33" cy="48" rx="3.5" ry="2.8" fill="#78350F" opacity="0.80" transform="rotate(-5 33 48)" />
          {/* Chip highlights */}
          <ellipse cx="17" cy="25.5" rx="1.6" ry="1" fill="white" opacity="0.28" transform="rotate(-12 17 25.5)" />
          <ellipse cx="35.5" cy="21.5" rx="1.4" ry="0.9" fill="white" opacity="0.28" transform="rotate(9 35.5 21.5)" />
          {/* Bite mark indicator — small notch */}
          <path d="M53 15C53 15 57 12 60 14C60 14 58 18 55 17C53 16 53 15 53 15Z" fill="var(--bg)" />
          {/* Small decorative dots */}
          <circle cx="52" cy="14" r="5" fill="var(--bg)" />
          <circle cx="44" cy="10" r="2.2" fill="#F59E0B" opacity="0.7" />
          <circle cx="48" cy="7" r="1.4" fill="#F59E0B" opacity="0.5" />
          <circle cx="53" cy="9" r="1.3" fill="#F59E0B" opacity="0.45" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main auth page ─────────────────────────────────────── */
export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]               = useState<'login' | 'register'>('login');
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    const errs: Record<string, string> = {};
    if (!username.trim())              errs.username = 'Required';
    else if (username.trim().length < 2) errs.username = 'Min 2 characters';
    if (!password)                     errs.password = 'Required';
    else if (password.length < 6)      errs.password = 'Min 6 characters';
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
    <div
      className="auth-page"
      style={{
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AuthBackground />

      {/* Warm top vignette */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '200px',
        background: 'linear-gradient(to bottom, rgba(217,119,6,0.06), transparent)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main card */}
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          animation: 'warm-glow 4s ease-in-out infinite',
        }}
      >
        {/* Top gradient accent bar */}
        <div className="auth-accent-bar" />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Logo + branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
            <AuthLogo />
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                lineHeight: 1,
                marginBottom: 5,
              }}
            >
              cookie<span style={{ color: 'var(--accent)' }}>.io</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 }}
              style={{ fontSize: 12, color: 'var(--accents-5)', textAlign: 'center', lineHeight: 1.5 }}
            >
              {mode === 'login' ? 'Welcome back — your notes await' : 'Create your writing space'}
            </motion.p>
          </div>

          {/* Mode tabs */}
          <motion.div
            className="auth-tab-bar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: 22 }}
          >
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
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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

            {/* Global error */}
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 13px',
                    borderRadius: 'var(--r-md)',
                    fontSize: 12.5,
                    color: 'var(--danger)',
                    background: 'var(--danger-bg)',
                    border: '1.5px solid rgba(220,38,38,0.2)',
                    marginBottom: 13,
                    marginTop: 6,
                    overflow: 'hidden',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {globalError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="auth-btn"
              style={{ background: 'var(--fg)', color: 'var(--bg)', marginTop: 10 }}
              whileHover={!loading ? { scale: 1.01, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={14} />
                  </motion.span>
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Switch mode */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{ textAlign: 'center', fontSize: 12, marginTop: 18, color: 'var(--accents-4)' }}
          >
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              style={{
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </motion.p>

          {/* Features row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--accents-2)',
            }}
          >
            {[
              { icon: '🔒', label: 'Private' },
              { icon: '⚡', label: 'Real-time' },
              { icon: '📖', label: 'Markdown' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  color: 'var(--accents-4)',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: 'var(--accents-4)',
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        cookie.io — write beautifully
      </motion.p>
    </div>
  );
}
