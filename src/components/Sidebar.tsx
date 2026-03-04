import React, { useState, useCallback, useMemo } from 'react';
import {
  Folder as FolderIcon, FolderOpen, FileText, Pin, Hash,
  ChevronRight, ChevronDown, Plus, Trash2, Edit2, FolderPlus,
  Move, Star, Layers, ArrowUpDown, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Folder, Note, SortKey } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// ─── SVG Icons ───────────────────────────────────────────────
const PinIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);

const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Last edited' },
  { key: 'createdAt', label: 'Created' },
  { key: 'title',     label: 'A–Z' },
  { key: 'wordCount', label: 'Length' },
];

// ─── Note card with always-accessible actions ─────────────────
function NoteItem({ note }: { note: Note }) {
  const { state, dispatch, deleteNote, updateNote } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isActive = state.activeNoteId === note._id;

  const handleClick = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
    if (window.innerWidth < 768) dispatch({ type: 'SET_SIDEBAR', open: false });
  }, [note._id, dispatch]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await deleteNote(note._id);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note._id, { isPinned: !note.isPinned });
    setConfirmDelete(false);
  };

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_MOVE_NOTE', open: true, noteId: note._id });
    setConfirmDelete(false);
  };

  const timeAgo = useMemo(() => {
    try { return formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }); } catch { return ''; }
  }, [note.updatedAt]);

  const snippet = useMemo(() => {
    return note.content.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]()>]/g, '').slice(0, 68);
  }, [note.content]);

  // Cancel delete confirm on blur
  const handleBlur = useCallback(() => {
    setTimeout(() => setConfirmDelete(false), 200);
  }, []);

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''} group`}
      onClick={handleClick}
      onBlur={handleBlur}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {note.color && <div className="note-color-dot" style={{ background: note.color }} />}
          {note.isPinned && (
            <span style={{ color: 'var(--accent)' }} className="shrink-0"><PinIcon filled /></span>
          )}
          <span className="text-[13px] font-semibold truncate leading-tight">
            {note.title || 'Untitled Note'}
          </span>
        </div>

        {/* Action buttons - always visible on hover/active, not behind menu */}
        <div className="note-actions shrink-0">
          <AnimatePresence>
            {confirmDelete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--danger)' }}>Delete?</span>
                <button
                  className="icon-btn danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  title="Confirm delete"
                >
                  <Check size={11} />
                </button>
                <button
                  className="icon-btn"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                  title="Cancel"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`icon-btn ${note.isPinned ? 'active' : ''}`}
                  onClick={handlePin}
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                >
                  <PinIcon filled={note.isPinned} />
                </button>
                <button className="icon-btn" onClick={handleMove} title="Move to folder">
                  <Move size={11} />
                </button>
                <button className="icon-btn danger" onClick={handleDelete} title="Delete note">
                  <Trash2 size={11} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {snippet && (
        <p className="text-[11.5px] truncate mb-2 leading-relaxed" style={{ color: 'var(--accents-5)' }}>
          {snippet}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>{timeAgo}</span>
        {note.wordCount > 0 && (
          <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>{note.wordCount}w</span>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag-pill text-[10px] py-0">{tag}</span>
        ))}
        {note.tags.length > 2 && (
          <span className="text-[10px]" style={{ color: 'var(--accents-4)' }}>+{note.tags.length - 2}</span>
        )}
      </div>
    </div>
  );
}

// ─── Folder row ───────────────────────────────────────────────
function FolderRow({ folder, depth = 0 }: { folder: Folder; depth?: number }) {
  const { state, dispatch, createNote, deleteFolder } = useApp();
  const [open, setOpen]               = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isActive  = state.activeFolderId === folder._id;
  const children  = state.folders.filter((f) => f.parentId === folder._id);
  const noteCount = state.notes.filter((n) => n.folderId === folder._id).length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteFolder(folder._id);
  };

  return (
    <div>
      <div
        className={`folder-row ${isActive ? 'active' : ''} group`}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
        onClick={() => {
          dispatch({ type: 'SET_ACTIVE_FOLDER', id: folder._id });
          dispatch({ type: 'SET_ACTIVE_NOTE', id: null });
          setOpen((v) => !v);
        }}
      >
        <button
          className="icon-btn w-5 h-5"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          {children.length > 0
            ? (open
                ? <ChevronDown size={11} />
                : <ChevronRight size={11} />)
            : <span className="w-2.5" />
          }
        </button>

        <span className="shrink-0" style={{ color: folder.color }}>
          {isActive && open
            ? <FolderOpen size={14} />
            : <FolderIcon size={14} />
          }
        </span>

        <span className="flex-1 truncate text-[12.5px]">{folder.name}</span>

        <span className="badge text-[9px] opacity-0 group-hover:opacity-100 transition-opacity mr-1">
          {noteCount}
        </span>

        {/* Folder actions */}
        <div className="folder-actions" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {confirmDelete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-0.5"
              >
                <span className="text-[9px] font-medium" style={{ color: 'var(--danger)' }}>Del?</span>
                <button className="icon-btn danger w-5 h-5" onClick={handleDelete}>
                  <Check size={9} />
                </button>
                <button className="icon-btn w-5 h-5" onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
                </button>
              </motion.div>
            ) : (
              <motion.div className="flex items-center gap-0.5">
                <button
                  className="icon-btn w-5 h-5"
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: folder }); }}
                  title="Rename"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  className="icon-btn danger w-5 h-5"
                  onClick={handleDelete}
                  title="Delete folder"
                >
                  <Trash2 size={10} />
                </button>
              </motion.div>
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
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
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

  const visibleNotes = useMemo(() => {
    let notes = state.notes;
    if (state.activeFolderId === 'pinned') notes = notes.filter((n) => n.isPinned);
    else if (state.activeFolderId !== 'all' && state.activeFolderId) {
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
    { id: 'all',    icon: <Layers size={14} />,  label: 'All Notes', count: state.notes.length },
    { id: 'pinned', icon: <Star  size={14} />,   label: 'Pinned',    count: pinnedCount },
  ];

  return (
    <div className={`sidebar-panel ${state.sidebarOpen ? '' : 'collapsed'}`}>
      {/* Nav items */}
      <div className="p-2 pb-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-pill ${state.activeFolderId === item.id ? 'active' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_FOLDER', id: item.id as any });
              dispatch({ type: 'SET_ACTIVE_NOTE', id: null });
            }}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            <span className="badge">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Tags */}
      {state.tags.length > 0 && (
        <div className="px-3 py-2">
          <div className="sidebar-section-label mb-1.5">
            <Hash size={10} /> Tags
          </div>
          <div className="flex flex-wrap gap-1">
            {state.tags.slice(0, 6).map((tag) => (
              <button key={tag.name} className="tag-pill hover:opacity-75 transition-opacity text-[10px]">
                {tag.name}
                <span style={{ opacity: 0.6, marginLeft: 2, fontSize: 9 }}>{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'var(--accents-2)', margin: '4px 0' }} />

      {/* Folders */}
      <div>
        <div className="sidebar-section-header">
          <span className="sidebar-section-label"><FolderIcon size={10} /> Folders</span>
          <button
            className="icon-btn w-5 h-5"
            onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: null })}
            title="New folder"
          >
            <FolderPlus size={12} />
          </button>
        </div>
        <div className="px-1 pb-1">
          {rootFolders.length === 0 ? (
            <p className="text-[11px] px-3 py-2 italic" style={{ color: 'var(--accents-4)' }}>No folders yet</p>
          ) : (
            rootFolders.map((folder) => <FolderRow key={folder._id} folder={folder} />)
          )}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--accents-2)' }} />

      {/* Notes header */}
      <div className="sidebar-section-header">
        <span className="sidebar-section-label">
          <FileText size={10} /> Notes
          <span className="badge ml-1">{visibleNotes.length}</span>
        </span>
        <div className="flex items-center gap-0.5">
          {/* Sort */}
          <div className="relative">
            <button className="icon-btn w-5 h-5" onClick={() => setSortOpen((v) => !v)} title="Sort">
              <ArrowUpDown size={11} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.13 }}
                    className="account-menu"
                    style={{ minWidth: 140 }}
                  >
                    {SORT_OPTS.map((opt) => (
                      <button
                        key={opt.key}
                        className={`account-menu-item text-xs ${state.sortKey === opt.key ? 'font-semibold' : ''}`}
                        style={state.sortKey === opt.key ? { color: 'var(--accent)' } : {}}
                        onClick={() => {
                          dispatch({
                            type: 'SET_SORT',
                            key: opt.key,
                            dir: state.sortKey === opt.key && state.sortDir === 'desc' ? 'asc' : 'desc',
                          });
                          setSortOpen(false);
                        }}
                      >
                        {state.sortKey === opt.key
                          ? <span>{state.sortDir === 'desc' ? '↓' : '↑'}</span>
                          : <span className="w-3" />
                        }
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            className="icon-btn w-5 h-5"
            onClick={() => {
              const folderId =
                typeof state.activeFolderId === 'string' &&
                state.activeFolderId !== 'all' &&
                state.activeFolderId !== 'pinned'
                  ? state.activeFolderId : null;
              createNote(folderId);
            }}
            title="New note"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 pb-16 md:pb-2">
        {state.loading ? (
          <>
            {[80, 64, 72, 56, 68].map((h, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
            ))}
          </>
        ) : visibleNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3" style={{ color: 'var(--accents-3)' }}>
              <FileText size={32} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--accents-5)' }}>No notes here</p>
            <p className="text-xs mt-1" style={{ color: 'var(--accents-4)' }}>Create one to get started</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleNotes.map((note, i) => (
              <motion.div
                key={note._id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.025, 0.15) }}
              >
                <NoteItem note={note} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Stats footer */}
      {!state.loading && (
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderTop: '1px solid var(--accents-2)' }}
        >
          <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
            {state.notes.length} notes · {state.folders.length} folders
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
            {state.notes.reduce((a, n) => a + (n.wordCount || 0), 0).toLocaleString()}w
          </span>
        </div>
      )}
    </div>
  );
}
