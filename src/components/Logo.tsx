import React from 'react';

export function CookieLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Soft outer glow */}
      <circle cx="32" cy="33" r="26" fill="var(--accent)" opacity="0.08" />
      {/* Cookie body - warm golden brown */}
      <path
        d="M32 6C39 6 46 9 50 14C54 18 57 24 57 31C57 38 54 44 49 48C44 52 38 55 32 55C26 55 20 52 15 48C10 44 7 38 7 31C7 24 10 18 14 14C18 9 25 6 32 6Z"
        fill="var(--accent)"
      />
      {/* Cookie surface texture - lighter inner */}
      <path
        d="M32 9C38 9 44 12 48 16.5C52 21 54.5 26.5 54.5 32C54.5 37.5 52 43 48 47C44 51 38 53.5 32 53.5C26 53.5 20 51 16 47C12 43 9.5 37.5 9.5 32C9.5 26.5 12 21 16 16.5C20 12 26 9 32 9Z"
        fill="var(--accent)"
        opacity="0.92"
      />
      {/* Highlight */}
      <ellipse cx="24" cy="18" rx="8" ry="5" fill="white" opacity="0.12" transform="rotate(-20 24 18)" />
      {/* Chocolate chips */}
      <ellipse cx="20" cy="26" rx="4.5" ry="3.8" fill="#6b3a1f" opacity="0.88" transform="rotate(-12 20 26)" />
      <ellipse cx="36" cy="22" rx="4" ry="3.4" fill="#6b3a1f" opacity="0.88" transform="rotate(8 36 22)" />
      <ellipse cx="26" cy="39" rx="4.5" ry="3.5" fill="#6b3a1f" opacity="0.88" transform="rotate(-6 26 39)" />
      <ellipse cx="43" cy="36" rx="3.5" ry="3" fill="#6b3a1f" opacity="0.88" transform="rotate(14 43 36)" />
      <ellipse cx="34" cy="47" rx="3" ry="2.5" fill="#6b3a1f" opacity="0.75" transform="rotate(-4 34 47)" />
      {/* Chip highlights */}
      <ellipse cx="18.5" cy="24.5" rx="1.5" ry="1" fill="white" opacity="0.3" transform="rotate(-12 18.5 24.5)" />
      <ellipse cx="34.5" cy="20.5" rx="1.3" ry="0.9" fill="white" opacity="0.3" transform="rotate(8 34.5 20.5)" />
      {/* Bite mark */}
      <circle cx="53" cy="14" r="13" fill="var(--bg)" />
      {/* Bite edge crumbs */}
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

// Kept for backwards compat
export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return <CookieLogo className={className} />;
}

export function LogoMark({ className = 'w-5 h-5' }: { className?: string }) {
  return <CookieLogoMark className={className} />;
}
