import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Collaborator, DEFAULT_SETTINGS, Folder, Note, Settings, SortKey, Tag, Theme } from '../types';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  notes:               Note[];
  folders:             Folder[];
  tags:                Tag[];
  activeNoteId:        string | null;
  activeFolderId:      string | null | 'all' | 'pinned';
  loading:             boolean;
  sidebarOpen:         boolean;
  searchOpen:          boolean;
  settingsOpen:        boolean;
  folderModalOpen:     boolean;
  folderModalTarget:   Folder | null;
  moveNoteOpen:        boolean;
  moveNoteTarget:      string | null;
  wsConnected:         boolean;
  collaborators:       Collaborator[];
  sortKey:             SortKey;
  sortDir:             'asc' | 'desc';
  theme:               Theme;
  settings:            Settings;
  error:               string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_LOADING';       loading: boolean }
  | { type: 'SET_NOTES';         notes: Note[] }
  | { type: 'ADD_NOTE';          note: Note }
  | { type: 'UPDATE_NOTE';       note: Note }
  | { type: 'DELETE_NOTE';       id: string }
  | { type: 'SET_FOLDERS';       folders: Folder[] }
  | { type: 'ADD_FOLDER';        folder: Folder }
  | { type: 'UPDATE_FOLDER';     folder: Folder }
  | { type: 'DELETE_FOLDER';     id: string }
  | { type: 'SET_TAGS';          tags: Tag[] }
  | { type: 'SET_ACTIVE_NOTE';   id: string | null }
  | { type: 'SET_ACTIVE_FOLDER'; id: string | null | 'all' | 'pinned' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR';       open: boolean }
  | { type: 'SET_SEARCH_OPEN';   open: boolean }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_FOLDER_MODAL';  open: boolean; folder?: Folder | null }
  | { type: 'SET_MOVE_NOTE';     open: boolean; noteId?: string | null }
  | { type: 'SET_WS_CONNECTED';  connected: boolean }
  | { type: 'SET_COLLABORATORS'; collaborators: Collaborator[] }
  | { type: 'ADD_COLLABORATOR';  collaborator: Collaborator }
  | { type: 'REMOVE_COLLABORATOR'; userId: string }
  | { type: 'SET_SORT';          key: SortKey; dir: 'asc' | 'desc' }
  | { type: 'SET_THEME';         theme: Theme }
  | { type: 'UPDATE_SETTINGS';   settings: Partial<Settings> }
  | { type: 'SET_ERROR';         error: string | null };

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AppState = {
  notes:             [],
  folders:           [],
  tags:              [],
  activeNoteId:      null,
  activeFolderId:    'all',
  loading:           true,
  sidebarOpen:       false,   // ← start with home screen visible
  searchOpen:        false,
  settingsOpen:      false,
  folderModalOpen:   false,
  folderModalTarget: null,
  moveNoteOpen:      false,
  moveNoteTarget:    null,
  wsConnected:       false,
  collaborators:     [],
  sortKey:           'updatedAt',
  sortDir:           'desc',
  theme:             'system',
  settings:          DEFAULT_SETTINGS,
  error:             null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    case 'SET_LOADING':
      return { ...state, loading: action.loading };

    case 'SET_NOTES':
      return { ...state, notes: action.notes };

    case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes] };

    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) => n._id === action.note._id ? action.note : n),
      };

    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((n) => n._id !== action.id),
        activeNoteId: state.activeNoteId === action.id ? null : state.activeNoteId,
      };

    case 'SET_FOLDERS':
      return { ...state, folders: action.folders };

    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.folder] };

    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map((f) => f._id === action.folder._id ? action.folder : f),
      };

    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter((f) => f._id !== action.id),
        activeFolderId: state.activeFolderId === action.id ? 'all' : state.activeFolderId,
      };

    case 'SET_TAGS':
      return { ...state, tags: action.tags };

    case 'SET_ACTIVE_NOTE':
      return { ...state, activeNoteId: action.id };

    case 'SET_ACTIVE_FOLDER':
      return { ...state, activeFolderId: action.id, activeNoteId: null };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open };

    case 'SET_SEARCH_OPEN':
      return { ...state, searchOpen: action.open };

    case 'SET_SETTINGS_OPEN':
      return { ...state, settingsOpen: action.open };

    case 'SET_FOLDER_MODAL':
      return {
        ...state,
        folderModalOpen:   action.open,
        folderModalTarget: action.folder ?? null,
      };

    case 'SET_MOVE_NOTE':
      return {
        ...state,
        moveNoteOpen:   action.open,
        moveNoteTarget: action.noteId ?? null,
      };

    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.connected };

    case 'SET_COLLABORATORS':
      return { ...state, collaborators: action.collaborators };

    case 'ADD_COLLABORATOR':
      return {
        ...state,
        collaborators: state.collaborators.some((c) => c.userId === action.collaborator.userId)
          ? state.collaborators
          : [...state.collaborators, action.collaborator],
      };

    case 'REMOVE_COLLABORATOR':
      return {
        ...state,
        collaborators: state.collaborators.filter((c) => c.userId !== action.userId),
      };

    case 'SET_SORT':
      return { ...state, sortKey: action.key, sortDir: action.dir };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state:        AppState;
  dispatch:     React.Dispatch<Action>;
  activeNote:   Note | null;
  createNote:   (folderId?: string | null) => Promise<Note | null>;
  updateNote:   (id: string, patch: Partial<Note>) => Promise<void>;
  deleteNote:   (id: string) => Promise<void>;
  createFolder: (name: string, color: string, parentId?: string | null) => Promise<void>;
  updateFolder: (id: string, patch: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveNote:     (noteId: string, folderId: string | null) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  // ── Theme application ──────────────────────────────────────────────────────

  useEffect(() => {
    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.toggle('light', !dark);
    };

    if (state.theme === 'dark') {
      apply(true);
    } else if (state.theme === 'light') {
      apply(false);
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [state.theme]);

  // ── Accent color CSS variable ──────────────────────────────────────────────

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.settings.accentColor);
    // Derive lighter version for accent-bg
    document.documentElement.style.setProperty('--accent-raw', state.settings.accentColor);
  }, [state.settings.accentColor]);

  // ── Persist settings & theme ───────────────────────────────────────────────

  useEffect(() => {
    try {
      localStorage.setItem('cookie_settings', JSON.stringify(state.settings));
    } catch {}
  }, [state.settings]);

  useEffect(() => {
    try {
      localStorage.setItem('cookie_theme', state.theme);
    } catch {}
  }, [state.theme]);

  // ── Boot: load persisted prefs, then data ──────────────────────────────────

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Restore persisted settings
    try {
      const saved = localStorage.getItem('cookie_settings');
      if (saved) dispatch({ type: 'UPDATE_SETTINGS', settings: JSON.parse(saved) });
    } catch {}

    try {
      const theme = localStorage.getItem('cookie_theme') as Theme | null;
      if (theme) dispatch({ type: 'SET_THEME', theme });
    } catch {}

    // Load data
    loadData();
  }, []);

  // ── WebSocket listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const off1 = socket.on('connect',    () => dispatch({ type: 'SET_WS_CONNECTED', connected: true  }));
    const off2 = socket.on('disconnect', () => dispatch({ type: 'SET_WS_CONNECTED', connected: false }));
    const off3 = socket.on('user_joined', (c: Collaborator) => dispatch({ type: 'ADD_COLLABORATOR', collaborator: c }));
    const off4 = socket.on('user_left',  (msg: { userId: string }) => dispatch({ type: 'REMOVE_COLLABORATOR', userId: msg.userId }));
    return () => { off1(); off2(); off3(); off4(); };
  }, []);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const [notes, folders, tags] = await Promise.all([
        api.notes.list(),
        api.folders.list(),
        api.tags.list(),
      ]);
      dispatch({ type: 'SET_NOTES',   notes   });
      dispatch({ type: 'SET_FOLDERS', folders });
      dispatch({ type: 'SET_TAGS',    tags    });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  // ── Active note ────────────────────────────────────────────────────────────

  const activeNote = state.notes.find((n) => n._id === state.activeNoteId) ?? null;

  // ── CRUD: Notes ────────────────────────────────────────────────────────────

  const createNote = useCallback(async (folderId?: string | null): Promise<Note | null> => {
    try {
      const note = await api.notes.create({
        title:    '',
        content:  '',
        folderId: folderId ?? state.activeFolderId as string | null ?? null,
      });
      dispatch({ type: 'ADD_NOTE',        note });
      dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
      if (!state.sidebarOpen) dispatch({ type: 'SET_SIDEBAR', open: true });
      return note;
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to create note' });
      return null;
    }
  }, [state.activeFolderId, state.sidebarOpen]);

  const updateNote = useCallback(async (id: string, patch: Partial<Note>): Promise<void> => {
    try {
      const updated = await api.notes.update(id, patch);
      dispatch({ type: 'UPDATE_NOTE', note: updated });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to update note' });
    }
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'DELETE_NOTE', id });
    try {
      await api.notes.delete(id);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to delete note' });
      // reload to restore
      const notes = await api.notes.list().catch(() => []);
      dispatch({ type: 'SET_NOTES', notes });
    }
  }, []);

  // ── CRUD: Folders ──────────────────────────────────────────────────────────

  const createFolder = useCallback(async (
    name: string,
    color: string,
    parentId?: string | null,
  ): Promise<void> => {
    try {
      const folder = await api.folders.create({ name, color, parentId: parentId ?? null });
      dispatch({ type: 'ADD_FOLDER', folder });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to create folder' });
    }
  }, []);

  const updateFolder = useCallback(async (id: string, patch: Partial<Folder>): Promise<void> => {
    try {
      const updated = await api.folders.update(id, patch);
      dispatch({ type: 'UPDATE_FOLDER', folder: updated });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to update folder' });
    }
  }, []);

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    dispatch({ type: 'DELETE_FOLDER', id });
    try {
      await api.folders.delete(id);
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to delete folder' });
      const folders = await api.folders.list().catch(() => []);
      dispatch({ type: 'SET_FOLDERS', folders });
    }
  }, []);

  // ── Move note ──────────────────────────────────────────────────────────────

  const moveNote = useCallback(async (noteId: string, folderId: string | null): Promise<void> => {
    try {
      const updated = await api.notes.update(noteId, { folderId });
      dispatch({ type: 'UPDATE_NOTE', note: updated });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err?.message ?? 'Failed to move note' });
    }
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === '\\') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
      if (mod && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_SEARCH_OPEN', open: true });
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        dispatch({ type: 'SET_SETTINGS_OPEN', open: true });
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_SEARCH_OPEN',   open: false });
        dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
        dispatch({ type: 'SET_FOLDER_MODAL',  open: false });
        dispatch({ type: 'SET_MOVE_NOTE',     open: false });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    activeNote,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    updateFolder,
    deleteFolder,
    moveNote,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
