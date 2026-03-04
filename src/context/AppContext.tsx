import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { Collaborator, DEFAULT_SETTINGS, Folder, Note, Settings, SortKey, Tag, Theme } from '../types';

// ─── State ────────────────────────────────────────────────

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
  theme:               Theme;
  settings:            Settings;
  collaborators:       Collaborator[];
  myColor:             string;
  wsConnected:         boolean;
  sortKey:             SortKey;
  sortDir:             'asc' | 'desc';
}

type Action =
  | { type: 'SET_NOTES'; notes: Note[] }
  | { type: 'SET_FOLDERS'; folders: Folder[] }
  | { type: 'SET_TAGS'; tags: Tag[] }
  | { type: 'ADD_NOTE'; note: Note }
  | { type: 'UPDATE_NOTE'; note: Note }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'ADD_FOLDER'; folder: Folder }
  | { type: 'UPDATE_FOLDER'; folder: Folder }
  | { type: 'DELETE_FOLDER'; id: string }
  | { type: 'SET_ACTIVE_NOTE'; id: string | null }
  | { type: 'SET_ACTIVE_FOLDER'; id: string | null | 'all' | 'pinned' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; open: boolean }
  | { type: 'SET_SEARCH_OPEN'; open: boolean }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_FOLDER_MODAL'; open: boolean; target?: Folder | null }
  | { type: 'SET_MOVE_NOTE'; open: boolean; noteId?: string | null }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_COLLABORATORS'; collaborators: Collaborator[] }
  | { type: 'SET_MY_COLOR'; color: string }
  | { type: 'SET_WS_CONNECTED'; connected: boolean }
  | { type: 'SET_SORT'; key: SortKey; dir: 'asc' | 'desc' };

const loadSettings = (): Settings => {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('cookie_settings') || '{}') }; }
  catch { return DEFAULT_SETTINGS; }
};

const initialState: AppState = {
  notes:             [],
  folders:           [],
  tags:              [],
  activeNoteId:      null,
  activeFolderId:    'all',
  loading:           true,
  sidebarOpen:       true,
  searchOpen:        false,
  settingsOpen:      false,
  folderModalOpen:   false,
  folderModalTarget: null,
  moveNoteOpen:      false,
  moveNoteTarget:    null,
  theme:             (localStorage.getItem('cookie_theme') as Theme) || 'dark',
  settings:          loadSettings(),
  collaborators:     [],
  myColor:           '#f59e0b',
  wsConnected:       false,
  sortKey:           'updatedAt',
  sortDir:           'desc',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_NOTES':    return { ...state, notes: action.notes };
    case 'SET_FOLDERS':  return { ...state, folders: action.folders };
    case 'SET_TAGS':     return { ...state, tags: action.tags };
    case 'ADD_NOTE':     return { ...state, notes: [action.note, ...state.notes] };
    case 'UPDATE_NOTE':  return { ...state, notes: state.notes.map((n) => n._id === action.note._id ? action.note : n) };
    case 'DELETE_NOTE':  return { ...state, notes: state.notes.filter((n) => n._id !== action.id), activeNoteId: state.activeNoteId === action.id ? null : state.activeNoteId };
    case 'ADD_FOLDER':   return { ...state, folders: [...state.folders, action.folder] };
    case 'UPDATE_FOLDER':return { ...state, folders: state.folders.map((f) => f._id === action.folder._id ? action.folder : f) };
    case 'DELETE_FOLDER':return { ...state, folders: state.folders.filter((f) => f._id !== action.id), activeFolderId: state.activeFolderId === action.id ? 'all' : state.activeFolderId };
    case 'SET_ACTIVE_NOTE':   return { ...state, activeNoteId: action.id };
    case 'SET_ACTIVE_FOLDER': return { ...state, activeFolderId: action.id };
    case 'SET_LOADING':       return { ...state, loading: action.loading };
    case 'TOGGLE_SIDEBAR':    return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SIDEBAR':       return { ...state, sidebarOpen: action.open };
    case 'SET_SEARCH_OPEN':   return { ...state, searchOpen: action.open };
    case 'SET_SETTINGS_OPEN': return { ...state, settingsOpen: action.open };
    case 'SET_FOLDER_MODAL':  return { ...state, folderModalOpen: action.open, folderModalTarget: action.target ?? null };
    case 'SET_MOVE_NOTE':     return { ...state, moveNoteOpen: action.open, moveNoteTarget: action.noteId ?? null };
    case 'SET_THEME':         return { ...state, theme: action.theme };
    case 'UPDATE_SETTINGS':   return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'SET_COLLABORATORS': return { ...state, collaborators: action.collaborators };
    case 'SET_MY_COLOR':      return { ...state, myColor: action.color };
    case 'SET_WS_CONNECTED':  return { ...state, wsConnected: action.connected };
    case 'SET_SORT':          return { ...state, sortKey: action.key, sortDir: action.dir };
    default: return state;
  }
}

