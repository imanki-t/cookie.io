import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { SearchModal } from './components/SearchModal';
import { FolderModal, MoveNoteModal } from './components/FolderModal';
import { SettingsModal } from './components/SettingsModal';
import { AnimatePresence, motion } from 'motion/react';

function AppInner() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_SEARCH_OPEN', open: !state.searchOpen });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        dispatch({ type: 'SET_SETTINGS_OPEN', open: !state.settingsOpen });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
      if (e.key === 'Escape') {
        if (state.searchOpen)      dispatch({ type: 'SET_SEARCH_OPEN',   open: false });
        if (state.settingsOpen)    dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
        if (state.folderModalOpen) dispatch({ type: 'SET_FOLDER_MODAL',  open: false });
        if (state.moveNoteOpen)    dispatch({ type: 'SET_MOVE_NOTE',     open: false });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state, dispatch]);

  return (
    <div className="app-layout">
      <Header />

      <div className="sidebar" style={{ gridRow: 2, gridColumn: 1 }}>
        <Sidebar />
      </div>

      <main className="editor-area overflow-hidden">
        <Editor />
      </main>

      <AnimatePresence>
        {state.searchOpen      && <SearchModal key="search" />}
        {state.folderModalOpen && <FolderModal key="folder" />}
        {state.moveNoteOpen    && <MoveNoteModal key="move" />}
        {state.settingsOpen    && <SettingsModal key="settings" />}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {state.sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => dispatch({ type: 'SET_SIDEBAR', open: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--accents-2)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm font-mono" style={{ color: 'var(--accents-4)' }}>Loading cookie.io…</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AuthPage />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <AppProvider>
        <AppInner />
      </AppProvider>
    </motion.div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AnimatePresence mode="wait">
          <AuthGuard />
        </AnimatePresence>
      </AuthProvider>
    </ToastProvider>
  );
}
