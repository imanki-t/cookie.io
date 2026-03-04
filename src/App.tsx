import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ToastProvider';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { SearchModal } from './components/SearchModal';
import { FolderModal, MoveNoteModal } from './components/FolderModal';
import { SettingsModal } from './components/SettingsModal';
import { AnimatePresence } from 'motion/react';

function AppInner() {
  const { state, dispatch } = useApp();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K — search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_SEARCH_OPEN', open: !state.searchOpen });
      }
      // Cmd/Ctrl+, — settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        dispatch({ type: 'SET_SETTINGS_OPEN', open: !state.settingsOpen });
      }
      // Cmd/Ctrl+\ — toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
      // Esc — close modals
      if (e.key === 'Escape') {
        if (state.searchOpen)   dispatch({ type: 'SET_SEARCH_OPEN',   open: false });
        if (state.settingsOpen) dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
        if (state.folderModalOpen) dispatch({ type: 'SET_FOLDER_MODAL', open: false });
        if (state.moveNoteOpen) dispatch({ type: 'SET_MOVE_NOTE', open: false });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [state, dispatch]);

  return (
    <div className="app-layout">
      <Header />
      <Sidebar />
      <main className="editor-area overflow-hidden">
        <Editor />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {state.searchOpen      && <SearchModal key="search" />}
        {state.folderModalOpen && <FolderModal key="folder" />}
        {state.moveNoteOpen    && <MoveNoteModal key="move" />}
        {state.settingsOpen    && <SettingsModal key="settings" />}
      </AnimatePresence>

      {/* Mobile sidebar overlay */}
      {state.sidebarOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => dispatch({ type: 'SET_SIDEBAR', open: false })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </ToastProvider>
  );
}
