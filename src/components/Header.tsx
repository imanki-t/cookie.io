import React, { useRef, useState } from 'react';
import { Menu, Search, Plus, LogOut, Settings, ChevronDown, FileText } from 'lucide-react';
import { CookieLogoMark, UserAvatar } from './Logo';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

/* ── Live WS dot ── */
function WsDot({ connected }: { connected: boolean }) {
  return (
    <div className="ws-pill">
      <span className={`ws-dot ${connected ? 'connected' : ''}`} />
      <span>{connected ? 'live' : 'offline'}</span>
    </div>
  );
}

/* ── Collab badge ── */
function CollabStack({ collaborators }: { collaborators: Array<{ userId: string; userName: string; color: string }> }) {
  if (!collaborators.length) return null;
  return (
    <div className="account-collab-stack">
      {collaborators.slice(0, 3).map((c) => (
        <div key={c.userId} className="collab-avatar" style={{ background: c.color }} title={c.userName}>
          {c.userName[0]?.toUpperCase()}
        </div>
      ))}
      {collaborators.length > 3 && (
        <div className="collab-avatar" style={{ background: 'var(--accents-4)' }}>
          +{collaborators.length - 3}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { state, dispatch, createNote } = useApp();
  const { user, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
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

  const username    = user?.username    || 'anonymous';
  const displayName = user?.displayName || user?.username || 'User';

  const activeFolder = state.folders.find((f) => f._id === state.activeFolderId);

  return (
    <header className="app-header">
      {/* Sidebar toggle */}
      <button
        className="icon-btn"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        title="Toggle sidebar (Ctrl+\\)"
        aria-label="Toggle sidebar"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M1.5 3h12M1.5 7.5h12M1.5 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Logo */}
      <a className="header-logo" href="#" onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_ACTIVE_NOTE', id: null }); }}>
        <CookieLogoMark className="w-6 h-6" />
        <span className="header-logo-text">
          cookie<span className="text-accent">.io</span>
        </span>
      </a>

      {/* Breadcrumb */}
      {activeFolder && (
        <div className="header-breadcrumb">
          <span className="header-breadcrumb-sep">/</span>
          <span className="header-breadcrumb-name">{activeFolder.name}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* WS indicator */}
      <WsDot connected={state.wsConnected} />

      {/* Collab avatars */}
      <CollabStack collaborators={state.collaborators} />

      {/* Search */}
      <button
        className="search-trigger"
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        title="Search (Ctrl+K)"
        aria-label="Search notes"
      >
        <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className="search-trigger-text" style={{ color: 'var(--accents-4)' }}>Search notes…</span>
        <kbd className="kbd search-trigger-kbd">⌘K</kbd>
      </button>

      {/* New note */}
      <button className="btn-new-note" onClick={handleNewNote} title="New note">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <span className="btn-new-note-text">New</span>
      </button>

      {/* Account */}
      <div className="relative" ref={accountRef}>
        <button
          className="avatar-trigger"
          onClick={() => setAccountOpen((v) => !v)}
          aria-label="Account menu"
        >
          <UserAvatar username={username} size={28} showRing={accountOpen} />
          <ChevronDown
            size={10}
            className="avatar-chevron"
            style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}
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
                className="account-dropdown"
              >
                {/* Profile header */}
                <div className="account-dropdown-header">
                  <UserAvatar username={username} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <p className="account-display-name truncate">{displayName}</p>
                    <p className="account-username">@{username}</p>
                  </div>
                </div>

                <div className="account-sep" />

                {/* Note count pill */}
                <div style={{ padding: '4px 10px 6px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--accents-1)',
                    border: '1px solid var(--accents-2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} style={{ color: 'var(--accents-5)' }} />
                      <span style={{ fontSize: 11, color: 'var(--accents-5)' }}>Notes</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {state.notes.length}
                    </span>
                  </div>
                </div>

                <div className="account-sep" />

                <button
                  className="account-menu-item"
                  onClick={() => { setAccountOpen(false); dispatch({ type: 'SET_SETTINGS_OPEN', open: true }); }}
                >
                  <Settings size={13} style={{ color: 'var(--accents-4)' }} />
                  <span>Settings</span>
                </button>

                <div className="account-sep" />

                <button
                  className="account-menu-item danger"
                  onClick={() => { setAccountOpen(false); logout(); }}
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
