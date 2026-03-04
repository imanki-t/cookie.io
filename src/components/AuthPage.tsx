import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
  KeyRound,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowRight,
  Command,
  MonitorSmartphone,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CookieLogo } from './Logo';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
interface AuthContextError extends Error {
  code?: string;
  details?: string;
}

type AuthMode = 'login' | 'register';
type LoginMethod = 'password' | 'magic_link';

// ==========================================
// 2. DESIGN SYSTEM: ANIMATION VARIANTS
// ==========================================
const geistTransitions = {
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  ease:[0.25, 0.1, 0.25, 1],
  smooth: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: geistTransitions.smooth },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const shakeVariants = {
  shake: { x:[0, -4, 4, -4, 4, 0], transition: { duration: 0.4 } },
};

// ==========================================
// 3. DESIGN SYSTEM: ICONS (CUSTOM SVGS)
// ==========================================
const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const AppleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.365 14.86c-.035-2.616 2.14-3.882 2.238-3.939-.187-1.455-1.637-2.645-2.91-2.766-1.258-.2-2.648.647-3.414.647-.768 0-1.956-.723-3.14-.64-1.57.08-3.08 1.01-3.926 2.435-1.745 2.94-1.21 7.158.46 9.497.838 1.171 1.848 2.518 3.12 2.473 1.233-.047 1.728-.774 3.22-.774 1.492 0 1.952.774 3.23.75 1.31-.02 2.18-1.213 2.99-2.385.94-1.328 1.33-2.62 1.34-2.687-.025-.01-2.482-.937-2.208-2.611zM14.69 7.422c.666-.788 1.11-1.88 1.02-3.007-1.02.04-2.24.66-2.935 1.456-.62.695-1.155 1.8-1.028 2.895 1.127.08 2.28-.582 2.943-1.344z" />
  </svg>
);

// ==========================================
// 4. DESIGN SYSTEM: UI COMPONENTS
// ==========================================

