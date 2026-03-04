import React from 'react';

export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cookie base circle */}
      <circle cx="32" cy="32" r="28" fill="var(--accent)" opacity="0.15" />
      {/* Cookie outline with wavy edge using a path */}
      <path
        d="M32 4
           C36 4 40 6 43 8
           C46 10 50 10 52 12
           C56 15 58 19 59 23
           C60 27 60 31 59 35
           C58 39 56 43 53 46
           C50 49 46 51 43 53
           C40 55 36 56 32 56
           C28 56 24 55 21 53
           C18 51 14 49 11 46
           C8 43 6 39 5 35
           C4 31 4 27 5 23
           C6 19 8 15 11 12
           C14 9 18 9 21 7
           C24 5 28 4 32 4Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      {/* Chocolate chips */}
      <ellipse cx="22" cy="26" rx="4" ry="3.5" fill="#7c3813" opacity="0.85" transform="rotate(-10 22 26)" />
      <ellipse cx="38" cy="24" rx="3.5" ry="3" fill="#7c3813" opacity="0.85" transform="rotate(8 38 24)" />
      <ellipse cx="28" cy="38" rx="4" ry="3" fill="#7c3813" opacity="0.85" transform="rotate(-5 28 38)" />
      <ellipse cx="43" cy="37" rx="3" ry="2.5" fill="#7c3813" opacity="0.85" transform="rotate(12 43 37)" />
      <ellipse cx="32" cy="22" rx="2.5" ry="2" fill="#5a2809" opacity="0.6" transform="rotate(5 32 22)" />
      {/* Bite taken out */}
      <circle cx="56" cy="15" r="12" fill="var(--bg)" />
      {/* Crumbs near bite */}
      <circle cx="48" cy="10" r="1.5" fill="var(--accent)" opacity="0.6" />
      <circle cx="51" cy="6" r="1" fill="var(--accent)" opacity="0.5" />
      <circle cx="55" cy="9" r="1" fill="var(--accent)" opacity="0.4" />
    </svg>
  );
}

export function LogoMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M32 4 C36 4 40 6 43 8 C46 10 50 10 52 12 C56 15 58 19 59 23 C60 27 60 31 59 35 C58 39 56 43 53 46 C50 49 46 51 43 53 C40 55 36 56 32 56 C28 56 24 55 21 53 C18 51 14 49 11 46 C8 43 6 39 5 35 C4 31 4 27 5 23 C6 19 8 15 11 12 C14 9 18 9 21 7 C24 5 28 4 32 4Z"
        fill="var(--accent)" opacity="0.9" />
      <ellipse cx="22" cy="26" rx="4" ry="3.5" fill="#7c3813" opacity="0.85" transform="rotate(-10 22 26)" />
      <ellipse cx="38" cy="24" rx="3.5" ry="3" fill="#7c3813" opacity="0.85" transform="rotate(8 38 24)" />
      <ellipse cx="28" cy="38" rx="4" ry="3" fill="#7c3813" opacity="0.85" transform="rotate(-5 28 38)" />
      <circle cx="56" cy="15" r="12" fill="var(--bg)" />
    </svg>
  );
}
