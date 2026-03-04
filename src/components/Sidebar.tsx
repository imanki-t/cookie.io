import React, { useState, useCallback, useMemo } from 'react';
import {
  Folder as FolderIcon, FolderOpen, FileText, Pin, Hash,
  ChevronRight, ChevronDown, Plus, MoreHorizontal,
  Trash2, Edit2, FolderPlus, Move, Star, Layers, Archive,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Folder, Note, SortKey } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// ─── Sort key selector ──────────────────────────────────────
const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Last edited' },
  { key: 'createdAt', label: 'Date created' },
  { key: 'title',     label: 'Title A–Z' },
  { key: 'wordCount', label: 'Word count' },
];

// ─── Note Context Menu ──────────────────────────────────────
function NoteMenu({ note, onClose }: { note: Note; onClose: () => void }) {
  const { deleteNote, dispatch, updateNote } = useApp();
  const opts = [
    {
      icon: <Pin className="h-3.5 w-3.5" />,
      label: note.isPinned ? 'Unpin' : 'Pin note',
      action: () => { updateNote(note._id, { isPinned: !note.isPinned }); onClose(); },
    },
    {
      icon: <Move className="h-3.5 w-3.5" />,
      label: 'Move to folder',
      action: () => { dispatch({ type: 'SET_MOVE_NOTE', open: true, noteId: note._id }); onClose(); },
    },
    { separator: true },
    {
      icon: <Trash2 className="h-3.5 w-3.5 text-red-400" />,
      label: <span className="text-red-400">Delete note</span>,
      action: async () => { await deleteNote(note._id); onClose(); },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-accents-2 bg-background py-1 shadow-2xl shadow-black/20"
      onClick={(e) => e.stopPropagation()}
    >
      {opts.map((opt, i) =>
        (opt as any).separator ? (
          <div key={i} className="my-1 border-t border-accents-2" />
        ) : (
          <button
            key={i}
            onClick={opt.action}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accents-1 transition-colors"
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// ─── Folder Context Menu ─────────────────────────────────────
function FolderMenu({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const { deleteFolder, dispatch } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ duration: 0.12 }}
      className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-accents-2 bg-background py-1 shadow-2xl shadow-black/20"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => { dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: folder }); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accents-1 transition-colors"
      >
        <Edit2 className="h-3.5 w-3.5" /> Rename folder
      </button>
      <div className="my-1 border-t border-accents-2" />
      <button
        onClick={async () => { await deleteFolder(folder._id); onClose(); }}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accents-1 text-red-400 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete folder
      </button>
    </motion.div>
  );
}

// ─── Note Item ───────────────────────────────────────────────
function NoteItem({ note }: { note: Note }) {
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = state.activeNoteId === note._id;

  const handleClick = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
    if (window.innerWidth < 768) dispatch({ type: 'SET_SIDEBAR', open: false });
  }, [note._id, dispatch]);

  const timeAgo = useMemo(() => {
    try { return formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }); }
    catch { return ''; }
  }, [note.updatedAt]);

  const snippet = useMemo(() => {
    const text = note.content.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]()>]/g, '');
    return text.slice(0, 72);
  }, [note.content]);

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''} group`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {note.color && <div className="note-color-dot" style={{ background: note.color }} />}
          {note.isPinned && <Pin className="h-3 w-3 text-accent shrink-0" style={{ color: 'var(--accent)' }} />}
          <span className="text-sm font-semibold truncate">
            {note.title || 'Untitled Note'}
          </span>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="toolbar-btn w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <NoteMenu note={note} onClose={() => setMenuOpen(false)} />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {snippet && (
        <p className="text-xs text-accents-5 truncate mb-2 leading-relaxed">{snippet}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-accents-4 font-mono">{timeAgo}</span>
        {note.wordCount > 0 && (
          <span className="text-[10px] text-accents-4">{note.wordCount}w</span>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag-pill text-[10px] py-0">{tag}</span>
        ))}
        {note.tags.length > 2 && (
          <span className="text-[10px] text-accents-4">+{note.tags.length - 2}</span>
        )}
      </div>
    </div>
  );
}

// ─── Folder Item ──────────────────────────────────────────────
function FolderRow({ folder, depth = 0 }: { folder: Folder; depth?: number }) {
  const { state, dispatch, createNote } = useApp();
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = state.activeFolderId === folder._id;
  const children  = state.folders.filter((f) => f.parentId === folder._id);
  const noteCount = state.notes.filter((n) => n.folderId === folder._id).length;

  return (
    <div>
      <div
        className={`folder-item ${isActive ? 'active' : ''} group`}
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onClick={() => {
          dispatch({ type: 'SET_ACTIVE_FOLDER', id: folder._id });
          dispatch({ type: 'SET_ACTIVE_NOTE', id: null });
          setOpen((v) => !v);
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          className="flex items-center justify-center w-4 h-4 shrink-0"
        >
          {children.length > 0
            ? (open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
            : <span className="w-3" />
          }
        </button>

        <div className="h-4 w-4 shrink-0 flex items-center justify-center" style={{ color: folder.color }}>
          {isActive && open ? <FolderOpen className="h-4 w-4" /> : <FolderIcon className="h-4 w-4" />}
        </div>

        <span className="flex-1 truncate">{folder.name}</span>

        <span className="text-[10px] text-accents-4 font-mono mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {noteCount}
        </span>

        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="toolbar-btn w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <FolderMenu folder={folder} onClose={() => setMenuOpen(false)} />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {open && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children.map((child) => (
              <FolderRow key={child._id} folder={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────
export function Sidebar() {
  const { state, dispatch, createNote } = useApp();
  const [sortOpen, setSortOpen] = useState(false);

  const rootFolders = state.folders.filter((f) => !f.parentId);

  // Filter + sort notes
  const visibleNotes = useMemo(() => {
    let notes = state.notes;
    if (state.activeFolderId === 'pinned') {
      notes = notes.filter((n) => n.isPinned);
    } else if (state.activeFolderId === 'all') {
      // all notes
    } else if (state.activeFolderId) {
      notes = notes.filter((n) => n.folderId === state.activeFolderId);
    }

    return [...notes].sort((a, b) => {
      const dir = state.sortDir === 'asc' ? 1 : -1;
      switch (state.sortKey) {
        case 'title':     return dir * a.title.localeCompare(b.title);
        case 'wordCount': return dir * (a.wordCount - b.wordCount);
        case 'createdAt': return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:          return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      }
    });
  }, [state.notes, state.activeFolderId, state.sortKey, state.sortDir]);

  const pinnedCount = state.notes.filter((n) => n.isPinned).length;

  const navItems = [
    { id: 'all',    icon: <Layers className="h-4 w-4" />,  label: 'All Notes',  count: state.notes.length },
    { id: 'pinned', icon: <Star className="h-4 w-4" />,    label: 'Pinned',     count: pinnedCount },
  ];

  return (
    <div className={`sidebar-inner ${state.sidebarOpen ? '' : 'collapsed'}`}>
      {/* Top section */}
      <div className="p-3 border-b border-accents-2">
        {/* Nav items */}
        <div className="space-y-0.5 mb-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_FOLDER', id: item.id as any });
                dispatch({ type: 'SET_ACTIVE_NOTE', id: null });
              }}
              className={`folder-item w-full ${state.activeFolderId === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-[10px] font-mono text-accents-4">{item.count}</span>
            </button>
          ))}
        </div>

        {/* Tags */}
        {state.tags.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-2 mb-1.5">
              <Hash className="h-3 w-3 text-accents-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accents-4">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {state.tags.slice(0, 8).map((tag) => (
                <button
                  key={tag.name}
                  className="tag-pill hover:opacity-80 transition-opacity"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_FOLDER', id: null as any })}
                >
                  {tag.name}
                  <span className="text-[9px] opacity-70 ml-0.5">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Folders */}
      <div className="border-b border-accents-2">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5">
            <FolderIcon className="h-3.5 w-3.5 text-accents-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accents-4">Folders</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: null })}
              className="toolbar-btn w-6 h-6"
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="px-1 pb-1">
          {rootFolders.length === 0 ? (
            <p className="text-xs text-accents-4 px-3 py-2 italic">No folders yet</p>
          ) : (
            rootFolders.map((folder) => <FolderRow key={folder._id} folder={folder} />)
          )}
        </div>
      </div>

      {/* Notes list header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-accents-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-accents-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accents-4">
            Notes
            <span className="ml-1 font-mono">({visibleNotes.length})</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="toolbar-btn w-6 h-6"
              title="Sort"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h6M14 16h3" />
              </svg>
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93 }}
                    className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-accents-2 bg-background py-1 shadow-xl"
                  >
                    {SORT_OPTS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          dispatch({ type: 'SET_SORT', key: opt.key, dir: state.sortKey === opt.key && state.sortDir === 'desc' ? 'asc' : 'desc' });
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accents-1 ${state.sortKey === opt.key ? 'text-accent font-semibold' : 'text-accents-5'}`}
                        style={state.sortKey === opt.key ? { color: 'var(--accent)' } : {}}
                      >
                        {state.sortKey === opt.key && (
                          <span>{state.sortDir === 'desc' ? '↓' : '↑'}</span>
                        )}
                        {state.sortKey !== opt.key && <span className="w-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* New note */}
          <button
            onClick={() => {
              const folderId = typeof state.activeFolderId === 'string' && state.activeFolderId !== 'all' && state.activeFolderId !== 'pinned'
                ? state.activeFolderId : null;
              createNote(folderId);
            }}
            className="toolbar-btn w-6 h-6"
            title="New note"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {state.loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl skeleton-shimmer" />
          ))
        ) : visibleNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-8 w-8 text-accents-3 mb-3" />
            <p className="text-sm text-accents-5 font-medium">No notes here</p>
            <p className="text-xs text-accents-4 mt-1">Create a new note to get started</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleNotes.map((note, i) => (
              <motion.div
                key={note._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <NoteItem note={note} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom stats */}
      {!state.loading && (
        <div className="border-t border-accents-2 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-accents-4 font-mono">
            {state.notes.length} notes · {state.folders.length} folders
          </span>
          <span className="text-[10px] text-accents-4 font-mono">
            {state.notes.reduce((a, n) => a + (n.wordCount || 0), 0).toLocaleString()} words
          </span>
        </div>
      )}
    </div>
  );
}