// --- Button ---
interface GeistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const GeistButton = React.forwardRef<HTMLButtonElement, GeistButtonProps>(
  ({ children, variant = 'primary', loading, fullWidth, icon, className = '', disabled, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center gap-2 h-10 px-4 text-[14px] font-medium rounded-[6px] transition-all duration-200 outline-none select-none overflow-hidden group";
    const variants = {
      primary: "bg-[#111] text-white hover:bg-[#333] active:bg-[#000] disabled:bg-[#888] disabled:text-[#eaeaea]",
      secondary: "bg-white text-[#111] border border-[#eaeaea] hover:border-[#888] hover:bg-[#fafafa] active:bg-[#eaeaea] disabled:text-[#888] disabled:bg-[#fafafa]",
      ghost: "bg-transparent text-[#666] hover:text-[#111] hover:bg-[#eaeaea] active:bg-[#ddd]",
      danger: "bg-white text-[#e00] border border-[#ffcdcd] hover:bg-[#fff0f0] active:bg-[#ffe1e1]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Loader2 size={16} className="animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 w-full"
            >
              {icon && <span className="shrink-0">{icon}</span>}
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);
GeistButton.displayName = 'GeistButton';

// --- Input ---
interface GeistInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
}

const GeistInput = React.forwardRef<HTMLInputElement, GeistInputProps>(
  ({ label, error, hint, prefixIcon, type = 'text', className = '', ...props }, ref) => {
    const [showPass, setShowPass] = useState(false);
    const [focused, setFocused] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5 mb-4 relative w-full">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-[13px] font-medium text-[#111]">{label}</label>
          <AnimatePresence>
            {error && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12px] text-[#e00] font-medium flex items-center gap-1"
              >
                <AlertCircle size={12} />
                {error}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        <motion.div
          variants={shakeVariants}
          animate={error ? "shake" : ""}
          className="relative flex items-center group w-full"
        >
          {prefixIcon && (
            <div className="absolute left-3 text-[#888] pointer-events-none">
              {prefixIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={`
              w-full h-10 text-[14px] text-[#111] bg-white 
              border rounded-[6px] outline-none transition-all duration-200
              placeholder:text-[#888] shadow-sm
              ${prefixIcon ? 'pl-9' : 'pl-3'}
              ${isPassword ? 'pr-10' : 'pr-3'}
              ${error 
                ? 'border-[#e00] focus:ring-[2px] focus:ring-[#ffcdcd] focus:border-[#e00]' 
                : 'border-[#eaeaea] hover:border-[#888] focus:border-[#111] focus:ring-[2px] focus:ring-[#eaeaea]'
              }
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 text-[#888] hover:text-[#111] transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-[#eaeaea]"
              tabIndex={-1}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {/* Animated Focus Ring / Active state border highlight (Geist Style) */}
          <div 
            className={`absolute inset-0 pointer-events-none border rounded-[6px] transition-opacity duration-300 ${focused && !error ? 'border-[#111] opacity-10' : 'opacity-0'}`}
          />
        </motion.div>
        
        {hint && !error && (
          <p className="text-[12px] text-[#888] px-0.5 mt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);
GeistInput.displayName = 'GeistInput';

// --- Checkbox ---
const GeistCheckbox = ({ 
  label, checked, onChange 
}: { 
  label: React.ReactNode, checked: boolean, onChange: (v: boolean) => void 
}) => {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group select-none">
      <div className="relative flex items-center justify-center w-[18px] h-[18px] mt-[1px]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className={`
          w-full h-full border rounded-[4px] transition-all duration-200
          ${checked ? 'bg-[#111] border-[#111]' : 'bg-white border-[#eaeaea] group-hover:border-[#888]'}
          peer-focus-visible:ring-2 peer-focus-visible:ring-[#eaeaea]
        `} />
        <motion.div
          initial={false}
          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={geistTransitions.spring}
          className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
        >
          <Check size={12} strokeWidth={3} />
        </motion.div>
      </div>
      <span className="text-[13px] text-[#666] group-hover:text-[#111] transition-colors leading-tight pt-[2px]">
        {label}
      </span>
    </label>
  );
};

// --- Divider ---
const GeistDivider = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="relative flex items-center w-full my-6">
      <div className="flex-grow border-t border-[#eaeaea]"></div>
      {children && (
        <span className="flex-shrink-0 px-4 text-[12px] text-[#888] uppercase tracking-wider font-medium bg-white">
          {children}
        </span>
      )}
      <div className="flex-grow border-t border-[#eaeaea]"></div>
    </div>
  );
};

// --- Tooltip ---
const GeistTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const[isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#111] text-white text-[12px] font-medium rounded-[6px] whitespace-nowrap z-50 shadow-lg pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#111]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 5. COMPLEX UI: PASSWORD STRENGTH METER
// ==========================================
function PasswordStrengthAnalyzer({ password }: { password: string }) {
  const requirements =[
    { id: 'length', text: 'At least 8 characters', check: (p: string) => p.length >= 8 },
    { id: 'upper', text: 'One uppercase letter', check: (p: string) => /[A-Z]/.test(p) },
    { id: 'number', text: 'One number', check: (p: string) => /[0-9]/.test(p) },
    { id: 'symbol', text: 'One special character', check: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];

  const fulfilledCount = requirements.filter(r => r.check(password)).length;
  const isAllFulfilled = fulfilledCount === requirements.length;

  // Geist-style high contrast colors for strength
  const colors =['#eaeaea', '#e00', '#f5a623', '#0070f3', '#0070f3', '#111'];
  const labels =['None', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  
  // Calculate score 0-5
  let score = 0;
  if (password.length > 0) score = 1;
  if (fulfilledCount >= 2) score = 2;
  if (fulfilledCount >= 3) score = 3;
  if (isAllFulfilled) score = 4;
  if (isAllFulfilled && password.length >= 12) score = 5;

  if (!password) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 overflow-hidden bg-[#fafafa] p-3 rounded-[6px] border border-[#eaeaea]"
    >
      <div className="flex justify-between items-center mb-2">
        <p className="text-[12px] font-medium text-[#666]">Password strength</p>
        <p className="text-[12px] font-semibold transition-colors duration-300" style={{ color: colors[score] }}>
          {labels[score]}
        </p>
      </div>
      
      {/* 5-segment Bar */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-1 h-[4px] rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor: i <= score ? colors[score] : '#eaeaea',
              opacity: i <= score ? 1 : 0.5,
              transform: i <= score ? 'scaleY(1)' : 'scaleY(0.8)',
            }}
          />
        ))}
      </div>

      {/* Requirement Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {requirements.map((req) => {
          const met = req.check(password);
          return (
            <div key={req.id} className="flex items-center gap-1.5">
              <div className={`
                flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-300
                ${met ? 'bg-[#111] text-white' : 'bg-[#eaeaea] text-[#aaa]'}
              `}>
                {met ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={2} />}
              </div>
              <span className={`text-[12px] transition-colors duration-300 ${met ? 'text-[#111]' : 'text-[#888]'}`}>
                {req.text}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ==========================================
// 6. COMPLEX UI: DECORATIVE TERMINAL (SIDEBAR)
// ==========================================
function TerminalShowcase() {
  const lines =[
    { text: "npm i @cookie/auth", delay: 0.5 },
    { text: "installing dependencies...", delay: 1.2, type: 'dim' },
    { text: "✓ cookie-auth@latest installed", delay: 2.0, type: 'success' },
    { text: "> initializing project", delay: 2.8 },
    { text: "✓ generated secure tokens", delay: 3.5, type: 'success' },
    { text: "Ready to authenticate users on edge.", delay: 4.5, type: 'highlight' }
  ];

  const[visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] =[];
    lines.forEach((line, index) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => Math.max(prev, index + 1));
      }, line.delay * 1000);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  },[]);

  return (
    <div className="w-full h-full bg-[#111] rounded-xl border border-[#333] shadow-2xl overflow-hidden font-mono text-[13px] leading-relaxed relative group">
      {/* Mac-style Window Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333] bg-[#0a0a0a]">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-[#666] text-[11px] font-sans font-medium tracking-wide">bash - server</span>
      </div>
      
      <div className="p-5 text-[#eaeaea]">
        {lines.map((line, idx) => (
          <AnimatePresence key={idx}>
            {idx < visibleLines && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-1 flex ${
                  line.type === 'dim' ? 'text-[#888]' :
                  line.type === 'success' ? 'text-[#27c93f]' :
                  line.type === 'highlight' ? 'text-[#3291ff] mt-4 font-semibold' : ''
                }`}
              >
                {!['dim', 'success', 'highlight'].includes(line.type || '') && (
                  <span className="text-[#f81ce5] mr-2">~</span>
                )}
                <span>{line.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        {visibleLines >= lines.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2.5 h-4 bg-[#eaeaea] mt-1"
          />
        )}
      </div>

      {/* Decorative Glow Elements */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
    </div>
  );
}

// ==========================================
// 7. BACKGROUND GRID PATTERN
// ==========================================
function BackgroundPattern() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#fafafa]">
      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-[0.3]" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, #e5e5e5 1px, transparent 1px),
            linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 20%, transparent 100%)'
        }} 
      />
      
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/40 rounded-full blur-3xl" />
    </div>
  );
}


// ==========================================
// 8. MAIN PAGE COMPONENT
// ==========================================
export function AuthPage() {
  const { login, register } = useAuth();
  
  // High-level State
  const[mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  
  // Form State
  const[username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // For magic link
  const[password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const[rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Status State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const[loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form Handlers
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (mode === 'register' && !termsAccepted) {
      errs.terms = 'You must accept the terms';
    }

    if (loginMethod === 'magic_link') {
      if (!email.trim()) errs.email = 'Email required';
      else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email';
    } else {
      if (!username.trim()) errs.username = 'Username required';
      else if (username.trim().length < 2) errs.username = 'Min 2 chars';
      
      if (!password) errs.password = 'Password required';
      else if (password.length < 6) errs.password = 'Min 6 chars';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (loginMethod === 'magic_link') {
        // Mock magic link request
        await new Promise(res => setTimeout(res, 1500));
        setSuccessMsg(`Magic link sent to ${email}. Check your inbox.`);
        setEmail('');
      } else {
        if (mode === 'login') {
          await login(username.trim(), password);
        } else {
          await register(username.trim(), password, displayName.trim() || username.trim());
        }
      }
    } catch (err: unknown) {
      const e = err as AuthContextError;
      setGlobalError(e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    if (mode === newMode) return;
    setMode(newMode);
    setErrors({});
    setGlobalError('');
    setSuccessMsg('');
    setUsername('');
    setPassword('');
    setDisplayName('');
    setTermsAccepted(false);
  };

  const handleSSOLogin = async (provider: string) => {
    setLoading(true);
    setGlobalError('');
    // Mock SSO delay
    await new Promise(res => setTimeout(res, 1000));
    setGlobalError(`${provider} login is not configured in this environment.`);
    setLoading(false);
  };

  // UI Render Elements
  return (
    <div className="min-h-screen w-full flex bg-[#fafafa] selection:bg-[#0070f3] selection:text-white relative">
      <BackgroundPattern />

      {/* Main Layout Container */}
      <div className="relative w-full max-w-[1200px] mx-auto min-h-screen flex items-center justify-center p-4 sm:p-8 z-10">
        
        {/* Card Wrapper for Split Screen effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={geistTransitions.smooth}
          className="w-full flex bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#eaeaea] overflow-hidden min-h-[600px]"
        >
          
          {/* LEFT SIDE: AUTH FORM */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center relative">
            
            {/* Mobile Logo Header */}
            <div className="flex lg:hidden flex-col items-center mb-8 text-center">
              <div className="w-10 h-10 bg-[#111] rounded-[8px] flex items-center justify-center mb-4 shadow-md">
                <CookieLogo className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-[24px] font-bold text-[#111] tracking-tight">
                cookie<span className="text-[#888]">.io</span>
              </h1>
            </div>

            <div className="max-w-[360px] w-full mx-auto">
              
              <div className="mb-8">
                <h2 className="text-[24px] font-semibold text-[#111] tracking-tight mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-[14px] text-[#666]">
                  {mode === 'login' 
                    ? 'Enter your credentials to access your dashboard.' 
                    : 'Join thousands of developers building the future.'}
                </p>
              </div>

              {/* Segmented Control Tabs */}
              <div className="relative flex p-1 mb-8 bg-[#f5f5f5] rounded-[8px] border border-[#eaeaea]">
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[0.25,0.1,0.25,1]"
                  style={{ transform: `translateX(${mode === 'login' ? '0%' : '100%'})` }}
                />
                
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`relative z-10 flex-1 h-[32px] text-[13px] font-medium transition-colors duration-200 rounded-[6px] ${
                      mode === m ? 'text-[#111]' : 'text-[#888] hover:text-[#111]'
                    }`}
                  >
                    {m === 'login' ? 'Log In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Error / Success Banners */}
              <AnimatePresence mode="wait">
                {globalError && (
                  <motion.div
                    key="error"
                    {...fadeUpVariants}
                    className="flex items-start gap-2 p-3 mb-6 bg-[#fff0f0] border border-[#ffcdcd] rounded-[6px] text-[#e00] text-[13px] leading-relaxed"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{globalError}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    key="success"
                    {...fadeUpVariants}
                    className="flex items-start gap-2 p-3 mb-6 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[6px] text-[#16a34a] text-[13px] leading-relaxed"
                  >
                    <Check size={16} className="mt-0.5 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <GeistButton 
                  variant="secondary" 
                  onClick={() => handleSSOLogin('GitHub')}
                  icon={<GitHubIcon />}
                >
                  GitHub
                </GeistButton>
                <GeistButton 
                  variant="secondary" 
                  onClick={() => handleSSOLogin('Google')}
                  icon={<GoogleIcon />}
                >
                  Google
                </GeistButton>
              </div>

              <GeistDivider>Or continue with</GeistDivider>

              {/* Form Mode Toggles (Password vs Magic Link) */}
              {mode === 'login' && (
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod(prev => prev === 'password' ? 'magic_link' : 'password')}
                    className="text-[12px] text-[#666] hover:text-[#111] flex items-center gap-1 transition-colors"
                  >
                    {loginMethod === 'password' ? <Zap size={12} /> : <KeyRound size={12} />}
                    {loginMethod === 'password' ? 'Use Magic Link' : 'Use Password'}
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {/* Magic Link Fields */}
                  {loginMethod === 'magic_link' ? (
                    <motion.div key="magic" {...fadeUpVariants} className="space-y-4">
                      <GeistInput
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </motion.div>
                  ) : (
                    /* Standard Password Fields */
                    <motion.div key="standard" {...fadeUpVariants} className="space-y-4">
                      
                      <AnimatePresence>
                        {mode === 'register' && (
                          <motion.div
                            key="displayName"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <GeistInput
                              label="Display Name (Optional)"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              autoComplete="name"
                              placeholder="e.g. Jane Doe"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <GeistInput
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={errors.username}
                        autoComplete={mode === 'login' ? 'username' : 'new-user'}
                        placeholder="e.g. janedoe"
                      />

                      <div className="mb-2 relative">
                        <GeistInput
                          label="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          error={errors.password}
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          placeholder="••••••••"
                        />
                        
                        {mode === 'login' && (
                          <div className="absolute top-0 right-0">
                            <button type="button" className="text-[12px] text-[#666] hover:text-[#111] transition-colors">
                              Forgot password?
                            </button>
                          </div>
                        )}

                        <AnimatePresence>
                          {mode === 'register' && password && (
                            <PasswordStrengthAnalyzer password={password} />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Additional Register/Login Options */}
                {mode === 'register' && loginMethod === 'password' && (
                  <motion.div {...fadeUpVariants} className="pt-2">
                    <GeistCheckbox 
                      label={
                        <span className="flex items-center gap-1">
                          I agree to the <a href="#" className="underline hover:text-[#111]">Terms</a> and <a href="#" className="underline hover:text-[#111]">Privacy Policy</a>
                        </span>
                      }
                      checked={termsAccepted}
                      onChange={setTermsAccepted}
                    />
                    {errors.terms && <p className="text-[12px] text-[#e00] mt-1 ml-7">{errors.terms}</p>}
                  </motion.div>
                )}

                {mode === 'login' && loginMethod === 'password' && (
                  <div className="pt-1">
                    <GeistCheckbox 
                      label="Remember me for 30 days"
                      checked={rememberMe}
                      onChange={setRememberMe}
                    />
                  </div>
                )}

                {/* Submit Area */}
                <div className="pt-6">
                  <GeistButton
                    type="submit"
                    loading={loading}
                    fullWidth
                    className="group"
                  >
                    {loginMethod === 'magic_link' ? 'Send Magic Link' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    <kbd className="hidden sm:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-[#333] group-hover:bg-[#555] rounded-[4px] text-[10px] text-[#aaa] font-sans border border-[#444] transition-colors pointer-events-none">
                      ↵
                    </kbd>
                  </GeistButton>
                </div>
              </form>
            </div>
            
            {/* Footer Trust Badges */}
            <div className="mt-12 pt-6 border-t border-[#eaeaea] w-full max-w-[360px] mx-auto flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-4 text-[12px] text-[#888]">
                <div className="flex items-center gap-1.5">
                  <Lock size={12} />
                  <span>Secure TLS</span>
                </div>
                <div className="w-1 h-1 bg-[#d5d5d5] rounded-full" />
                <div className="flex items-center gap-1.5">
                  <Fingerprint size={12} />
                  <span>SSO Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: FEATURE SHOWCASE (DESKTOP ONLY) */}
          <div className="hidden lg:flex w-1/2 bg-[#fafafa] border-l border-[#eaeaea] relative flex-col items-center justify-center p-12 overflow-hidden">
            
            {/* Ambient Background for Sidebar */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,112,243,0.05),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,0,128,0.03),transparent_50%)]" />

            {/* Logo Watermark Top Right */}
            <div className="absolute top-8 right-8 flex items-center gap-2 opacity-50">
              <CookieLogo className="w-5 h-5 text-[#111]" />
              <span className="text-[14px] font-semibold tracking-tight text-[#111]">cookie.io</span>
            </div>

            <div className="relative w-full max-w-[420px] z-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-10"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#eaeaea] shadow-sm mb-6">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[12px] font-medium text-[#666]">Systems Operational</span>
                </div>
                
                <h3 className="text-[32px] font-bold text-[#111] leading-tight tracking-tight mb-4">
                  Authentication,<br/>
                  built for the edge.
                </h3>
                <p className="text-[15px] text-[#666] leading-relaxed">
                  Experience lightning-fast global authentication with zero configuration. Protect your applications with enterprise-grade security instantly.
                </p>
              </motion.div>

              {/* Decorative Terminal Component */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-full h-[220px]"
              >
                <TerminalShowcase />
              </motion.div>

              {/* Feature Cards Float */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm flex flex-col gap-2"
                >
                  <Command className="text-[#666] w-5 h-5" />
                  <h4 className="text-[13px] font-semibold text-[#111]">Command Line</h4>
                  <p className="text-[12px] text-[#888]">Deploy auth directly from your terminal workflow.</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-white p-4 rounded-xl border border-[#eaeaea] shadow-sm flex flex-col gap-2"
                >
                  <ShieldCheck className="text-[#666] w-5 h-5" />
                  <h4 className="text-[13px] font-semibold text-[#111]">Enterprise SSO</h4>
                  <p className="text-[12px] text-[#888]">SAML, OIDC, and directory sync out of the box.</p>
                </motion.div>
              </div>
            </div>

            {/* Bottom Right Help Tooltip */}
            <div className="absolute bottom-8 right-8">
              <GeistTooltip content="Need help integrating? Read the docs.">
                <button className="w-8 h-8 rounded-full bg-white border border-[#eaeaea] shadow-sm flex items-center justify-center text-[#666] hover:text-[#111] transition-colors">
                  <HelpCircle size={16} />
                </button>
              </GeistTooltip>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