// ─── Context ──────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createNote: (folderId?: string | null) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  createFolder: (name: string, color?: string, parentId?: string | null) => Promise<Folder>;
  updateFolder: (id: string, data: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveNote: (noteId: string, folderId: string | null) => Promise<void>;
  refreshNotes: () => Promise<void>;
  refreshAll: () => Promise<void>;
  activeNote: Note | null;
}

const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);

// ─── Provider ─────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    const resolved = state.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : state.theme;
    root.classList.add(resolved);
    localStorage.setItem('cookie_theme', state.theme);
  }, [state.theme]);

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', state.settings.accentColor);
    localStorage.setItem('cookie_settings', JSON.stringify(state.settings));
    socket.setUserName(state.settings.userName);
  }, [state.settings]);

  // WebSocket setup
  useEffect(() => {
    socket.connect();
    const offConn = socket.on('connected',    () => dispatch({ type: 'SET_WS_CONNECTED', connected: true  }));
    const offDisc = socket.on('disconnected', () => dispatch({ type: 'SET_WS_CONNECTED', connected: false }));
    const offJoin = socket.on('room_joined',  (msg) => {
      dispatch({ type: 'SET_COLLABORATORS', collaborators: msg.users || [] });
      dispatch({ type: 'SET_MY_COLOR', color: msg.color });
    });
    const offIn   = socket.on('user_joined',  (msg) => dispatch({ type: 'SET_COLLABORATORS', collaborators: msg.users || [] }));
    const offOut  = socket.on('user_left',    (msg) => dispatch({ type: 'SET_COLLABORATORS', collaborators: msg.users || [] }));
    const offUpd  = socket.on('note_update',  (msg) => {
      dispatch({ type: 'UPDATE_NOTE', note: {
        ...stateRef.current.notes.find((n) => n._id === msg.noteId)!,
        title:   msg.title,
        content: msg.content,
        tags:    msg.tags,
      }});
    });
    return () => {
      [offConn, offDisc, offJoin, offIn, offOut, offUpd].forEach((off) => off());
      socket.disconnect();
    };
  }, []);

  // Initial load
  const refreshAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const [notes, folders, tags] = await Promise.all([
        api.notes.listAll(),
        api.folders.list(),
        api.tags(),
      ]);
      dispatch({ type: 'SET_NOTES',   notes   });
      dispatch({ type: 'SET_FOLDERS', folders });
      dispatch({ type: 'SET_TAGS',    tags    });
    } catch (e) { console.error(e); }
    finally { dispatch({ type: 'SET_LOADING', loading: false }); }
  }, []);

  const refreshNotes = useCallback(async () => {
    const notes = await api.notes.listAll();
    dispatch({ type: 'SET_NOTES', notes });
    const tags = await api.tags();
    dispatch({ type: 'SET_TAGS', tags });
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // CRUD helpers
  const createNote = useCallback(async (folderId: string | null = null) => {
    const note = await api.notes.create({ title: 'Untitled Note', content: '', folderId, tags: [] });
    dispatch({ type: 'ADD_NOTE', note });
    dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
    return note;
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await api.notes.delete(id);
    dispatch({ type: 'DELETE_NOTE', id });
  }, []);

  const updateNote = useCallback(async (id: string, data: Partial<Note>) => {
    const updated = await api.notes.update(id, data);
    dispatch({ type: 'UPDATE_NOTE', note: updated });
  }, []);

  const createFolder = useCallback(async (name: string, color = '#f59e0b', parentId: string | null = null) => {
    const folder = await api.folders.create({ name, color, parentId });
    dispatch({ type: 'ADD_FOLDER', folder });
    return folder;
  }, []);

  const updateFolder = useCallback(async (id: string, data: Partial<Folder>) => {
    const folder = await api.folders.update(id, data);
    dispatch({ type: 'UPDATE_FOLDER', folder });
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await api.folders.delete(id);
    dispatch({ type: 'DELETE_FOLDER', id });
    await refreshNotes(); // Notes may have been moved
  }, [refreshNotes]);

  const moveNote = useCallback(async (noteId: string, folderId: string | null) => {
    const note = await api.notes.move(noteId, folderId);
    dispatch({ type: 'UPDATE_NOTE', note });
  }, []);

  const activeNote = state.notes.find((n) => n._id === state.activeNoteId) ?? null;

  return (
    <AppContext.Provider value={{
      state, dispatch,
      createNote, deleteNote, updateNote,
      createFolder, updateFolder, deleteFolder,
      moveNote, refreshNotes, refreshAll,
      activeNote,
    }}>
      {children}
    </AppContext.Provider>
  );
}
