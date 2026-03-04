import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Folder, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

const FOLDER_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
  '#8b5cf6', '#f97316', '#06b6d4', '#ec4899',
  '#84cc16', '#6366f1', '#14b8a6', '#f43f5e',
];

export function FolderModal() {
  const { state, dispatch, createFolder, updateFolder } = useApp();
  const isEditing = !!state.folderModalTarget;
  const [name, setName]     = useState('');
  const [color, setColor]   = useState(FOLDER_COLORS[0]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    finally { setSaving(false); }
  };

  if (!state.folderModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-accents-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: color + '20', color }}>
              <FolderPlus className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold">{isEditing ? 'Rename Folder' : 'New Folder'}</h2>
          </div>
          <button onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })} className="toolbar-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Folder name */}
          <div>
            <label className="block text-xs font-semibold text-accents-5 mb-2 uppercase tracking-wider">Folder name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Personal, Ideas…"
              className="w-full rounded-xl border border-accents-2 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-accents-4 outline-none focus:border-accent transition-colors"
              style={{ '--accent': 'var(--accent)' } as any}
              maxLength={64}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-accents-5 mb-2 uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Parent folder */}
          {!isEditing && state.folders.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-accents-5 mb-2 uppercase tracking-wider">
                Parent folder (optional)
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full rounded-xl border border-accents-2 bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">None (root level)</option>
                {state.folders
                  .filter((f) => !state.folderModalTarget || f._id !== state.folderModalTarget._id)
                  .map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Preview */}
          <div className="rounded-xl border border-accents-2 bg-accents-1/50 p-4">
            <p className="text-[10px] text-accents-4 uppercase tracking-wider mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" style={{ color }} />
              <span className="text-sm font-medium">{name || 'Untitled Folder'}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}
              className="flex-1 rounded-xl border border-accents-2 py-2.5 text-sm font-medium text-accents-5 hover:text-foreground hover:bg-accents-1 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create folder'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Move Note Modal ──────────────────────────────────────────
export function MoveNoteModal() {
  const { state, dispatch, moveNote } = useApp();
  const [saving, setSaving] = useState(false);
  const note = state.notes.find((n) => n._id === state.moveNoteTarget);

  if (!state.moveNoteOpen || !note) return null;

  const handleMove = async (folderId: string | null) => {
    setSaving(true);
    try {
      await moveNote(note._id, folderId);
      dispatch({ type: 'SET_MOVE_NOTE', open: false });
    } catch {}
    finally { setSaving(false); }
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-accents-2">
          <h2 className="text-sm font-semibold">Move "{note.title}"</h2>
          <button onClick={() => dispatch({ type: 'SET_MOVE_NOTE', open: false })} className="toolbar-btn">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 max-h-80 overflow-y-auto">
          {/* Root */}
          <button
            onClick={() => handleMove(null)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-accents-1 ${note.folderId === null ? 'bg-accent-bg' : ''}`}
            style={note.folderId === null ? { background: 'var(--accent-bg)' } : {}}
          >
            <Folder className="h-4 w-4 text-accents-4" />
            <span className="flex-1 text-left">Root (no folder)</span>
            {note.folderId === null && <Check className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
          </button>
          {state.folders.map((folder) => (
            <button
              key={folder._id}
              onClick={() => handleMove(folder._id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-accents-1"
              style={note.folderId === folder._id ? { background: 'var(--accent-bg)' } : {}}
            >
              <Folder className="h-4 w-4" style={{ color: folder.color }} />
              <span className="flex-1 text-left">{folder.name}</span>
              {note.folderId === folder._id && <Check className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
