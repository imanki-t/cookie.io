import React from 'react';
import {
  Menu, Search, Settings, Plus, Wifi, WifiOff,
  ChevronDown, Moon, Sun, Monitor,
} from 'lucide-react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import { Theme } from '../types';

const THEMES: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'dark',   icon: <Moon className="h-3.5 w-3.5" />,    label: 'Dark'   },
  { value: 'light',  icon: <Sun className="h-3.5 w-3.5" />,     label: 'Light'  },
  { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'System' },
];

export function Header() {
  const { state, dispatch, createNote } = useApp();

  const handleNewNote = async () => {
    const folderId = typeof state.activeFolderId === 'string' && state.activeFolderId !== 'all' && state.activeFolderId !== 'pinned'
      ? state.activeFolderId
      : null;
    await createNote(folderId);
    if (window.innerWidth < 768) dispatch({ type: 'SET_SIDEBAR', open: false });
  };

  return (
    <header className="header sticky top-0 z-50 border-b border-accents-2 bg-background/95 backdrop-blur-xl flex items-center px-4 h-14 gap-3">
      {/* Left */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        className="toolbar-btn"
        title="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Logo className="h-7 w-7" />
        <span className="font-bold text-sm tracking-tight hidden sm:block">
          cookie<span className="text-accent">.io</span>
        </span>
      </div>

      {/* Breadcrumb / active folder */}
      {state.activeFolderId && state.activeFolderId !== 'all' && state.activeFolderId !== 'pinned' && (
        <div className="hidden md:flex items-center gap-1.5 text-xs text-accents-5">
          <span>/</span>
          <span className="font-medium text-foreground">
            {state.folders.find((f) => f._id === state.activeFolderId)?.name ?? 'Folder'}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* WS status */}
      <div className="hidden sm:flex items-center gap-2">
        <div
          className={`ws-dot ${state.wsConnected ? 'connected' : 'disconnected'}`}
          title={state.wsConnected ? 'Real-time sync active' : 'Connecting…'}
        />
        <span className="text-[10px] text-accents-4 font-mono hidden lg:block">
          {state.wsConnected ? 'live' : 'offline'}
        </span>
      </div>

      {/* Collaborators */}
      {state.collaborators.length > 0 && (
        <div className="hidden sm:flex items-center">
          {state.collaborators.slice(0, 4).map((c) => (
            <div
              key={c.userId}
              className="collab-avatar"
              style={{ background: c.color }}
              title={c.userName}
            >
              {c.userName[0]}
            </div>
          ))}
          {state.collaborators.length > 4 && (
            <div className="collab-avatar bg-accents-3 text-foreground text-[9px]">
              +{state.collaborators.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Theme switcher */}
      <div className="hidden sm:flex items-center rounded-lg border border-accents-2 bg-accents-1 p-0.5 gap-0.5">
        {THEMES.map((t) => (
          <button
            key={t.value}
            onClick={() => dispatch({ type: 'SET_THEME', theme: t.value })}
            title={t.label}
            className={`flex items-center justify-center rounded-md h-6 w-6 transition-all text-xs ${
              state.theme === t.value
                ? 'bg-background text-foreground shadow-sm border border-accents-2'
                : 'text-accents-5 hover:text-foreground'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Search */}
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-accents-2 bg-accents-1/50 px-3 py-1.5 text-xs text-accents-5 hover:text-foreground hover:border-accents-4 transition-all"
        title="Search (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:block">Search</span>
        <kbd className="hidden md:flex items-center gap-0.5 rounded border border-accents-2 bg-background px-1.5 py-0.5 text-[10px] font-mono text-accents-4">
          ⌘K
        </kbd>
      </button>

      {/* New note */}
      <button
        onClick={handleNewNote}
        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-all"
        style={{ background: 'var(--accent)' }}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:block">New Note</span>
      </button>

      {/* Settings */}
      <button
        onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
        className="toolbar-btn"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* Mobile: Search */}
      <button
        onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
        className="sm:hidden toolbar-btn"
      >
        <Search className="h-4 w-4" />
      </button>
    </header>
  );
}
