import React, { useRef, useState } from 'react';
import { Menu, Search, Plus, Moon, Sun, Monitor, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { CookieLogoMark, UserAvatar } from './Logo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Live WebSocket indicator
const WsIndicator = ({ connected }: { connected: boolean }) => (
  <div className="ws-status-pill">
    <span className={`ws-dot-animated ${connected ? 'connected' : ''}`} />
    <span className="ws-status-text">{connected ? 'live' : 'offline'}</span>
  </div>
);

const ThemeIcons: Record<Theme, React.ReactNode> = {
  dark:   <Moon size={14} />,
  light:  <Sun  size={14} />,
  system: <Monitor size={14} />,
};

const ThemeLabels: Record<Theme, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
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

  const username = user?.username || 'anonymous';
  const displayName = user?.displayName || user?.username || 'User';

  return (
    <header className="app-header">
      {/* ── Left group ── */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="icon-btn header-menu-btn"
        title="Toggle sidebar (Ctrl+\\)"
        aria-label="Toggle sidebar"
      >
        <Menu size={17} />
      </button>

      {/* Logo */}
      <div className="header-logo select-none">
        <CookieLogoMark className="w-7 h-7" />
        <span className="header-logo-text">
          cookie<span className="text-accent">.io</span>
        </span>
      </div>

      {/* Folder breadcrumb */}
      {state.activeFolderId &&
        state.activeFolderId !== 'all' &&
        state.activeFolderId !== 'pinned' && (
        <div className="folder-breadcrumb">
          <span className="font-mono opacity-50">/</span>
          <span className="folder-breadcrumb-name">
            {state.folders.find((f) => f._id === state.activeFolderId)?.name ?? 'Folder'}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* ── Right group ── */}

      {/* WS indicator — desktop only */}
      <WsIndicator connected={state.wsConnected} />

      {/* Collab avatars */}
      {state.collaborators.length > 0 && (
        <div className="collab-stack">
          {state.collaborators.slice(0, 3).map((c) => (
            <div
              key={c.userId}
              className="collab-avatar text-[9px]"
              style={{ background: c.color }}
              title={c.userName}
            >
              {c.userName[0]}
            </div>
          ))}
          {state.collaborators.length > 3 && (
            <div className="collab-avatar text-[9px]" style={{ background: 'var(--accents-4)' }}>
              +{state.collaborators.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        className="theme-cycle-btn"
        title={`Theme: ${state.theme} (click to cycle)`}
        aria-label="Cycle theme"
      >
        <span className="theme-icon">{ThemeIcons[state.theme]}</span>
        <span className="theme-label">{ThemeLabels[state.theme]}</span>
      </button>

      {/* Search — single unified button */}
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        className="header-search-btn"
        title="Search (Ctrl+K)"
        aria-label="Search notes"
      >
        <Search size={14} />
        <span className="header-search-text">Search notes…</span>
        <kbd className="kbd header-search-kbd">⌘K</kbd>
      </button>

      {/* New note — icon only on mobile, text+icon on desktop */}
      <button
        onClick={handleNewNote}
        className="new-note-btn"
        title="New note"
        aria-label="Create new note"
      >
        <Plus size={14} strokeWidth={2.5} />
        <span className="new-note-text">New</span>
      </button>

      {/* Account — profile avatar + dropdown (replaces separate settings button) */}
      <div className="relative" ref={accountRef}>
        <button
          onClick={() => setAccountOpen((v) => !v)}
          className="avatar-trigger"
          aria-label="Account menu"
          title={`${displayName} (@${username})`}
        >
          <UserAvatar username={username} size={30} showRing={accountOpen} />
          <ChevronDown
            size={11}
            className="avatar-chevron"
            style={{ transform: accountOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        <AnimatePresence>
          {accountOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="account-dropdown"
              >
                {/* Profile header */}
                <div className="account-dropdown-header">
                  <UserAvatar username={username} size={40} />
                  <div className="min-w-0">
                    <p className="account-display-name truncate">{displayName}</p>
                    <p className="account-username">@{username}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="account-dropdown-body">
                  <button
                    className="account-menu-item"
                    onClick={() => {
                      setAccountOpen(false);
                      dispatch({ type: 'SET_SETTINGS_OPEN', open: true });
                    }}
                  >
                    <Settings size={14} style={{ color: 'var(--accents-5)' }} />
                    <span>Settings & Profile</span>
                  </button>

                  <button
                    className="account-menu-item"
                    onClick={cycleTheme}
                  >
                    <span style={{ color: 'var(--accents-5)', display: 'flex' }}>{ThemeIcons[state.theme]}</span>
                    <span>Theme: {ThemeLabels[state.theme]}</span>
                    <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>click to cycle</span>
                  </button>

                  <div className="account-dropdown-divider" />

                  <button
                    className="account-menu-item danger"
                    onClick={() => { setAccountOpen(false); logout(); }}
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
