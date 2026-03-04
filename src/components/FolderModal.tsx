import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Folder, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';

const FOLDER_COLORS = [
  '#f59e0b','#ef4444','#10b981','#3b82f6',
  '#8b5cf6','#f97316','#06b6d4','#ec4899',
  '#84cc16','#6366f1','#14b8a6','#f43f5e',
];

export function FolderModal() {
  const { state, dispatch, createFolder, updateFolder } = useApp();
  const isEditing = !!state.folderModalTarget;
  const [name, setName]   = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
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
    setSaving(false);
  };

  if (!state.folderModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title" style={{ color }}>
            <FolderPlus size={15} />
            {isEditing ? 'Rename Folder' : 'New Folder'}
          </span>
          <button className="toolbar-btn" onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accents-4)' }}>Folder name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Personal, Ideas…"
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
              maxLength={64}
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accents-4)' }}>Color</label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  className="color-swatch"
                  style={{ background: c, borderColor: color === c ? 'var(--fg)' : 'transparent' }}
                >
                  {color === c && <Check size={12} color="white" style={{ margin: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          {!isEditing && state.folders.length > 0 && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accents-4)' }}>Parent folder (optional)</label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--fg)' }}
              >
                <option value="">None (root)</option>
                {state.folders.filter((f) => !state.folderModalTarget || f._id !== state.folderModalTarget._id).map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
            <Folder size={16} style={{ color }} />
            <span className="text-sm font-medium">{name || 'Untitled Folder'}</span>
          </div>

          <div className="flex gap-2">
            <button type="button"
              onClick={() => dispatch({ type: 'SET_FOLDER_MODAL', open: false })}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all hover:bg-[var(--accents-1)]"
              style={{ border: '1px solid var(--accents-2)', color: 'var(--accents-5)' }}
            >
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--fg)', color: 'var(--bg)' }}
            >
              {saving ? 'Saving…' : isEditing ? 'Save' : 'Create folder'}
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
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
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
        <div className="p-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <button
            onClick={() => handleMove(null)}
            className="folder-row w-full"
            style={note.folderId === null ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}}
          >
            <Folder size={14} style={{ color: 'var(--accents-4)' }} />
            <span className="flex-1 text-left text-sm">Root (no folder)</span>
            {note.folderId === null && <Check size={12} style={{ color: 'var(--accent)' }} />}
          </button>
          {state.folders.map((folder) => (
            <button
              key={folder._id}
              onClick={() => handleMove(folder._id)}
              className="folder-row w-full"
              style={note.folderId === folder._id ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}}
            >
              <Folder size={14} style={{ color: folder.color }} />
              <span className="flex-1 text-left text-sm">{folder.name}</span>
              {note.folderId === folder._id && <Check size={12} style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
