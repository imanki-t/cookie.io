import React from 'react';

// ─── Deterministic avatar color from username ─────────────────
// FNV-1a hash → hue via golden angle, high saturation, mid lightness
// Guarantees vivid colors that don't blend into dark/light backgrounds
export function getUserAvatarColor(username: string): string {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < username.length; i++) {
    hash ^= username.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  // Golden angle multiplier for even hue distribution
  const hue = ((hash * 2654435761) >>> 0) % 360;
  // Saturation 65–85% for vivid but not neon
  const sat = 65 + ((hash >> 8) & 0xff) % 20;
  // Lightness 42–58% — readable on both light and dark bg, white icon on top
  const lit = 42 + ((hash >> 16) & 0xff) % 16;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

// ─── SVG User Avatar ──────────────────────────────────────────
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
  const color = getUserAvatarColor(username);
  const r = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, borderRadius: '50%', display: 'block' }}
    >
      {/* Ring (optional) */}
      {showRing && (
        <circle
          cx="16" cy="16" r="15"
          stroke={color}
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      )}
      {/* Background circle */}
      <circle cx="16" cy="16" r="16" fill={color} />
      {/* Head */}
      <circle cx="16" cy="12.5" r="5.5" fill="rgba(255,255,255,0.92)" />
      {/* Body silhouette */}
      <path
        d="M5 28c0-6.075 4.925-11 11-11s11 4.925 11 11"
        fill="rgba(255,255,255,0.92)"
      />
      {/* Subtle inner glow */}
      <circle cx="16" cy="16" r="16" fill="url(#avatar-glow)" />
      <defs>
        <radialGradient id="avatar-glow" cx="35%" cy="25%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Cookie Logo ──────────────────────────────────────────────
export function CookieLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="33" r="26" fill="var(--accent)" opacity="0.08" />
      <path
        d="M32 6C39 6 46 9 50 14C54 18 57 24 57 31C57 38 54 44 49 48C44 52 38 55 32 55C26 55 20 52 15 48C10 44 7 38 7 31C7 24 10 18 14 14C18 9 25 6 32 6Z"
        fill="var(--accent)"
      />
      <path
        d="M32 9C38 9 44 12 48 16.5C52 21 54.5 26.5 54.5 32C54.5 37.5 52 43 48 47C44 51 38 53.5 32 53.5C26 53.5 20 51 16 47C12 43 9.5 37.5 9.5 32C9.5 26.5 12 21 16 16.5C20 12 26 9 32 9Z"
        fill="var(--accent)"
        opacity="0.92"
      />
      <ellipse cx="24" cy="18" rx="8" ry="5" fill="white" opacity="0.12" transform="rotate(-20 24 18)" />
      <ellipse cx="20" cy="26" rx="4.5" ry="3.8" fill="#6b3a1f" opacity="0.88" transform="rotate(-12 20 26)" />
      <ellipse cx="36" cy="22" rx="4" ry="3.4" fill="#6b3a1f" opacity="0.88" transform="rotate(8 36 22)" />
      <ellipse cx="26" cy="39" rx="4.5" ry="3.5" fill="#6b3a1f" opacity="0.88" transform="rotate(-6 26 39)" />
      <ellipse cx="43" cy="36" rx="3.5" ry="3" fill="#6b3a1f" opacity="0.88" transform="rotate(14 43 36)" />
      <ellipse cx="34" cy="47" rx="3" ry="2.5" fill="#6b3a1f" opacity="0.75" transform="rotate(-4 34 47)" />
      <ellipse cx="18.5" cy="24.5" rx="1.5" ry="1" fill="white" opacity="0.3" transform="rotate(-12 18.5 24.5)" />
      <ellipse cx="34.5" cy="20.5" rx="1.3" ry="0.9" fill="white" opacity="0.3" transform="rotate(8 34.5 20.5)" />
      <circle cx="53" cy="14" r="13" fill="var(--bg)" />
      <circle cx="44" cy="9" r="2" fill="var(--accent)" opacity="0.7" />
      <circle cx="47" cy="6" r="1.3" fill="var(--accent)" opacity="0.5" />
      <circle cx="51" cy="8" r="1.2" fill="var(--accent)" opacity="0.45" />
      <circle cx="43" cy="5" r="0.9" fill="var(--accent)" opacity="0.35" />
    </svg>
  );
}

export function CookieLogoMark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M32 6C39 6 46 9 50 14C54 18 57 24 57 31C57 38 54 44 49 48C44 52 38 55 32 55C26 55 20 52 15 48C10 44 7 38 7 31C7 24 10 18 14 14C18 9 25 6 32 6Z"
        fill="var(--accent)"
      />
      <ellipse cx="20" cy="26" rx="4.5" ry="3.8" fill="#6b3a1f" opacity="0.88" transform="rotate(-12 20 26)" />
      <ellipse cx="36" cy="22" rx="4" ry="3.4" fill="#6b3a1f" opacity="0.88" transform="rotate(8 36 22)" />
      <ellipse cx="26" cy="39" rx="4.5" ry="3.5" fill="#6b3a1f" opacity="0.88" transform="rotate(-6 26 39)" />
      <ellipse cx="43" cy="36" rx="3.5" ry="3" fill="#6b3a1f" opacity="0.88" transform="rotate(14 43 36)" />
      <circle cx="53" cy="14" r="13" fill="var(--bg)" />
      <circle cx="44" cy="9" r="2" fill="var(--accent)" opacity="0.7" />
      <circle cx="47" cy="6" r="1.3" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}

export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return <CookieLogo className={className} />;
}

export function LogoMark({ className = 'w-5 h-5' }: { className?: string }) {
  return <CookieLogoMark className={className} />;
}
