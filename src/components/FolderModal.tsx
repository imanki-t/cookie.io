import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Folder, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

/* 20 colors — 4 rows × 5 cols = perfectly even */
const FOLDER_COLORS = [
  '#d97706', '#f59e0b', '#f97316', '#ea580c', '#dc2626',
  '#e11d48', '#db2777', '#9333ea', '#7c3aed', '#4f46e5',
  '#2563eb', '#0891b2', '#0d9488', '#16a34a', '#65a30d',
  '#854d0e', '#78716c', '#6b7280', '#374151', '#0f172a',
];

export function FolderModal() {
  const { state, dispatch, createFolder, updateFolder } = useApp();
  const isEditing = !!state.folderModalTarget;
  const [name,     setName]     = useState('');
  const [color,    setColor]    = useState(FOLDER_COLORS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (state.folderModalOpen) {
      if (state.folderModalTarget) {
        setName(state.folderModalTarget.name);
        setColor(state.folderModalTarget.color);
        setParentId(state.folderModalTarget.parentId);
      } else {
        setName('');
        setColor(FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)]);
        setParentId(null);
      }
    }
  }, [state.folderModalOpen, state.folderModalTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEditing && state.folderModalTarget) {
        await updateFolder(state.folderModalTarget._id, { name: name.trim(), color, parentId });
      } else {
        await createFolder(name.trim(), color, parentId);
      }
      dispatch({ type: 'SET_FOLDER_MODAL', open: false });
    } catch {}
    setSaving(false);
  };

  if (!state.folderModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title" style={{ color }}>
            <FolderPlus size={16} />
            {isEditing ? 'Rename Folder' : 'New Folder'}
          </span>
          <button className="toolbar-btn" onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 9.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 8,
              color: 'var(--accents-4)',
            }}>
              Folder name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Personal, Ideas…"
              className="settings-input"
              maxLength={64}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: 9.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 10,
              color: 'var(--accents-4)',
            }}>
              Color — 20 choices
            </label>
            {/* 4 rows × 5 cols */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
            }}>
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 'var(--r-md)',
                    background: c,
                    border: color === c ? '2.5px solid var(--fg)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: color === c ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: color === c ? `0 0 0 3px var(--bg), 0 0 0 5px ${c}` : 'none',
                  }}
                >
                  {color === c && <Check size={12} color="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />}
                </button>
              ))}
            </div>
          </div>

          {!isEditing && state.folders.length > 0 && (
            <div>
              <label style={{
                display: 'block',
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 8,
                color: 'var(--accents-4)',
              }}>
                Parent folder (optional)
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="settings-input"
              >
                <option value="">None (root)</option>
                {state.folders
                  .filter((f) => !state.folderModalTarget || f._id !== state.folderModalTarget._id)
                  .map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 'var(--r-xl)',
            background: 'var(--accents-1)',
            border: '1.5px solid var(--accents-2)',
          }}>
            <Folder size={18} style={{ color }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{name || 'Untitled Folder'}</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}
              className="settings-btn secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="settings-btn primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create folder'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function MoveNoteModal() {
  const { state, dispatch, moveNote } = useApp();
  const [saving, setSaving] = useState(false);
  const note = state.notes.find((n) => n._id === state.moveNoteTarget);

  if (!state.moveNoteOpen || !note) return null;

  const handleMove = async (folderId: string | null) => {
    setSaving(true);
    try { await moveNote(note._id, folderId); dispatch({ type: 'SET_MOVE_NOTE', open: false }); } catch {}
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_MOVE_NOTE', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">Move "{note.title}"</span>
          <button className="toolbar-btn" onClick={() => dispatch({ type: 'SET_MOVE_NOTE', open: false })}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
          <button
            onClick={() => handleMove(null)}
            className="folder-row w-full"
            style={note.folderId === null ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}}
          >
            <Folder size={14} style={{ color: 'var(--accents-4)' }} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>Root (no folder)</span>
            {note.folderId === null && <Check size={13} style={{ color: 'var(--accent)' }} />}
          </button>
          {state.folders.map((folder) => (
            <button
              key={folder._id}
              onClick={() => handleMove(folder._id)}
              className="folder-row w-full"
              style={note.folderId === folder._id ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}}
            >
              <Folder size={14} style={{ color: folder.color }} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>{folder.name}</span>
              {note.folderId === folder._id && <Check size={13} style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
