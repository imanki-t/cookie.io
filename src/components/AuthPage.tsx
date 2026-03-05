import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Loader2, Shield, Zap, BookOpen, Terminal, Folder, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — deep dark amber terminal aesthetic
═══════════════════════════════════════════════════════════════════ */

const C = {
  // Base
  bg:          '#07060300',
  bgPage:      '#080704',
  bgCard:      '#0d0b07',
  bgCardInner: '#111008',
  bgInput:     'rgba(255,255,255,0.025)',
  bgInputFocus:'rgba(245,158,11,0.05)',
  // Borders
  border:      'rgba(245,158,11,0.13)',
  borderHi:    'rgba(245,158,11,0.5)',
  borderDim:   'rgba(245,158,11,0.07)',
  // Amber palette
  amber:       '#f59e0b',
  amberHi:     '#fbbf24',
  amberDim:    '#d97706',
  amberDeep:   '#b45309',
  amberBg:     'rgba(245,158,11,0.08)',
  amberGlow:   'rgba(245,158,11,0.22)',
  amberGlowSm: 'rgba(245,158,11,0.12)',
  // Text
  text:        '#ede0c8',
  textMid:     '#9a7c5a',
  textDim:     '#4a3c2a',
  textFaint:   '#2a2218',
  // Semantic
  danger:      '#f87171',
  dangerBg:    'rgba(248,113,113,0.08)',
  dangerBorder:'rgba(248,113,113,0.2)',
  success:     '#34d399',
  successGlow: 'rgba(52,211,153,0.4)',
  // Fonts
  mono:        '"Geist Mono", "SF Mono", ui-monospace, monospace',
  sans:        '"Geist Sans", ui-sans-serif, system-ui, sans-serif',
} as const;

/* ═══════════════════════════════════════════════════════════════════
   SVG NOISE GRAIN — fine film grain texture
═══════════════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        99,
        opacity:       0.032,
        mixBlendMode:  'overlay',
      }}
    >
      <filter id="grain-auth-filter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.68"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-auth-filter)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED GRID — Geist-style dot grid + scan lines
═══════════════════════════════════════════════════════════════════ */

function GeistGrid() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    >
      {/* Fine dot grid */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: `radial-gradient(circle, rgba(245,158,11,0.16) 1px, transparent 1px)`,
        backgroundSize:  '30px 30px',
        opacity:         0.6,
      }} />

      {/* Subtle horizontal lines */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 29px,
          rgba(245,158,11,0.035) 29px,
          rgba(245,158,11,0.035) 30px
        )`,
      }} />

      {/* Subtle vertical lines */}
      <div style={{
        position:        'absolute',
        inset:           0,
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 29px,
          rgba(245,158,11,0.035) 29px,
          rgba(245,158,11,0.035) 30px
        )`,
      }} />

      {/* Animated horizontal sweep line */}
      <motion.div
        aria-hidden="true"
        style={{
          position:   'absolute',
          left:       0,
          right:      0,
          height:     '1.5px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.4) 40%, rgba(251,191,36,0.6) 50%, rgba(245,158,11,0.4) 60%, transparent 100%)',
        }}
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
      />

      {/* Second sweep — offset */}
      <motion.div
        aria-hidden="true"
        style={{
          position:   'absolute',
          left:       0,
          right:      0,
          height:     '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.18) 50%, transparent 100%)',
        }}
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear', repeatDelay: 5, delay: 4.5 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GLOW ORBS — atmospheric ambient light
═══════════════════════════════════════════════════════════════════ */

