import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Folder as FolderIcon, FolderOpen, FileText,
  ChevronRight, ChevronDown, Plus, Trash2, Edit2, FolderPlus,
  Move, Star, Layers, ArrowUpDown, Check, Download, MoreHorizontal, Pin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '../context/AppContext';
import { Folder, Note, SortKey } from '../types';
import { motion, AnimatePresence } from 'motion/react';

/* ── Pin SVG ── */
const PinIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);

const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Last edited' },
  { key: 'createdAt', label: 'Created' },
  { key: 'title',     label: 'Name A–Z' },
  { key: 'wordCount', label: 'Length' },
];

/* ── Download helpers ── */
function downloadNote(note: Note) {
  const text = `${note.title}\n${'─'.repeat(Math.min(note.title.length || 10, 40))}\n\n${note.content}`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${note.title || 'note'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Note kebab dropdown ── */
function NoteKebabMenu({
  note,
  onClose,
}: {
  note: Note;
  onClose: () => void;
}) {
  const { deleteNote, updateNote, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      className="dropdown-menu"
      style={{ position: 'absolute', right: 0, top: '100%', marginTop: 2, zIndex: 500 }}
      initial={{ opacity: 0, scale: 0.94, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="dropdown-item"
        onClick={() => {
          updateNote(note._id, { isPinned: !note.isPinned });
          onClose();
        }}
      >
        <PinIcon filled={note.isPinned} />
        {note.isPinned ? 'Unpin' : 'Pin note'}
      </button>

      <button
        className="dropdown-item"
        onClick={() => {
          dispatch({ type: 'SET_MOVE_NOTE', open: true, noteId: note._id });
          onClose();
        }}
      >
        <Move size={12} />
        Move to folder
      </button>

      <button
        className="dropdown-item"
        onClick={() => { downloadNote(note); onClose(); }}
      >
        <Download size={12} />
        Download .txt
      </button>

      <div className="dropdown-sep" />

      {confirmDelete ? (
        <button
          className="dropdown-item danger"
          onClick={() => { deleteNote(note._id); onClose(); }}
          style={{ fontWeight: 600 }}
        >
          <Check size={12} />
          Confirm delete
        </button>
      ) : (
        <button
          className="dropdown-item danger"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={12} />
          Delete note
        </button>
      )}
    </motion.div>
  );
}

/* ── Note card ── */
function NoteItem({ note }: { note: Note }) {
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = state.activeNoteId === note._id;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.kebab-zone')) return;
    dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
    if (window.innerWidth < 768) dispatch({ type: 'SET_SIDEBAR', open: false });
  }, [note._id, dispatch]);

  const timeAgo = useMemo(() => {
    try { return formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }); }
    catch { return ''; }
  }, [note.updatedAt]);

  const snippet = useMemo(() =>
    note.content
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_`\[\]()>~]/g, '')
      .slice(0, 72)
  , [note.content]);

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      style={{ position: 'relative' }}
    >
      {/* Color dot bar */}
      {note.color && (
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 2,
          background: note.color,
          borderRadius: 'var(--r-full)',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
          {note.isPinned && (
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}><PinIcon filled /></span>
          )}
          <span className="note-card-title">{note.title || 'Untitled Note'}</span>
        </div>

        {/* Kebab menu */}
        <div className="kebab-zone" style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="kebab-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            title="Note options"
          >
            <MoreHorizontal size={13} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <NoteKebabMenu
                note={note}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {snippet && <p className="note-card-snippet">{snippet}</p>}

      <div className="note-card-meta">
        <span className="note-card-time">{timeAgo}</span>
        {note.wordCount > 0 && (
          <span className="note-card-time">{note.wordCount}w</span>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="tag-pill" style={{ fontSize: 9, padding: '1px 5px' }}>{tag}</span>
        ))}
        {note.tags.length > 2 && (
          <span className="note-card-time">+{note.tags.length - 2}</span>
        )}
      </div>
    </div>
  );
}

/* ── Folder row ── */
function FolderRow({ folder, depth = 0 }: { folder: Folder; depth?: number }) {
  const { state, dispatch, deleteFolder } = useApp();
  const [open, setOpen] = useState(true);
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
    <div style={{ position: 'relative' }}>
      {/* Indent guide */}
      {depth > 0 && (
        <div style={{
          position: 'absolute',
          left: 10 + depth * 12 - 6,
          top: 0, bottom: 0,
          width: 1,
          background: 'var(--accents-2)',
          pointerEvents: 'none',
        }} />
      )}

      <div
        className={`folder-row ${isActive ? 'active' : ''} group`}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
        onClick={() => {
          dispatch({ type: 'SET_ACTIVE_FOLDER', id: folder._id });
          dispatch({ type: 'SET_ACTIVE_NOTE',   id: null });
          setOpen((v) => !v);
        }}
      >
        {/* Chevron */}
        <button
          className="icon-btn"
          style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          {children.length > 0
            ? (open ? <ChevronDown size={10} /> : <ChevronRight size={10} />)
            : <span style={{ width: 10 }} />
          }
        </button>

        {/* Icon */}
        <span style={{ color: folder.color, flexShrink: 0 }}>
          {isActive && open ? <FolderOpen size={13} /> : <FolderIcon size={13} />}
        </span>

        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
          {folder.name}
        </span>

        {/* Note count */}
        <span className="badge" style={{ opacity: 0, transition: 'opacity 0.1s' }}
          ref={(el) => { if (el) el.style.opacity = '1'; }}>
          {noteCount}
        </span>

        {/* Actions */}
        <div className="folder-actions" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {confirmDelete ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 600, marginRight: 2 }}>Del?</span>
                <button className="icon-btn danger" style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }} onClick={handleDelete}>
                  <Check size={9} />
                </button>
                <button className="icon-btn" style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/>
                  </svg>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <button
                  className="icon-btn"
                  style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: folder }); }}
                  title="Rename"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  className="icon-btn danger"
                  style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
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

      {/* Children */}
      <AnimatePresence>
        {open && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
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

/* ── Main Sidebar ── */
export function Sidebar() {
  const { state, dispatch, createNote } = useApp();
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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
    {
      id: 'all',
      icon: (
        <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      ),
      label: 'All Notes',
      count: state.notes.length,
    },
    {
      id: 'pinned',
      icon: <PinIcon filled={state.activeFolderId === 'pinned'} />,
      label: 'Pinned',
      count: pinnedCount,
    },
  ];

  return (
    <div className={`sidebar-panel ${state.sidebarOpen ? '' : 'collapsed'}`}>
      {/* Nav section */}
      <div style={{ padding: '8px 6px 2px' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${state.activeFolderId === item.id ? 'active' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_FOLDER', id: item.id as any });
              dispatch({ type: 'SET_ACTIVE_NOTE',   id: null });
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span className={`badge ${state.activeFolderId === item.id ? 'accent' : ''}`}>{item.count}</span>
          </button>
        ))}
      </div>

      {/* Tags row */}
      {state.tags.length > 0 && (
        <div style={{ padding: '4px 10px 6px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {state.tags.slice(0, 8).map((tag) => (
              <button
                key={tag.name}
                className="tag-pill"
                onClick={() => {}}
                style={{ cursor: 'pointer' }}
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M9 5.5L5.5 9a1 1 0 01-1.4 0L.5 5.4A1 1 0 01.5 4L4 .5a1 1 0 011.4 0L9 4a1 1 0 010 1.4z" stroke="currentColor" strokeWidth="1"/>
                  <circle cx="3" cy="3" r="0.6" fill="currentColor"/>
                </svg>
                {tag.name}
                <span style={{ opacity: 0.5, fontSize: 9, marginLeft: 1 }}>{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-sep" />

      {/* Folders section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">
            <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.38l1.5 2H12.5A1.5 1.5 0 0114 5.5v6A1.5 1.5 0 0112.5 13h-10A1.5 1.5 0 011 11.5v-8z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            Folders
          </span>
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}
            onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: true, target: null })}
            title="New folder"
          >
            <FolderPlus size={12} />
          </button>
        </div>

        <div style={{ padding: '0 4px 2px' }}>
          {rootFolders.length === 0 ? (
            <p style={{ fontSize: 11, padding: '6px 10px', color: 'var(--accents-4)', fontStyle: 'italic' }}>
              No folders yet
            </p>
          ) : (
            rootFolders.map((folder) => <FolderRow key={folder._id} folder={folder} />)
          )}
        </div>
      </div>

      <div className="sidebar-sep" />

      {/* Notes section header */}
      <div className="sidebar-section-header">
        <span className="sidebar-section-label">
          <svg width="10" height="10" viewBox="0 0 15 15" fill="none">
            <path d="M2 1.5A.5.5 0 012.5 1h8a.5.5 0 01.5.5v12a.5.5 0 01-.8.4L7.5 11.4l-2.7 2.5a.5.5 0 01-.8-.4v-12z" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
          Notes
          <span className="badge">{visibleNotes.length}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Sort */}
          <div style={{ position: 'relative' }} ref={sortRef}>
            <button
              className="icon-btn"
              style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}
              onClick={() => setSortOpen((v) => !v)}
              title="Sort notes"
            >
              <ArrowUpDown size={11} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                  <motion.div
                    className="dropdown-menu"
                    style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 500 }}
                    initial={{ opacity: 0, scale: 0.94, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.12 }}
                  >
                    {SORT_OPTS.map((opt) => (
                      <button
                        key={opt.key}
                        className={`dropdown-item ${state.sortKey === opt.key ? 'active' : ''}`}
                        style={state.sortKey === opt.key ? { color: 'var(--accent)', fontWeight: 600 } : {}}
                        onClick={() => {
                          dispatch({
                            type: 'SET_SORT',
                            key: opt.key,
                            dir: state.sortKey === opt.key && state.sortDir === 'desc' ? 'asc' : 'desc',
                          });
                          setSortOpen(false);
                        }}
                      >
                        {state.sortKey === opt.key ? (
                          <span style={{ fontSize: 10 }}>{state.sortDir === 'desc' ? '↓' : '↑'}</span>
                        ) : (
                          <span style={{ width: 14, display: 'inline-block' }} />
                        )}
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
            className="icon-btn"
            style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        {state.loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
            {[72, 60, 68, 56, 64].map((h, i) => (
              <div key={i} className="skeleton" style={{ height: h }} />
            ))}
          </div>
        ) : visibleNotes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accents-3)', marginBottom: 10 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--accents-5)' }}>No notes here</p>
            <p style={{ fontSize: 10, color: 'var(--accents-4)', marginTop: 3 }}>Create one to get started</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
              {visibleNotes.map((note, i) => (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.12) }}
                >
                  <NoteItem note={note} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer stats */}
      {!state.loading && (
        <div className="sidebar-footer">
          <span className="sidebar-footer-stat">
            {state.notes.length} notes · {state.folders.length} folders
          </span>
          <span className="sidebar-footer-stat">
            {state.notes.reduce((a, n) => a + (n.wordCount || 0), 0).toLocaleString()}w
          </span>
        </div>
      )}
    </div>
  );
}
