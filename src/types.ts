export interface Folder {
  _id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  isPinned: boolean;
  color: string | null;
  wordCount: number;
  charCount: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult extends Note {
  snippet: string;
}

export interface Collaborator {
  userId: string;
  userName: string;
  color: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface Stats {
  noteCount: number;
  folderCount: number;
  pinnedCount: number;
  totalWords: number;
  totalChars: number;
}

export type Theme = 'system' | 'light' | 'dark';
export type FontFamily = 'geist-sans' | 'geist-mono' | 'serif' | 'cursive';
export type SortKey = 'updatedAt' | 'createdAt' | 'title' | 'wordCount';
export type ViewMode = 'edit' | 'preview' | 'split';

export interface Settings {
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: number;
  spellCheck: boolean;
  autosaveDelay: number;
  defaultView: ViewMode;
  accentColor: string;
  showWordCount: boolean;
  showLineNumbers: boolean;
  tabSize: number;
  userName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 15,
  fontFamily: 'geist-sans',
  lineHeight: 1.7,
  spellCheck: true,
  autosaveDelay: 1500,
  defaultView: 'edit',
  accentColor: '#f59e0b',
  showWordCount: true,
  showLineNumbers: false,
  tabSize: 2,
  userName: 'Anonymous',
};

export type WsMessage =
  | { type: 'join_note'; noteId: string; userId: string; userName: string }
  | { type: 'leave_note' }
  | { type: 'note_update'; title: string; content: string; tags: string[] }
  | { type: 'cursor_update'; position: number }
  | { type: 'room_joined'; userId: string; color: string; users: Collaborator[] }
  | { type: 'user_joined'; user: Collaborator; users: Collaborator[] }
  | { type: 'user_left'; userId: string; users: Collaborator[] }
  | { type: 'note_update'; noteId: string; title: string; content: string; tags: string[]; userId: string }
  | { type: 'cursor_update'; userId: string; userName: string; color: string; position: number };
