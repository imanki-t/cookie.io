import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pin, Folder, FolderPlus, MoreHorizontal, Trash2,
  Edit2, Move, ChevronRight, ChevronDown, Tag,
  SortAsc, SortDesc, FileText, Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Note, SortKey } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noteSnippet(content: string): string {
  return content
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`\[\]()>~]/g, '')
    .trim()
    .slice(0, 80);
}

// ─── Note row kebab menu ──────────────────────────────────────────────────────

interface NoteMenuProps {
  noteId:   string;
  isPinned: boolean;
  onClose:  () => void;
}

function NoteMenu({ noteId, isPinned, onClose }: NoteMenuProps) {
  const { updateNote, deleteNote, dispatch } = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      className="note-ctx-menu"
      initial={{ opacity: 0, scale: 0.94, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.1 }}
    >
      <button
        className="ctx-item"
        onClick={() => { updateNote(noteId, { isPinned: !isPinned }); onClose(); }}
      >
        <Pin size={12} />
        {isPinned ? 'Unpin' : 'Pin to top'}
      </button>
      <button
        className="ctx-item"
        onClick={() => {
          dispatch({ type: 'SET_MOVE_NOTE', open: true, noteId });
          onClose();
        }}
      >
        <Move size={12} />
        Move to folder
      </button>
      <div className="ctx-sep" />
      <button
        className="ctx-item danger"
        onClick={() => { deleteNote(noteId); onClose(); }}
      >
        <Trash2 size={12} />
        Delete note
      </button>
    </motion.div>
  );
}

// ─── Single note row ──────────────────────────────────────────────────────────

function NoteRow({ note }: { note: Note }) {
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = state.activeNoteId === note._id;

  const handleSelect = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id });
  }, [note._id, dispatch]);

  return (
    <div
      className={`note-row ${isActive ? 'active' : ''}`}
      style={note.color ? { borderLeft: `3px solid ${note.color}` } : {}}
    >
      <button className="note-row-body" onClick={handleSelect}>
        <div className="note-row-title-line">
          {note.isPinned && <Pin size={9} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
          <span className="note-row-title">{note.title || 'Untitled Note'}</span>
        </div>
        {note.content && (
          <p className="note-row-snippet">{noteSnippet(note.content)}</p>
        )}
        <div className="note-row-meta">
          <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
          {note.wordCount > 0 && <span>{note.wordCount}w</span>}
        </div>
      </button>

      <div style={{ position: 'relative', flexShrink: 0, alignSelf: 'center' }}>
        <button
          className="kebab-btn"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          aria-label="Note options"
        >
          <MoreHorizontal size={13} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <NoteMenu
              noteId={note._id}
              isPinned={note.isPinned}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Folder row ───────────────────────────────────────────────────────────────

function FolderRow({ folderId }: { folderId: string }) {
  const { state, dispatch, deleteFolder } = useApp();
  const [expanded,  setExpanded]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const folder = state.folders.find((f) => f._id === folderId);
  if (!folder) return null;

  const folderNotes = state.notes.filter((n) => n.folderId === folderId);
  const isActive    = state.activeFolderId === folderId;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="folder-group">
      <div className={`folder-row ${isActive ? 'active' : ''}`}>
        <button
          className="folder-row-expand"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded
            ? <ChevronDown size={11} />
            : <ChevronRight size={11} />
          }
        </button>

        <button
          className="folder-row-body"
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_FOLDER', id: folderId });
            setExpanded(true);
          }}
        >
          <Folder size={13} style={{ color: folder.color, flexShrink: 0 }} />
          <span className="folder-row-name">{folder.name}</span>
          {folderNotes.length > 0 && (
            <span className="folder-count">{folderNotes.length}</span>
          )}
        </button>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="kebab-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            aria-label="Folder options"
          >
            <MoreHorizontal size={13} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={menuRef}
                className="note-ctx-menu"
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.1 }}
              >
                <button
                  className="ctx-item"
                  onClick={() => {
                    dispatch({ type: 'SET_FOLDER_MODAL', open: true, folder });
                    setMenuOpen(false);
                  }}
                >
                  <Edit2 size={12} />
                  Rename folder
                </button>
                <div className="ctx-sep" />
                <button
                  className="ctx-item danger"
                  onClick={() => { deleteFolder(folderId); setMenuOpen(false); }}
                >
                  <Trash2 size={12} />
                  Delete folder
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {expanded && folderNotes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden', paddingLeft: 14 }}
          >
            {folderNotes.map((note) => (
              <NoteRow key={note._id} note={note} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sort bar ─────────────────────────────────────────────────────────────────

const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt',  label: 'Modified' },
  { key: 'createdAt',  label: 'Created'  },
  { key: 'title',      label: 'Title'    },
  { key: 'wordCount',  label: 'Words'    },
];

function SortBar() {
  const { state, dispatch } = useApp();
  const { sortKey, sortDir } = state;

  const toggle = (key: SortKey) => {
    if (key === sortKey) {
      dispatch({ type: 'SET_SORT', key, dir: sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      dispatch({ type: 'SET_SORT', key, dir: 'desc' });
    }
  };

  return (
    <div className="sort-bar">
      {SORT_OPTS.map((o) => (
        <button
          key={o.key}
          className={`sort-btn ${sortKey === o.key ? 'active' : ''}`}
          onClick={() => toggle(o.key)}
        >
          {o.label}
          {sortKey === o.key && (
            sortDir === 'desc'
              ? <SortDesc size={9} />
              : <SortAsc  size={9} />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const { state, dispatch, createNote } = useApp();
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { notes, folders, activeFolderId, sortKey, sortDir, sidebarOpen } = state;

  const visibleNotes = React.useMemo(() => {
    let list = [...notes];

    if (activeFolderId === 'pinned') {
      list = list.filter((n) => n.isPinned);
    } else if (activeFolderId === 'all') {
      // all notes
    } else if (activeFolderId) {
      list = list.filter((n) => n.folderId === activeFolderId);
    } else {
      list = list.filter((n) => n.folderId === null);
    }

    if (tagFilter) {
      list = list.filter((n) => n.tags.includes(tagFilter));
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':     cmp = a.title.localeCompare(b.title); break;
        case 'wordCount': cmp = a.wordCount - b.wordCount;      break;
        case 'createdAt': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        default:          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    if (activeFolderId !== 'pinned') {
      list.sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
    }

    return list;
  }, [notes, activeFolderId, tagFilter, sortKey, sortDir]);

  const rootFolders  = folders.filter((f) => !f.parentId);
  const allTags      = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();
  const pinnedCount  = notes.filter((n) => n.isPinned).length;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          />

          {/* FIX: use sidebar-panel (has CSS) instead of sidebar */}
          <motion.aside
            className="sidebar-panel"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Top nav ── */}
            <div className="sidebar-nav">
              <button
                className={`sidebar-nav-btn ${activeFolderId === 'all' ? 'active' : ''}`}
                onClick={() => { dispatch({ type: 'SET_ACTIVE_FOLDER', id: 'all' }); setTagFilter(null); }}
              >
                <FileText size={13} />
                <span>All Notes</span>
                <span className="nav-count">{notes.length}</span>
              </button>

              {pinnedCount > 0 && (
                <button
                  className={`sidebar-nav-btn ${activeFolderId === 'pinned' ? 'active' : ''}`}
                  onClick={() => { dispatch({ type: 'SET_ACTIVE_FOLDER', id: 'pinned' }); setTagFilter(null); }}
                >
                  <Pin size={13} />
                  <span>Pinned</span>
                  <span className="nav-count">{pinnedCount}</span>
                </button>
              )}
            </div>

            <div className="sidebar-sep" />

            {/* ── Folders header ── */}
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">Folders</span>
              <button
                className="sidebar-icon-btn"
                onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: true, folder: null })}
                title="New folder"
              >
                <FolderPlus size={13} />
              </button>
            </div>

            <div className="sidebar-folders">
              {rootFolders.length === 0 ? (
                <p className="sidebar-empty-hint">No folders yet</p>
              ) : (
                rootFolders.map((f) => <FolderRow key={f._id} folderId={f._id} />)
              )}
            </div>

            <div className="sidebar-sep" />

            {/* ── Tags ── */}
            {allTags.length > 0 && (
              <>
                <div className="sidebar-section-header">
                  <span className="sidebar-section-label">Tags</span>
                  {tagFilter && (
                    <button
                      className="sidebar-icon-btn"
                      onClick={() => setTagFilter(null)}
                      style={{ fontSize: 10, color: 'var(--accent)' }}
                      title="Clear tag filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="sidebar-tags">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-pill ${tagFilter === tag ? 'accent' : ''}`}
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    >
                      <Tag size={8} />
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="sidebar-sep" />
              </>
            )}

            {/* ── Notes list header ── */}
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">
                {activeFolderId === 'pinned' ? 'Pinned'
                  : activeFolderId === 'all'  ? 'All Notes'
                  : folders.find((f) => f._id === activeFolderId)?.name ?? 'Notes'}
                {' '}
                <span style={{ opacity: 0.5, fontWeight: 400 }}>({visibleNotes.length})</span>
              </span>
              <button
                className="sidebar-icon-btn"
                onClick={() => createNote(
                  typeof activeFolderId === 'string' &&
                  activeFolderId !== 'all' &&
                  activeFolderId !== 'pinned'
                    ? activeFolderId
                    : null
                )}
                title="New note"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* ── Sort bar ── */}
            <SortBar />

            {/* ── Notes ── */}
            <div className="sidebar-notes">
              {visibleNotes.length === 0 ? (
                <div className="sidebar-empty">
                  <FileText size={24} style={{ color: 'var(--accents-3)' }} />
                  <p>No notes here</p>
                  <button
                    className="sidebar-empty-cta"
                    onClick={() => createNote(
                      typeof activeFolderId === 'string' &&
                      activeFolderId !== 'all' &&
                      activeFolderId !== 'pinned'
                        ? activeFolderId
                        : null
                    )}
                  >
                    Create one
                  </button>
                </div>
              ) : (
                visibleNotes.map((note) => (
                  <NoteRow key={note._id} note={note} />
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
