import React from 'react';

/* ─── Deterministic avatar color from username ─────────── */
export function getUserAvatarColor(username: string): string {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < username.length; i++) {
    hash ^= username.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const hue = ((hash * 2654435761) >>> 0) % 360;
  const sat = 55 + ((hash >> 8) & 0xff) % 25;
  const lit = 38 + ((hash >> 16) & 0xff) % 18;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

/* ─── Professional User Avatar ──────────────────────────── */
export function UserAvatar({
  username,
  size = 28,
  className = '',
  showRing = false,
}: {
  username: string;
  size?: number;
  className?: string;
  showRing?: boolean;
}) {
  const bg = getUserAvatarColor(username);
  const initial = (username[0] || '?').toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, borderRadius: '50%', display: 'block' }}
    >
      <defs>
        <radialGradient id={`avatar-grad-${username.slice(0,3)}`} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </radialGradient>
        <radialGradient id={`avatar-inner-${username.slice(0,3)}`} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
        </radialGradient>
      </defs>

      {/* Ring */}
      {showRing && (
        <circle cx="18" cy="18" r="17" stroke={bg} strokeWidth="2.5" fill="none" opacity="0.5" />
      )}

      {/* Background */}
      <circle cx="18" cy="18" r="18" fill={bg} />

      {/* Texture overlay */}
      <circle cx="18" cy="18" r="18" fill={`url(#avatar-grad-${username.slice(0,3)})`} />

      {/* Initial letter */}
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.95)"
        fontSize={size * 0.38}
        fontWeight="700"
        fontFamily="'Geist Sans', system-ui, sans-serif"
        letterSpacing="-0.02em"
      >
        {initial}
      </text>

      {/* Inner glow */}
      <circle cx="18" cy="18" r="18" fill={`url(#avatar-inner-${username.slice(0,3)})`} />
    </svg>
  );
}

/* ─── Cookie Logo — full version ─────────────────────────── */
export function CookieLogo({ className = 'w-8 h-8', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Glow ring */}
      <circle cx="32" cy="33" r="27" fill="rgba(217,119,6,0.09)" />
      {/* Main cookie body */}
      <path
        d="M32 7C40 7 47.5 10.5 52 16C56 21 58 27 58 33C58 39 56 45 52 49.5C48 54 42 57 36 58C30 59 24 57.5 19 55C14 52 10 47 8 41C6 36 6 30 8 24.5C10 19 13.5 14 18 11C22 8 27 7 32 7Z"
        fill="#D97706"
      />
      <path
        d="M32 10C39.5 10 46.5 13.2 51 18.5C55 23 57 29 57 33C57 38.5 55 44 51 48C47 52 41.5 55 36 55.8C30 56.7 24.5 55.2 19.5 52.5C15 50 11 45.5 9 40C7.2 35 7.2 29.5 9 24C11 18.5 14.5 14 19 11.2C23 8.7 27.5 10 32 10Z"
        fill="#F59E0B"
        opacity="0.95"
      />
      {/* Highlight */}
      <ellipse cx="23" cy="19" rx="9" ry="5.5" fill="white" opacity="0.10" transform="rotate(-20 23 19)" />
      {/* Chips */}
      <ellipse cx="19" cy="27" rx="5" ry="4.2" fill="#78350F" opacity="0.90" transform="rotate(-12 19 27)" />
      <ellipse cx="37" cy="23" rx="4.5" ry="3.8" fill="#78350F" opacity="0.90" transform="rotate(9 37 23)" />
      <ellipse cx="25" cy="40" rx="5" ry="4" fill="#78350F" opacity="0.90" transform="rotate(-6 25 40)" />
      <ellipse cx="44" cy="37" rx="4" ry="3.4" fill="#78350F" opacity="0.85" transform="rotate(14 44 37)" />
      <ellipse cx="33" cy="48" rx="3.5" ry="2.8" fill="#78350F" opacity="0.80" transform="rotate(-5 33 48)" />
      {/* Chip highlights */}
      <ellipse cx="17" cy="25.5" rx="1.6" ry="1" fill="white" opacity="0.28" transform="rotate(-12 17 25.5)" />
      <ellipse cx="35.5" cy="21.5" rx="1.4" ry="0.9" fill="white" opacity="0.28" transform="rotate(9 35.5 21.5)" />
      {/* Bite notch with decorative dots */}
      <circle cx="52" cy="14" r="6" fill="var(--bg)" />
      <circle cx="44" cy="10" r="2.2" fill="#F59E0B" opacity="0.7" />
      <circle cx="48" cy="7" r="1.4" fill="#F59E0B" opacity="0.5" />
      <circle cx="53" cy="9" r="1.3" fill="#F59E0B" opacity="0.45" />
    </svg>
  );
}

/* ─── Cookie Logo Mark (compact) ────────────────────────── */
export function CookieLogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M32 7C40 7 47.5 10.5 52 16C56 21 58 27 58 33C58 39 56 45 52 49.5C48 54 42 57 36 58C30 59 24 57.5 19 55C14 52 10 47 8 41C6 36 6 30 8 24.5C10 19 13.5 14 18 11C22 8 27 7 32 7Z"
        fill="#D97706"
      />
      <path
        d="M32 10C39.5 10 46.5 13.2 51 18.5C55 23 57 29 57 33C57 38.5 55 44 51 48C47 52 41.5 55 36 55.8C30 56.7 24.5 55.2 19.5 52.5C15 50 11 45.5 9 40C7.2 35 7.2 29.5 9 24C11 18.5 14.5 14 19 11.2C23 8.7 27.5 10 32 10Z"
        fill="#F59E0B"
        opacity="0.95"
      />
      <ellipse cx="19" cy="27" rx="5" ry="4.2" fill="#78350F" opacity="0.90" transform="rotate(-12 19 27)" />
      <ellipse cx="37" cy="23" rx="4.5" ry="3.8" fill="#78350F" opacity="0.90" transform="rotate(9 37 23)" />
      <ellipse cx="25" cy="40" rx="5" ry="4" fill="#78350F" opacity="0.90" transform="rotate(-6 25 40)" />
      <ellipse cx="44" cy="37" rx="4" ry="3.4" fill="#78350F" opacity="0.85" transform="rotate(14 44 37)" />
      <circle cx="52" cy="14" r="6" fill="var(--bg)" />
      <circle cx="44" cy="10" r="2.2" fill="#F59E0B" opacity="0.7" />
    </svg>
  );
}

export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return <CookieLogo className={className} />;
}

export function LogoMark({ className = 'w-5 h-5' }: { className?: string }) {
  return <CookieLogoMark className={className} />;
}
