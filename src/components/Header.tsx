import React, { useRef, useState } from 'react';
import { Menu, Search, Settings, Plus, Moon, Sun, Monitor, ChevronDown, LogOut, User, Lock } from 'lucide-react';
import { CookieLogoMark } from './Logo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// SVG Icons
const WsIcon = ({ connected }: { connected: boolean }) => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <circle cx="4" cy="4" r="4" fill={connected ? '#22c55e' : 'var(--accents-4)'} />
    {connected && <circle cx="4" cy="4" r="4" fill="#22c55e" opacity="0.3">
      <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
    </circle>}
  </svg>
);

const ThemeIcons: Record<Theme, React.ReactNode> = {
  dark:   <Moon size={13} />,
  light:  <Sun  size={13} />,
  system: <Monitor size={13} />,
};

export function Header() {
  const { state, dispatch, createNote } = useApp();
  const { user, logout }                = useAuth();
  const [accountOpen, setAccountOpen]   = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const handleNewNote = async () => {
    const folderId =
      typeof state.activeFolderId === 'string' &&
      state.activeFolderId !== 'all' &&
      state.activeFolderId !== 'pinned'
        ? state.activeFolderId : null;
    await createNote(folderId);
    if (window.innerWidth < 768) dispatch({ type: 'SET_SIDEBAR', open: false });
  };

  const cycleTheme = () => {
    const order: Theme[] = ['dark', 'light', 'system'];
    const next = order[(order.indexOf(state.theme) + 1) % 3];
    dispatch({ type: 'SET_THEME', theme: next });
  };

  return (
    <header className="app-header">
      {/* Left */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="icon-btn"
        title="Toggle sidebar (Ctrl+\\)"
      >
        <Menu size={16} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 select-none">
        <CookieLogoMark className="w-7 h-7" />
        <span className="font-bold text-[15px] tracking-[-0.03em] hidden sm:block">
          cookie<span className="text-accent">.io</span>
        </span>
      </div>

      {/* Folder breadcrumb */}
      {state.activeFolderId &&
        state.activeFolderId !== 'all' &&
        state.activeFolderId !== 'pinned' && (
        <div className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: 'var(--accents-5)' }}>
          <span className="font-mono">/</span>
          <span className="font-semibold" style={{ color: 'var(--fg)' }}>
            {state.folders.find((f) => f._id === state.activeFolderId)?.name ?? 'Folder'}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* WS indicator */}
      <div className="hidden sm:flex items-center gap-1.5">
        <WsIcon connected={state.wsConnected} />
        <span className="text-[10px] font-mono hidden lg:block" style={{ color: 'var(--accents-4)' }}>
          {state.wsConnected ? 'live' : 'offline'}
        </span>
      </div>

      {/* Collab avatars */}
      {state.collaborators.length > 0 && (
        <div className="hidden sm:flex items-center">
          {state.collaborators.slice(0, 4).map((c) => (
            <div key={c.userId} className="collab-avatar text-[9px]"
              style={{ background: c.color }} title={c.userName}>
              {c.userName[0]}
            </div>
          ))}
        </div>
      )}

      {/* Theme */}
      <button onClick={cycleTheme} className="icon-btn" title={`Theme: ${state.theme}`}>
        {ThemeIcons[state.theme]}
      </button>

      {/* Search */}
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        className="search-trigger hidden sm:flex"
        title="Search (Ctrl+K)"
      >
        <Search size={13} />
        <span className="hidden md:block">Search</span>
        <span className="kbd hidden md:flex">⌘K</span>
      </button>

      {/* Mobile search */}
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        className="icon-btn sm:hidden"
      >
        <Search size={15} />
      </button>

      {/* New note */}
      <button
        onClick={handleNewNote}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-85 active:scale-95"
        style={{ background: 'var(--fg)', color: 'var(--bg)' }}
        title="New note"
      >
        <Plus size={13} />
        <span className="hidden sm:block">New</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
        className="icon-btn"
        title="Settings (Ctrl+,)"
      >
        <Settings size={15} />
      </button>

      {/* Account */}
      <div className="relative" ref={accountRef}>
        <button
          onClick={() => setAccountOpen((v) => !v)}
          className="flex items-center gap-1.5 select-none"
          title="Account"
        >
          <div
            className="user-avatar text-[10px]"
            style={{ background: 'var(--accent)' }}
          >
            {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
          </div>
          <ChevronDown
            size={11}
            className="hidden sm:block transition-transform duration-200"
            style={{
              color: 'var(--accents-4)',
              transform: accountOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>

        <AnimatePresence>
          {accountOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="account-menu"
              >
                {/* Profile info */}
                <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid var(--accents-2)' }}>
                  <p className="text-[13px] font-semibold truncate">{user?.displayName || user?.username}</p>
                  <p className="text-[11px] font-mono" style={{ color: 'var(--accents-4)' }}>@{user?.username}</p>
                </div>
                <button
                  className="account-menu-item"
                  onClick={() => { setAccountOpen(false); dispatch({ type: 'SET_SETTINGS_OPEN', open: true }); }}
                >
                  <User size={13} style={{ color: 'var(--accents-4)' }} /> Profile & Settings
                </button>
                <div style={{ borderTop: '1px solid var(--accents-2)', margin: '4px 0' }} />
                <button
                  className="account-menu-item danger"
                  onClick={() => { setAccountOpen(false); logout(); }}
                >
                  <LogOut size={13} style={{ color: 'currentcolor' }} /> Sign out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