function GlowOrbs() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}
    >
      {/* Top-left amber */}
      <motion.div style={{
        position:     'absolute',
        top:          '-22%',
        left:         '-8%',
        width:        '58%',
        height:       '58%',
        borderRadius: '50%',
        background:   'radial-gradient(ellipse, rgba(180,83,9,0.25) 0%, rgba(180,83,9,0.08) 35%, transparent 70%)',
        filter:       'blur(60px)',
      }}
        animate={{ scale: [1, 1.13, 1.05, 1], x: [0, 22, -10, 0], y: [0, -14, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom-right deep brown */}
      <motion.div style={{
        position:     'absolute',
        bottom:       '-18%',
        right:        '-10%',
        width:        '55%',
        height:       '55%',
        borderRadius: '50%',
        background:   'radial-gradient(ellipse, rgba(120,53,15,0.22) 0%, rgba(120,53,15,0.06) 40%, transparent 70%)',
        filter:       'blur(70px)',
      }}
        animate={{ scale: [1, 1.1, 1.18, 1], x: [0, -24, 12, 0], y: [0, 18, -12, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Centre warm pulse */}
      <motion.div style={{
        position:     'absolute',
        top:          '30%',
        left:         '25%',
        width:        '50%',
        height:       '50%',
        borderRadius: '50%',
        background:   'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)',
        filter:       'blur(50px)',
      }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
      />

      {/* Top-right secondary */}
      <motion.div style={{
        position:     'absolute',
        top:          '-8%',
        right:        '2%',
        width:        '28%',
        height:       '32%',
        borderRadius: '50%',
        background:   'radial-gradient(ellipse, rgba(217,119,6,0.14) 0%, transparent 70%)',
        filter:       'blur(40px)',
      }}
        animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RISING PARTICLES — ambient ember/spark floaters
═══════════════════════════════════════════════════════════════════ */

interface SparkProps {
  startX: number; startY: number;
  size: number; delay: number; duration: number; drift: number;
}

function Spark({ startX, startY, size, delay, duration, drift }: SparkProps) {
  return (
    <motion.div
      aria-hidden="true"
      style={{
        position:     'fixed',
        left:         `${startX}%`,
        top:          `${startY}%`,
        width:        size,
        height:       size,
        borderRadius: '50%',
        background:   C.amber,
        pointerEvents:'none',
        zIndex:        2,
      }}
      animate={{
        opacity: [0, 0.8, 0.5, 0.8, 0],
        scale:   [0, 1, 0.7, 1, 0],
        x:       [0, drift, -drift * 0.4, drift * 0.2, 0],
        y:       [0, -28, -56, -84, -110],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  );
}

const SPARKS: SparkProps[] = [
  { startX: 6,  startY: 88, size: 2.5, delay: 0,   duration: 7,  drift: 14 },
  { startX: 14, startY: 75, size: 1.5, delay: 1.6, duration: 9,  drift: -9 },
  { startX: 22, startY: 92, size: 3,   delay: 0.8, duration: 8,  drift: 16 },
  { startX: 70, startY: 82, size: 2,   delay: 2.4, duration: 6,  drift: -11 },
  { startX: 80, startY: 68, size: 1.8, delay: 0.4, duration: 10, drift: 9 },
  { startX: 91, startY: 90, size: 2.5, delay: 1.9, duration: 7,  drift: -15 },
  { startX: 55, startY: 94, size: 1.5, delay: 3.2, duration: 8,  drift: 7 },
  { startX: 43, startY: 79, size: 2,   delay: 1.1, duration: 9,  drift: -10 },
  { startX: 66, startY: 96, size: 3,   delay: 2.7, duration: 7,  drift: 12 },
  { startX: 33, startY: 62, size: 1.5, delay: 4.2, duration: 11, drift: -8 },
  { startX: 4,  startY: 42, size: 2,   delay: 1.3, duration: 8,  drift: 15 },
  { startX: 96, startY: 58, size: 1.8, delay: 3.7, duration: 9,  drift: -12 },
  { startX: 50, startY: 50, size: 1.2, delay: 5.0, duration: 12, drift: 6 },
  { startX: 77, startY: 44, size: 2.2, delay: 0.6, duration: 8,  drift: -14 },
];

function RisingParticles() {
  return (
    <>
      {SPARKS.map((s, i) => <Spark key={i} {...s} />)}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CORNER BRACKETS — Geist circuit-board style card decoration
═══════════════════════════════════════════════════════════════════ */

type BracketPos = 'tl' | 'tr' | 'bl' | 'br';

function CornerBracket({ pos, size = 14 }: { pos: BracketPos; size?: number }) {
  const rotMap: Record<BracketPos, number> = { tl: 0, tr: 90, br: 180, bl: 270 };
  const posMap: Record<BracketPos, React.CSSProperties> = {
    tl: { top: -1,    left: -1   },
    tr: { top: -1,    right: -1  },
    br: { bottom: -1, right: -1  },
    bl: { bottom: -1, left: -1   },
  };
  return (
    <div style={{
      position:  'absolute',
      width:     size,
      height:    size,
      transform: `rotate(${rotMap[pos]}deg)`,
      ...posMap[pos],
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path
          d={`M ${size} 0 L 0 0 L 0 ${size}`}
          stroke={C.amberDim}
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPEWRITER — cycling taglines
═══════════════════════════════════════════════════════════════════ */

function TypewriterCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setVisible(v => !v), 520);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{
      display:    'inline-block',
      width:      '0.55em',
      height:     '1.1em',
      background: visible ? C.amber : 'transparent',
      verticalAlign: 'text-bottom',
      marginLeft: '1px',
      borderRadius: '1px',
      transition: 'background 0.08s',
    }} />
  );
}

function TypewriterText({ phrases }: { phrases: string[] }) {
  const [idx,        setIdx]        = useState(0);
  const [displayed,  setDisplayed]  = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const target = phrases[idx];
    let t: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < target.length) {
      t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 58);
    } else if (!isDeleting && displayed.length === target.length) {
      t = setTimeout(() => setIsDeleting(true), 2600);
    } else if (isDeleting && displayed.length > 0) {
      t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
    } else {
      setIsDeleting(false);
      setIdx(i => (i + 1) % phrases.length);
    }
    return () => clearTimeout(t);
  }, [displayed, isDeleting, idx, phrases]);

  return (
    <span style={{ fontFamily: C.mono, color: C.amber }}>
      {displayed}<TypewriterCursor />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS DOT — online indicator
═══════════════════════════════════════════════════════════════════ */

function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {active && (
        <motion.span style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   C.success,
          opacity:      0.5,
        }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span style={{
        display:      'inline-block',
        width:        7,
        height:       7,
        borderRadius: '50%',
        background:   active ? C.success : C.textDim,
        boxShadow:    active ? `0 0 8px ${C.successGlow}` : 'none',
        position:     'relative',
      }} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LEFT PANEL — brand showcase, features, mini previews (desktop)
═══════════════════════════════════════════════════════════════════ */

const FEATURE_LIST = [
  {
    Icon:  Shield,
    title: 'End-to-end private',
    desc:  'JWT auth · notes belong to you alone',
    delay: 0.45,
  },
  {
    Icon:  Zap,
    title: 'Real-time sync',
    desc:  'WebSocket live updates · zero lag',
    delay: 0.55,
  },
  {
    Icon:  BookOpen,
    title: 'Markdown + WYSIWYG',
    desc:  'GFM support · preview as you write',
    delay: 0.65,
  },
  {
    Icon:  Terminal,
    title: 'Slash commands',
    desc:  'Ctrl+K · instant fuzzy search',
    delay: 0.75,
  },
  {
    Icon:  Folder,
    title: 'Folders & organisation',
    desc:  'Nested structure · drag & drop',
    delay: 0.85,
  },
  {
    Icon:  Tag,
    title: 'Tags & filters',
    desc:  'Multi-tag filter · colour labels',
    delay: 0.95,
  },
];

function FeatureItem({
  Icon, title, desc, delay,
}: {
  Icon: React.ElementType; title: string; desc: string; delay: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       'flex',
        alignItems:    'flex-start',
        gap:           12,
        padding:       '10px 12px',
        borderRadius:  10,
        border:        `1px solid ${hovered ? C.border : C.borderDim}`,
        background:    hovered ? C.amberBg : 'transparent',
        marginBottom:  6,
        cursor:        'default',
        transition:    'all 0.18s ease',
      }}
    >
      <div style={{
        width:          30,
        height:         30,
        borderRadius:   8,
        background:     hovered ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.06)',
        border:         `1px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          C.amber,
        flexShrink:     0,
        transition:     'all 0.18s ease',
      }}>
        <Icon size={13} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{
          margin:       0,
          marginBottom: 2,
          fontSize:     12.5,
          fontWeight:   600,
          color:        C.text,
          letterSpacing:'-0.01em',
          fontFamily:   C.sans,
        }}>{title}</p>
        <p style={{
          margin:      0,
          fontSize:    11,
          color:       C.textMid,
          fontFamily:  C.mono,
          lineHeight:  1.5,
        }}>{desc}</p>
      </div>
    </motion.div>
  );
}

/* Mini floating note preview cards on the left panel */
function MiniPreviewCard({
  title, tag, snippet, delay, top, left, rotate,
}: {
  title: string; tag: string; snippet: string;
  delay: number; top: number; left: number; rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position:       'absolute',
        top,
        left,
        width:          172,
        padding:        '10px 13px',
        background:     'rgba(13,11,7,0.9)',
        border:         `1px solid ${C.border}`,
        borderRadius:   10,
        backdropFilter: 'blur(20px)',
        boxShadow:      '0 12px 40px rgba(0,0,0,0.7)',
        transform:      `rotate(${rotate}deg)`,
        pointerEvents:  'none',
      }}
    >
      <span style={{
        display:       'inline-block',
        fontSize:      9.5,
        fontFamily:    C.mono,
        color:         C.amber,
        background:    C.amberBg,
        border:        `1px solid ${C.border}`,
        borderRadius:  4,
        padding:       '1px 6px',
        marginBottom:  6,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>{tag}</span>
      <p style={{
        margin:        0,
        marginBottom:  4,
        fontSize:      12,
        fontWeight:    700,
        color:         C.text,
        letterSpacing: '-0.02em',
        fontFamily:    C.sans,
      }}>{title}</p>
      <p style={{
        margin:     0,
        fontSize:   10.5,
        color:      C.textMid,
        fontFamily: C.mono,
        lineHeight: 1.5,
      }}>{snippet}</p>
    </motion.div>
  );
}

function LeftPanel() {
  const phrases = [
    'write beautifully',
    'think in markdown',
    'organise everything',
    'ship your ideas',
    'stay in the flow',
  ];

  return (
    <div style={{
      height:        '100%',
      display:       'flex',
      flexDirection: 'column',
      justifyContent:'center',
      padding:       '48px 36px 48px 48px',
      borderRight:   `1px solid ${C.border}`,
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <SmallCookieLogo />
          <span style={{
            fontSize:      22,
            fontWeight:    900,
            letterSpacing: '-0.06em',
            color:         C.text,
            fontFamily:    C.sans,
          }}>
            cookie<span style={{ color: C.amber }}>.io</span>
          </span>
        </div>

        <p style={{
          margin:     0,
          fontSize:   14,
          fontFamily: C.mono,
          color:      C.textMid,
          lineHeight: 1.7,
        }}>
          {'> '}<TypewriterText phrases={phrases} />
        </p>
      </motion.div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '9px 13px',
          borderRadius: 8,
          border:      `1px solid ${C.border}`,
          background:  'rgba(245,158,11,0.035)',
          marginBottom: 22,
        }}
      >
        <StatusDot active />
        <span style={{
          fontSize:      11,
          fontFamily:    C.mono,
          color:         C.textMid,
          letterSpacing: '0.02em',
        }}>All systems operational</span>
        <span style={{
          marginLeft:    'auto',
          fontSize:      10,
          fontFamily:    C.mono,
          color:         C.amber,
          background:    C.amberBg,
          border:        `1px solid ${C.border}`,
          padding:       '2px 7px',
          borderRadius:  5,
        }}>v2.0</span>
      </motion.div>

      {/* Features list */}
      <div style={{ marginBottom: 28 }}>
        {FEATURE_LIST.map(f => <FeatureItem key={f.title} {...f} />)}
      </div>

      {/* Floating preview cards */}
      <div style={{ position: 'relative', height: 210 }}>
        <MiniPreviewCard
          title="Weekly Review"
          tag="work"
          snippet="## Q2 Goals&#10;- Ship auth page ✓&#10;- Dark mode toggle"
          delay={1.05}
          top={0}
          left={8}
          rotate={-1.5}
        />
        <MiniPreviewCard
          title="Project Ideas 💡"
          tag="personal"
          snippet="AI-powered auto-tagging for notes..."
          delay={1.2}
          top={80}
          left={110}
          rotate={2}
        />
      </div>

      {/* Bottom metric row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.35 }}
        style={{
          display:       'flex',
          gap:           16,
          borderTop:     `1px solid ${C.border}`,
          paddingTop:    16,
          marginTop:     'auto',
        }}
      >
        {[
          { val: '50k+', label: 'Notes written' },
          { val: '99.9%', label: 'Uptime' },
          { val: '<1ms', label: 'Sync latency' },
        ].map(({ val, label }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontSize:      15,
              fontWeight:    800,
              fontFamily:    C.mono,
              color:         C.amber,
              letterSpacing: '-0.04em',
            }}>{val}</span>
            <span style={{
              fontSize:   10,
              fontFamily: C.mono,
              color:      C.textDim,
              letterSpacing: '0.03em',
            }}>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COOKIE LOGO — small variant for left panel
═══════════════════════════════════════════════════════════════════ */

function SmallCookieLogo() {
  return (
    <motion.div
      animate={{ rotate: [0, 4, -3, 2, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'eistinOut', delay: 2 }}
    >
      <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
        <path d="M32 7C40 7 47.5 10.5 52 16C56 21 58 27 58 33C58 39 56 45 52 49.5C48 54 42 57 36 58C30 59 24 57.5 19 55C14 52 10 47 8 41C6 36 6 30 8 24.5C10 19 13.5 14 18 11C22 8 27 7 32 7Z" fill="#D97706"/>
        <path d="M32 10C39.5 10 46.5 13.2 51 18.5C55 23 57 29 57 33C57 38.5 55 44 51 48C47 52 41.5 55 36 55.8C30 56.7 24.5 55.2 19.5 52.5C15 50 11 45.5 9 40C7.2 35 7.2 29.5 9 24C11 18.5 14.5 14 19 11.2C23 8.7 27.5 10 32 10Z" fill="#F59E0B" opacity="0.95"/>
        <ellipse cx="19" cy="27" rx="5" ry="4.2" fill="#78350F" opacity="0.9" transform="rotate(-12 19 27)"/>
        <ellipse cx="37" cy="23" rx="4.5" ry="3.8" fill="#78350F" opacity="0.9" transform="rotate(9 37 23)"/>
        <ellipse cx="25" cy="40" rx="5" ry="4" fill="#78350F" opacity="0.9" transform="rotate(-6 25 40)"/>
        <ellipse cx="44" cy="37" rx="4" ry="3.4" fill="#78350F" opacity="0.85" transform="rotate(14 44 37)"/>
        <circle cx="52" cy="14" r="6" fill="#080704"/>
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTH LOGO — large hero logo for card header
═══════════════════════════════════════════════════════════════════ */

function AuthHeroLogo() {
  return (
    <motion.div
      initial={{ scale: 0.55, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ delay: 0.18, type: 'spring', stiffness: 260, damping: 18 }}
      style={{ position: 'relative', display: 'inline-flex', marginBottom: 4 }}
    >
      {/* Outer pulse ring */}
      <motion.div aria-hidden="true" style={{
        position:     'absolute',
        inset:        -14,
        borderRadius: '50%',
        border:       `1px solid rgba(245,158,11,0.28)`,
        boxShadow:    `0 0 28px rgba(245,158,11,0.18)`,
      }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner pulse ring */}
      <motion.div aria-hidden="true" style={{
        position:     'absolute',
        inset:        -24,
        borderRadius: '50%',
        border:       `1px solid rgba(245,158,11,0.1)`,
      }}
        animate={{ scale: [1, 1.22, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />

      <motion.div
        animate={{ rotate: [0, 5, -4, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <svg width="68" height="68" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="33" r="28" fill="rgba(217,119,6,0.08)"/>
          <circle cx="32" cy="33" r="22" fill="rgba(217,119,6,0.05)"/>
          <path d="M32 7C40 7 47.5 10.5 52 16C56 21 58 27 58 33C58 39 56 45 52 49.5C48 54 42 57 36 58C30 59 24 57.5 19 55C14 52 10 47 8 41C6 36 6 30 8 24.5C10 19 13.5 14 18 11C22 8 27 7 32 7Z" fill="#D97706"/>
          <path d="M32 10C39.5 10 46.5 13.2 51 18.5C55 23 57 29 57 33C57 38.5 55 44 51 48C47 52 41.5 55 36 55.8C30 56.7 24.5 55.2 19.5 52.5C15 50 11 45.5 9 40C7.2 35 7.2 29.5 9 24C11 18.5 14.5 14 19 11.2C23 8.7 27.5 10 32 10Z" fill="#F59E0B" opacity="0.95"/>
          <ellipse cx="22" cy="19" rx="9" ry="5.5" fill="white" opacity="0.1" transform="rotate(-20 22 19)"/>
          <ellipse cx="19" cy="27" rx="5" ry="4.2" fill="#78350F" opacity="0.9" transform="rotate(-12 19 27)"/>
          <ellipse cx="37" cy="23" rx="4.5" ry="3.8" fill="#78350F" opacity="0.9" transform="rotate(9 37 23)"/>
          <ellipse cx="25" cy="40" rx="5" ry="4" fill="#78350F" opacity="0.9" transform="rotate(-6 25 40)"/>
          <ellipse cx="44" cy="37" rx="4" ry="3.4" fill="#78350F" opacity="0.85" transform="rotate(14 44 37)"/>
          <ellipse cx="33" cy="48" rx="3.5" ry="2.8" fill="#78350F" opacity="0.8" transform="rotate(-5 33 48)"/>
          <ellipse cx="17" cy="25.5" rx="1.6" ry="1" fill="white" opacity="0.28" transform="rotate(-12 17 25.5)"/>
          <ellipse cx="35.5" cy="21.5" rx="1.4" ry="0.9" fill="white" opacity="0.28" transform="rotate(9 35.5 21.5)"/>
          <circle cx="52" cy="14" r="6.5" fill="#080704"/>
          <circle cx="44" cy="10" r="2.2" fill="#F59E0B" opacity="0.7"/>
          <circle cx="48" cy="7" r="1.4" fill="#F59E0B" opacity="0.5"/>
          <circle cx="53" cy="9" r="1.3" fill="#F59E0B" opacity="0.45"/>
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MODE TOGGLE — Geist-style segmented control
═══════════════════════════════════════════════════════════════════ */

function ModeToggle({
  mode,
  onSwitch,
}: {
  mode: 'login' | 'register';
  onSwitch: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{
        display:      'flex',
        background:   'rgba(255,255,255,0.025)',
        border:       `1px solid ${C.border}`,
        borderRadius: 10,
        padding:      3,
        marginBottom: 24,
        gap:          3,
      }}
    >
      {(['login', 'register'] as const).map(m => {
        const active = mode === m;
        return (
          <motion.button
            key={m}
            onClick={() => m !== mode && onSwitch()}
            whileTap={{ scale: 0.97 }}
            style={{
              flex:          1,
              padding:       '9px 0',
              borderRadius:  8,
              fontSize:      12.5,
              fontWeight:    active ? 700 : 500,
              fontFamily:    C.sans,
              letterSpacing: '-0.015em',
              color:         active ? C.text : C.textMid,
              background:    active ? 'rgba(245,158,11,0.12)' : 'transparent',
              border:        active
                ? `1px solid rgba(245,158,11,0.3)`
                : '1px solid transparent',
              cursor:     m !== mode ? 'pointer' : 'default',
              transition: 'all 0.18s ease',
              boxShadow:  active ? `0 0 14px rgba(245,158,11,0.1)` : 'none',
            }}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GLASS INPUT — animated focus, left accent bar, floating label
═══════════════════════════════════════════════════════════════════ */

interface GlassInputProps {
  label:        string;
  type?:        string;
  value:        string;
  onChange:     (v: string) => void;
  error?:       string;
  autoComplete?:string;
  minLength?:   number;
}

function GlassInput({
  label, type = 'text', value, onChange, error, autoComplete, minLength,
}: GlassInputProps) {
  const [showPass, setShowPass] = useState(false);
  const [focused,  setFocused]  = useState(false);

  const inputType = type === 'password' ? (showPass ? 'text' : 'password') : type;
  const lifted    = focused || value.length > 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        position:     'relative',
        borderRadius: 10,
        border:       `1px solid ${
          error   ? C.dangerBorder :
          focused ? C.borderHi    :
                    C.border
        }`,
        background: focused ? C.bgInputFocus : C.bgInput,
        boxShadow:  focused
          ? `0 0 0 3.5px rgba(245,158,11,0.11), inset 0 0 16px rgba(245,158,11,0.025)`
          : error
          ? `0 0 0 3px rgba(248,113,113,0.09)`
          : 'none',
        transition: 'all 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Left accent bar — animates in on focus */}
        <motion.div aria-hidden="true" style={{
          position:     'absolute',
          left:         0,
          top:          '18%',
          bottom:       '18%',
          width:        2.5,
          borderRadius: 99,
          background:   `linear-gradient(180deg, ${C.amberHi}, ${C.amberDim})`,
          transformOrigin: '50% 50%',
          boxShadow:    `0 0 8px ${C.amberGlow}`,
        }}
          animate={{ scaleY: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        />

        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder=" "
          style={{
            width:       '100%',
            background:  'transparent',
            border:      'none',
            outline:     'none',
            padding:     '22px 14px 8px',
            fontSize:    13.5,
            fontFamily:  C.sans,
            color:       C.text,
            caretColor:  C.amber,
            paddingRight: type === 'password' ? 44 : 14,
            minHeight:   56,
            letterSpacing: '-0.01em',
          }}
        />

        {/* Floating label */}
        <label style={{
          position:      'absolute',
          left:          14,
          top:           lifted ? 8   : '50%',
          transform:     lifted ? 'none' : 'translateY(-50%)',
          fontSize:      lifted ? 9.5  : 13.5,
          fontWeight:    lifted ? 700  : 400,
          letterSpacing: lifted ? '0.08em' : '-0.01em',
          textTransform: lifted ? 'uppercase' : 'none',
          fontFamily:    lifted ? C.mono : C.sans,
          color:         focused ? C.amber : error ? C.danger : C.textMid,
          transition:    'all 0.15s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: 'none',
          userSelect:    'none',
        }}>
          {label}
        </label>

        {/* Password eye toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{
              position:       'absolute',
              right:          13,
              top:            '50%',
              transform:      'translateY(-50%)',
              background:     'none',
              border:         'none',
              cursor:         'pointer',
              color:          C.textMid,
              display:        'flex',
              alignItems:     'center',
              padding:        4,
              borderRadius:   6,
              transition:     'color 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.amber)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMid)}
          >
            {showPass ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
          </button>
        )}
      </div>

      {/* Inline error */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              margin:      '5px 0 0',
              fontSize:    11,
              color:       C.danger,
              fontFamily:  C.mono,
              paddingLeft: 14,
              overflow:    'hidden',
            }}
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PASSWORD STRENGTH — glowing segmented meter
═══════════════════════════════════════════════════════════════════ */

function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6)           s++;
    if (password.length >= 10)          s++;
    if (/[A-Z]/.test(password))         s++;
    if (/[0-9]/.test(password))         s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const tiers = [
    { color: '#f87171', glow: 'rgba(248,113,113,0.5)', label: 'Very weak'   },
    { color: '#fb923c', glow: 'rgba(251,146,60,0.5)',  label: 'Weak'        },
    { color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',  label: 'Fair'        },
    { color: '#34d399', glow: 'rgba(52,211,153,0.5)',  label: 'Strong'      },
    { color: '#10b981', glow: 'rgba(16,185,129,0.5)',  label: 'Very strong' },
  ];

  if (!password) return null;
  const tier = tiers[Math.max(score - 1, 0)];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: 14 }}
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <motion.div
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i <= score ? 1 : 0.3 }}
            transition={{ duration: 0.22, delay: i * 0.04 }}
            style={{
              flex:         1,
              height:       3,
              borderRadius: 99,
              background:   i <= score ? tier.color : 'rgba(255,255,255,0.05)',
              boxShadow:    i <= score ? `0 0 7px ${tier.glow}` : 'none',
              transformOrigin: 'left',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize:   10.5,
          fontFamily: C.mono,
          color:      tier.color,
        }}>{tier.label}</span>
        <span style={{
          fontSize:   10,
          fontFamily: C.mono,
          color:      C.textDim,
        }}>{score}/5</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ERROR BANNER — full-width error display
═══════════════════════════════════════════════════════════════════ */

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -4, height: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: 'hidden', marginBottom: 12, marginTop: 4 }}
    >
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          9,
        padding:      '10px 14px',
        borderRadius: 10,
        background:   C.dangerBg,
        border:       `1px solid ${C.dangerBorder}`,
        fontSize:     12,
        color:        C.danger,
        fontFamily:   C.mono,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        {message}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUBMIT BUTTON — animated gradient + shimmer sweep
═══════════════════════════════════════════════════════════════════ */

function SubmitButton({ loading, mode }: { loading: boolean; mode: 'login' | 'register' }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={!loading ? { scale: 1.015, y: -1 } : {}}
      whileTap={!loading ? { scale: 0.985 } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:          '100%',
        padding:        '13px 20px',
        borderRadius:   10,
        fontSize:       13.5,
        fontWeight:     700,
        fontFamily:     C.sans,
        letterSpacing:  '-0.02em',
        background:     loading
          ? 'rgba(245,158,11,0.28)'
          : 'linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 70%, #d97706 100%)',
        backgroundSize: '200% 100%',
        color:          loading ? C.textDim : '#07040000',
        border:         'none',
        cursor:         loading ? 'not-allowed' : 'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        position:       'relative',
        overflow:       'hidden',
        minHeight:      50,
        marginTop:      6,
        boxShadow:      !loading
          ? `0 0 28px rgba(245,158,11,0.32), 0 3px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)`
          : 'none',
        transition: 'box-shadow 0.2s, background-position 0.4s',
      }}
    >
      {/* Text colour overlay to ensure dark text on amber */}
      <span style={{
        position:  'absolute',
        inset:     0,
        color:     loading ? C.textDim : '#3d1f00',
        display:   'flex',
        alignItems:'center',
        justifyContent: 'center',
        gap:       8,
        fontSize:  13.5,
        fontWeight:700,
        fontFamily:C.sans,
        letterSpacing:'-0.02em',
      }}>
        {loading ? (
          <Loader2 size={16} style={{ animation: 'auth-spin 0.7s linear infinite' }} />
        ) : (
          <>
            {mode === 'login' ? 'Sign in to cookie.io' : 'Create your account'}
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight size={15} strokeWidth={2.2} />
            </motion.span>
          </>
        )}
      </span>

      {/* Shimmer sweep on hover */}
      <AnimatePresence>
        {hovered && !loading && (
          <motion.div
            aria-hidden="true"
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: '210%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              position:   'absolute',
              top:        0,
              bottom:     0,
              width:      '45%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.26), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE CHIPS — bottom of card
═══════════════════════════════════════════════════════════════════ */

function FeatureChips() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.65 }}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            7,
        marginTop:      20,
        paddingTop:     18,
        borderTop:      `1px solid ${C.border}`,
        flexWrap:       'wrap',
      }}
    >
      {[
        { Icon: Shield,   label: 'Private'   },
        { Icon: Zap,      label: 'Real-time' },
        { Icon: BookOpen, label: 'Markdown'  },
      ].map(({ Icon, label }) => (
        <div
          key={label}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          5,
            padding:      '5px 10px',
            borderRadius: 6,
            border:       `1px solid ${C.border}`,
            background:   C.amberBg,
            fontSize:     10.5,
            fontFamily:   C.mono,
            color:        C.textMid,
            letterSpacing:'0.02em',
          }}
        >
          <Icon size={10} style={{ color: C.amber }} strokeWidth={2} />
          {label}
        </div>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN AUTH PAGE
═══════════════════════════════════════════════════════════════════ */

export function AuthPage() {
  const { login, register } = useAuth();

  const [mode,        setMode]        = useState<'login' | 'register'>('login');
  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Mouse parallax tilt for the card
  const mouseX   = useMotionValue(0);
  const mouseY   = useMotionValue(0);
  const rotateX  = useTransform(mouseY, [-280, 280], [5, -5]);
  const rotateY  = useTransform(mouseX, [-280, 280], [-5, 5]);
  const springRX = useSpring(rotateX, { stiffness: 90, damping: 22 });
  const springRY = useSpring(rotateY, { stiffness: 90, damping: 22 });

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const r  = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - (r.left + r.width / 2));
    mouseY.set(e.clientY - (r.top + r.height / 2));
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    const errs: Record<string, string> = {};
    if (!username.trim())                errs.username = 'Required';
    else if (username.trim().length < 2) errs.username = 'Min 2 characters';
    if (!password)                       errs.password = 'Required';
    else if (password.length < 6)        errs.password = 'Min 6 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(
          username.trim(),
          password,
          displayName.trim() || username.trim(),
        );
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setErrors({});
    setGlobalError('');
    setUsername('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <div style={{
      minHeight:      '100dvh',
      background:     C.bgPage,
      display:        'flex',
      alignItems:     'stretch',
      position:       'relative',
      overflow:       'hidden',
      fontFamily:     C.sans,
    }}>
      {/* ── Background layers ── */}
      <GlowOrbs />
      <GeistGrid />
      <RisingParticles />
      <GrainOverlay />

      {/* Radial vignette darkening edges */}
      <div aria-hidden="true" style={{
        position:   'fixed',
        inset:       0,
        background: 'radial-gradient(ellipse 88% 88% at 50% 50%, transparent 48%, rgba(7,6,3,0.72) 100%)',
        pointerEvents: 'none',
        zIndex:      3,
      }} />

      {/* ── Left panel (desktop ≥900px) ── */}
      <div className="auth-left-col" style={{
        flex:      '0 0 42%',
        position:  'relative',
        zIndex:    4,
      }}>
        <LeftPanel />
      </div>

      {/* ── Right: form panel ── */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px 20px',
        position:       'relative',
        zIndex:         4,
      }}>

        {/* THE CARD */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width:           '100%',
            maxWidth:        420,
            background:      C.bgCard,
            border:          `1px solid ${C.border}`,
            borderRadius:    18,
            position:        'relative',
            overflow:        'hidden',
            rotateX:         springRX,
            rotateY:         springRY,
            transformPerspective: 1100,
            boxShadow: `
              0 0 0 1px rgba(245,158,11,0.055),
              0 10px 50px rgba(0,0,0,0.75),
              0 0 90px rgba(180,83,9,0.08),
              inset 0 1px 0 rgba(255,255,255,0.045)
            `,
          } as any}
        >
          {/* Corner brackets */}
          <CornerBracket pos="tl" />
          <CornerBracket pos="tr" />
          <CornerBracket pos="bl" />
          <CornerBracket pos="br" />

          {/* Animated top gradient bar */}
          <div aria-hidden="true" style={{
            height:         3,
            background:     'linear-gradient(90deg, #78350f, #b45309, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706, #b45309, #78350f)',
            backgroundSize: '300% 100%',
            animation:      'auth-gradient-bar 3.5s linear infinite',
          }} />

          {/* Inner top glow */}
          <div aria-hidden="true" style={{
            position:   'absolute',
            top:        0,
            left:       0,
            right:      0,
            height:     110,
            background: 'radial-gradient(ellipse 75% 100% at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Card body */}
          <div style={{ padding: '30px 30px 26px' }}>

            {/* Header — logo + title + subtitle */}
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              marginBottom:   26,
            }}>
              <AuthHeroLogo />

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                style={{
                  fontSize:      26,
                  fontWeight:    900,
                  letterSpacing: '-0.06em',
                  lineHeight:    1,
                  marginBottom:  7,
                  marginTop:     14,
                  fontFamily:    C.sans,
                  color:         C.text,
                  textAlign:     'center',
                }}
              >
                cookie<span style={{ color: C.amber }}>.io</span>
              </motion.h1>

              <AnimatePresence mode="wait">
                <motion.p
                  key={mode}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    margin:        0,
                    fontSize:      12,
                    fontFamily:    C.mono,
                    color:         C.textMid,
                    textAlign:     'center',
                    letterSpacing: '0.02em',
                  }}
                >
                  {mode === 'login'
                    ? '> welcome back — your notes await'
                    : '> create your writing workspace'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Mode toggle */}
            <ModeToggle mode={mode} onSwitch={switchMode} />

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="dn"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <GlassInput
                      label="Display name (optional)"
                      value={displayName}
                      onChange={setDisplayName}
                      autoComplete="name"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassInput
                label="Username"
                value={username}
                onChange={setUsername}
                error={errors.username}
                autoComplete={mode === 'login' ? 'username' : 'new-user'}
                minLength={2}
              />

              <GlassInput
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
                {globalError && <ErrorBanner key="ge" message={globalError} />}
              </AnimatePresence>

              <SubmitButton loading={loading} mode={mode} />
            </form>

            {/* Switch mode — clean text link, no "sign up free" */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.52 }}
              style={{
                textAlign:  'center',
                fontSize:   11.5,
                marginTop:  16,
                color:      C.textMid,
                fontFamily: C.mono,
              }}
            >
              {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                style={{
                  fontWeight:          700,
                  color:               C.amber,
                  background:          'none',
                  border:              'none',
                  cursor:              'pointer',
                  textDecoration:      'underline',
                  textUnderlineOffset: 3,
                  fontSize:            'inherit',
                  fontFamily:          'inherit',
                  letterSpacing:       '0.01em',
                }}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </motion.p>

            <FeatureChips />
          </div>

          {/* Bottom terminal status bar */}
          <div style={{
            borderTop:  `1px solid ${C.border}`,
            padding:    '8px 16px',
            display:    'flex',
            alignItems: 'center',
            gap:        7,
            background: 'rgba(0,0,0,0.22)',
          }}>
            <StatusDot active />
            <span style={{
              fontSize:      10,
              fontFamily:    C.mono,
              color:         C.textDim,
              letterSpacing: '0.03em',
            }}>
              cookie.io · write beautifully · v2.0.0
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Responsive + keyframe styles ── */}
      <style>{`
        @keyframes auth-gradient-bar {
          0%   { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }

        /* Left column hidden on mobile, revealed on desktop */
        .auth-left-col {
          display: none;
        }
        @media (min-width: 900px) {
          .auth-left-col {
            display: block;
          }
        }

        /* Autofill override — keeps dark theme */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ede0c8;
          -webkit-box-shadow: 0 0 0px 1000px #0d0b07 inset;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #f59e0b;
        }

        /* Selection colour */
        ::selection {
          background: rgba(245,158,11,0.32);
          color: #ede0c8;
        }

        /* Thin scrollbar for left panel */
        .auth-left-col ::-webkit-scrollbar {
          width: 3px;
        }
        .auth-left-col ::-webkit-scrollbar-thumb {
          background: rgba(245,158,11,0.28);
          border-radius: 99px;
        }
      `}</style>
    </div>
  );
}
