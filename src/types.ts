// ─── Primitives ───────────────────────────────────────────────────────────────

export type ViewMode   = 'edit' | 'preview';
export type Theme      = 'dark' | 'light' | 'system';
export type SortKey    = 'updatedAt' | 'createdAt' | 'title' | 'wordCount';
export type FontFamily = 'geist-sans' | 'geist-mono' | 'serif' | 'cursive';

// ─── Domain models ────────────────────────────────────────────────────────────

export interface Note {
  _id:        string;
  title:      string;
  content:    string;
  folderId:   string | null;
  tags:       string[];
  color:      string | null;
  isPinned:   boolean;
  wordCount:  number;
  createdAt:  string;
  updatedAt:  string;
}

export interface Folder {
  _id:      string;
  name:     string;
  color:    string;
  parentId: string | null;
  noteCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name:  string;
  count: number;
}

export interface Collaborator {
  userId:   string;
  userName: string;
  color:    string;
}

export interface SearchResult {
  _id:       string;
  title:     string;
  content:   string;
  snippet:   string;
  folderId:  string | null;
  tags:      string[];
  isPinned:  boolean;
  wordCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface Stats {
  noteCount:   number;
  folderCount: number;
  pinnedCount: number;
  totalWords:  number;
  totalChars:  number;
}

export interface WsMessage {
  type: string;
  [key: string]: any;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  fontSize:      number;
  lineHeight:    number;
  fontFamily:    FontFamily;
  tabSize:       number;
  spellCheck:    boolean;
  defaultView:   ViewMode;
  autosaveDelay: number;
  showWordCount: boolean;
  accentColor:   string;
}

export const DEFAULT_SETTINGS: Settings = {
  fontSize:      14,
  lineHeight:    1.7,
  fontFamily:    'geist-sans',
  tabSize:       2,
  spellCheck:    true,
  defaultView:   'edit',
  autosaveDelay: 1500,
  showWordCount: true,
  accentColor:   '#d97706',
};

// ─── API payloads ─────────────────────────────────────────────────────────────

export interface CreateNotePayload {
  title?:    string;
  content?:  string;
  folderId?: string | null;
  tags?:     string[];
  color?:    string | null;
}

export interface UpdateNotePayload {
  title?:     string;
  content?:   string;
  folderId?:  string | null;
  tags?:      string[];
  color?:     string | null;
  isPinned?:  boolean;
  wordCount?: number;
}

export interface CreateFolderPayload {
  name:      string;
  color:     string;
  parentId?: string | null;
}

export interface UpdateFolderPayload {
  name?:     string;
  color?:    string;
  parentId?: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  _id:         string;
  username:    string;
  displayName: string;
  createdAt:   string;
}

export interface AuthResponse {
  token: string;
  user:  User;
}
