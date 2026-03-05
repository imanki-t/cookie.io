import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Eye, Edit2, X, Pin,
  Copy, Check, Maximize2, Minimize2, Image, Download,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { ViewMode, Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

/* ── Helpers ── */
const NOTE_COLORS = [null,'#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899'];

const H1Icon = () => <span style={{ fontSize: 9, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>H1</span>;
const H2Icon = () => <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>H2</span>;
const H3Icon = () => <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>H3</span>;

const PinSVG = ({ filled }: { filled: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);

function getGreeting(): { greeting: string; sub: string } {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { greeting: 'Good morning',   sub: 'What will you write today?' };
  if (h >= 12 && h < 17) return { greeting: 'Good afternoon', sub: 'Keep the momentum going.' };
  if (h >= 17 && h < 21) return { greeting: 'Good evening',   sub: 'Reflect and write freely.' };
  return                         { greeting: 'Good night',     sub: 'Write before you sleep.' };
}

/* ── Tag input ── */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = useCallback(() => {
    const t = input.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }, [input, tags, onChange]);
  const remove = useCallback((tag: string) => onChange(tags.filter((t) => t !== tag)), [tags, onChange]);

  return (
    <div className="tag-input-area">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--accents-4)', flexShrink: 0 }}>
        <path d="M11 6.5L7.5 10a1 1 0 01-1.4 0L.5 4.4A1 1 0 01.5 3L4 .5a1 1 0 011.4 0l5 5a1 1 0 010 1z" stroke="currentColor" strokeWidth="1.1"/>
        <circle cx="3.5" cy="3.5" r="0.8" fill="currentColor"/>
      </svg>
      {tags.map((tag) => (
        <span key={tag} className="tag-pill accent">
          {tag}
          <button onClick={() => remove(tag)} style={{ marginLeft: 2, opacity: 0.65, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'inherit' }}>
            <X size={8} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
        }}
        onBlur={add}
        placeholder="Add tag…"
        className="tag-input"
      />
    </div>
  );
}

/* ── Home screen ── */
function HomeScreen() {
  const { state, dispatch, createNote } = useApp();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { greeting, sub } = getGreeting();

  useEffect(() => {
    api.notes.recent()
      .then((notes) => { setRecentNotes(notes); setLoading(false); })
      .catch(() => setLoading(false));
  }, [state.notes.length]);

  const totalWords = state.notes.reduce((a, n) => a + (n.wordCount || 0), 0);

  return (
    <div className="home-screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 600 }}
      >
        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 className="home-greeting">{greeting}</h1>
          <p className="home-greeting-sub">{sub}</p>
        </div>

        {/* Stats */}
        {state.notes.length > 0 && (
          <div className="home-stats-row">
            {[
              { label: 'Notes',   value: state.notes.length },
              { label: 'Folders', value: state.folders.length },
              { label: 'Words',   value: totalWords.toLocaleString() },
              { label: 'Tags',    value: state.tags.length },
            ].map(({ label, value }) => (
              <div key={label} className="stat-chip">
                <span className="stat-chip-val">{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent notes */}
        {!loading && recentNotes.length > 0 && (
          <>
            <div className="home-section-label">Recent</div>
            <div className="home-notes-grid stagger">
              {recentNotes.map((note) => (
                <motion.button
                  key={note._id}
                  className="home-note-card animate-fade-up"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id })}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                    <span className="home-note-title">{note.title || 'Untitled Note'}</span>
                    {note.color && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: note.color, flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                  {note.content && (
                    <p className="home-note-snippet">
                      {note.content.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]()>~]/g, '').slice(0, 100)}
                    </p>
                  )}
                  <div className="home-note-footer">
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accents-4)' }}>
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                    {note.wordCount > 0 && (
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accents-4)' }}>
                        {note.wordCount}w
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && state.notes.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', textAlign: 'center' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--accents-3)', marginBottom: 14 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accents-5)', marginBottom: 5 }}>No notes yet</p>
            <p style={{ fontSize: 12, color: 'var(--accents-4)', marginBottom: 18 }}>Create your first note to get started</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button className="home-cta" onClick={() => createNote()}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New note
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Editor ── */
export function Editor() {
  const { state, dispatch, updateNote, activeNote } = useApp();
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [tags,     setTags]     = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [editFocused, setEditFocused] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [remoteEditors, setRemoteEditors] = useState<Record<string, { name: string; color: string }>>({});

  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const saveTimer     = useRef<ReturnType<typeof setTimeout>>();
  const wsTimer       = useRef<ReturnType<typeof setTimeout>>();
  const prevNoteId    = useRef<string | null>(null);

  /* Sync from active note */
  useEffect(() => {
    if (!activeNote) { setTitle(''); setContent(''); setTags([]); return; }
    if (activeNote._id !== prevNoteId.current) {
      setTitle(activeNote.title   || '');
      setContent(activeNote.content || '');
      setTags(activeNote.tags    || []);
      prevNoteId.current = activeNote._id;
      setEditFocused(false);
      socket.joinNote(activeNote._id);
    }
  }, [activeNote]);

  /* Set view mode from settings */
  useEffect(() => {
    const settingsView = state.settings.defaultView;
    setViewMode(settingsView === 'split' ? 'edit' : settingsView as 'edit' | 'preview');
  }, [state.settings.defaultView]);

  /* WebSocket events */
  useEffect(() => {
    const off1 = socket.on('note_update', (msg: any) => {
      if (msg.userId === socket.getUserId() || msg.noteId !== activeNote?._id) return;
      setTitle(msg.title || '');
      setContent(msg.content || '');
      setTags(msg.tags || []);
    });
    const off2 = socket.on('cursor_update', (msg: any) => {
      if (msg.userId === socket.getUserId()) return;
      setRemoteEditors((prev) => ({ ...prev, [msg.userId]: { name: msg.userName, color: msg.color } }));
    });
    const off3 = socket.on('user_left', (msg: any) => {
      setRemoteEditors((prev) => { const n = { ...prev }; delete n[msg.userId]; return n; });
    });
    return () => { off1(); off2(); off3(); };
  }, [activeNote?._id]);

  useEffect(() => () => { socket.leaveNote(); }, [activeNote?._id]);

  /* Autosave & broadcast */
  const scheduleSync = useCallback((t: string, c: string, tg: string[]) => {
    clearTimeout(saveTimer.current);
    clearTimeout(wsTimer.current);
    wsTimer.current  = setTimeout(() => socket.sendNoteUpdate(t, c, tg), 200);
    saveTimer.current = setTimeout(async () => {
      if (!activeNote) return;
      setSaving(true);
      try {
        await updateNote(activeNote._id, { title: t, content: c, tags: tg });
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      } catch {}
      setSaving(false);
    }, state.settings.autosaveDelay);
  }, [activeNote, updateNote, state.settings.autosaveDelay]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    scheduleSync(e.target.value, content, tags);
  }, [content, tags, scheduleSync]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    scheduleSync(title, e.target.value, tags);
    socket.sendCursorUpdate(e.target.selectionStart);
  }, [title, tags, scheduleSync]);

  const handleTagChange = useCallback((newTags: string[]) => {
    setTags(newTags);
    scheduleSync(title, content, newTags);
  }, [title, content, scheduleSync]);

  /* Markdown helpers */
  const wrap = useCallback((prefix: string, suffix = prefix) => {
    const ta = textareaRef.current; if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel  = content.slice(s, e) || 'text';
    const next = content.slice(0, s) + prefix + sel + suffix + content.slice(e);
    setContent(next);
    scheduleSync(title, next, tags);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = s + prefix.length;
      ta.selectionEnd = s + prefix.length + sel.length;
    }, 0);
  }, [content, title, tags, scheduleSync]);

  const insertLine = useCallback((prefix: string) => {
    const ta = textareaRef.current; if (!ta) return;
    const lineStart = content.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next);
    scheduleSync(title, next, tags);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = lineStart + prefix.length; }, 0);
  }, [content, title, tags, scheduleSync]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta   = textareaRef.current!;
      const s    = ta.selectionStart;
      const sp   = ' '.repeat(state.settings.tabSize);
      const next = content.slice(0, s) + sp + content.slice(ta.selectionEnd);
      setContent(next);
      scheduleSync(title, next, tags);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + state.settings.tabSize; }, 0);
    }
  }, [content, title, tags, state.settings.tabSize, scheduleSync]);

  /* Image insert — properly display image */
  const handleImageInsert = useCallback(async (file: File) => {
    if (!activeNote) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const base64  = dataUrl.split(',')[1];
      const mime    = file.type;
      let imageUrl  = dataUrl;

      try {
        const result = await api.notes.addImage(activeNote._id, base64, mime, file.name);
        imageUrl = result.url;
      } catch {}

      // Insert markdown at cursor position
      const md  = `\n![${file.name}](${imageUrl})\n`;
      const pos = textareaRef.current?.selectionStart ?? content.length;
      const next = content.slice(0, pos) + md + content.slice(pos);
      setContent(next);
      scheduleSync(title, next, tags);

      // Switch to preview to show image, then switch back to edit briefly
      // Actually just keep in edit mode — overlay will show the image when not focused
      if (textareaRef.current) {
        textareaRef.current.blur();
        setEditFocused(false);
      }
    };
    reader.readAsDataURL(file);
  }, [activeNote, content, title, tags, scheduleSync]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageInsert(file);
        break;
      }
    }
  }, [handleImageInsert]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); files.forEach(handleImageInsert); }
  }, [handleImageInsert]);

  /* Download */
  const downloadTxt = useCallback(() => {
    if (!activeNote) return;
    const text = `${title}\n${'─'.repeat(Math.min(title.length || 10, 40))}\n\n${content}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${title || 'note'}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [activeNote, title, content]);

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [content]);

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const charCount = content.length;
  const lineCount = content.split('\n').length;

  if (!activeNote) return <HomeScreen />;

  const fontStyle = {
    fontSize: `${state.settings.fontSize}px`,
    lineHeight: state.settings.lineHeight,
    fontFamily:
      state.settings.fontFamily === 'geist-mono' ? 'Geist Mono, monospace'
      : state.settings.fontFamily === 'serif'     ? 'Georgia, serif'
      : state.settings.fontFamily === 'cursive'   ? 'cursive'
      : 'Geist Sans, sans-serif',
  };

  const toolbarGroups = [
    [
      { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>, title: 'Undo', action: () => document.execCommand('undo') },
      { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>, title: 'Redo', action: () => document.execCommand('redo') },
    ],
    [
      { icon: <H1Icon />, title: 'Heading 1', action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('# '); }, 10); } },
      { icon: <H2Icon />, title: 'Heading 2', action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('## '); }, 10); } },
      { icon: <H3Icon />, title: 'Heading 3', action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('### '); }, 10); } },
    ],
    [
      { icon: <Bold size={11} />,          title: 'Bold',          action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); wrap('**'); }, 10); } },
      { icon: <Italic size={11} />,        title: 'Italic',        action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); wrap('_'); }, 10); } },
      { icon: <Strikethrough size={11} />, title: 'Strikethrough', action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); wrap('~~'); }, 10); } },
      { icon: <Code size={11} />,          title: 'Inline code',   action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); wrap('`'); }, 10); } },
    ],
    [
      { icon: <List size={11} />,        title: 'Bullet list',   action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('- '); }, 10); } },
      { icon: <ListOrdered size={11} />, title: 'Numbered list', action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('1. '); }, 10); } },
      { icon: <Quote size={11} />,       title: 'Blockquote',    action: () => { setEditFocused(true); setTimeout(() => { textareaRef.current?.focus(); insertLine('> '); }, 10); } },
      { icon: <Minus size={11} />,       title: 'Divider',       action: () => {
        const n = content + '\n\n---\n\n';
        setContent(n);
        scheduleSync(title, n, tags);
      }},
    ],
    [
      { icon: <Image size={11} />, title: 'Insert image', action: () => imageInputRef.current?.click() },
    ],
  ];

  return (
    <div
      className="editor-wrapper"
      style={fullscreen ? { position: 'fixed', inset: 0, zIndex: 400, background: 'var(--bg)' } : {}}
    >
      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageInsert(f); e.target.value = ''; }}
      />

      {/* ── Top bar ── */}
      <div className="editor-topbar">
        {/* Save state */}
        <div className="save-indicator">
          {saving && (
            <>
              <div className="save-dot saving" />
              <span>Saving…</span>
            </>
          )}
          {saved && !saving && (
            <motion.div
              initial={{ opacity: 0, x: -3 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <div className="save-dot saved" />
              <span style={{ color: 'var(--success)' }}>Saved</span>
            </motion.div>
          )}
          {!saving && !saved && (
            <span style={{ color: 'var(--accents-4)', opacity: 0.6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              Auto-save
            </span>
          )}

          {/* Remote editors */}
          {Object.values(remoteEditors).map((e, i) => (
            <div key={i} className="remote-editor-pill" style={{ background: e.color }}>
              <span className="remote-dot" />
              {e.name}
            </div>
          ))}
        </div>

        {/* Word count */}
        {state.settings.showWordCount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }} className="hidden-mobile">
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accents-4)' }}>
              {wordCount.toLocaleString()}w
            </span>
            <div className="wc-bar">
              <div className="wc-bar-fill" style={{ width: `${Math.min((wordCount / 500) * 100, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Pin */}
        <button
          className={`toolbar-btn ${activeNote.isPinned ? 'active' : ''}`}
          onClick={() => updateNote(activeNote._id, { isPinned: !activeNote.isPinned })}
          title={activeNote.isPinned ? 'Unpin' : 'Pin'}
        >
          <PinSVG filled={activeNote.isPinned} />
        </button>

        {/* Note color */}
        <div style={{ position: 'relative' }}>
          <button className="toolbar-btn" onClick={() => setColorOpen((v) => !v)} title="Note color">
            <div style={{
              width: 12, height: 12,
              borderRadius: '50%',
              background: activeNote.color || 'transparent',
              border: activeNote.color ? 'none' : '1.5px solid var(--accents-4)',
            }} />
          </button>
          <AnimatePresence>
            {colorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorOpen(false)} />
                <motion.div
                  className="color-picker-popup"
                  initial={{ opacity: 0, scale: 0.94, y: -3 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.12 }}
                  style={{ zIndex: 500 }}
                >
                  {NOTE_COLORS.map((c, i) => (
                    <button
                      key={i}
                      className={`color-swatch ${c === activeNote.color ? 'active' : ''}`}
                      style={{ background: c || 'transparent', borderColor: c === activeNote.color ? 'var(--fg)' : 'var(--accents-2)' }}
                      onClick={() => { updateNote(activeNote._id, { color: c }); setColorOpen(false); }}
                    >
                      {!c && <X size={10} style={{ margin: 'auto', color: 'var(--accents-4)' }} />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Copy */}
        <button className={`toolbar-btn ${copied ? 'active' : ''}`} onClick={copyContent} title="Copy content">
          {copied ? <Check size={11} /> : <Copy size={11} />}
        </button>

        {/* Download */}
        <button className="toolbar-btn" onClick={downloadTxt} title="Download as .txt">
          <Download size={11} />
        </button>

        {/* View mode — only edit and preview */}
        <div className="view-switcher">
          {([
            { mode: 'edit'    as const, icon: <Edit2  size={10} />, title: 'Edit' },
            { mode: 'preview' as const, icon: <Eye    size={10} />, title: 'Preview' },
          ]).map((v) => (
            <button
              key={v.mode}
              className={`view-btn ${viewMode === v.mode ? 'active' : ''}`}
              title={v.title}
              onClick={() => setViewMode(v.mode)}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Fullscreen — flex-shrink: 0 so never cut off */}
        <button
          className="toolbar-btn"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          style={{ flexShrink: 0 }}
        >
          {fullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
        </button>
      </div>

      {/* ── Markdown toolbar ── */}
      {viewMode === 'edit' && (
        <div className="editor-toolbar">
          {toolbarGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="toolbar-sep" />}
              {group.map((btn, bi) => (
                <button
                  key={bi}
                  className="toolbar-btn"
                  title={btn.title}
                  onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
                >
                  {btn.icon}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Title ── */}
      <div style={{
        borderBottom: '1px solid var(--accents-2)',
        borderLeft: activeNote.color ? `3px solid ${activeNote.color}` : undefined,
        flexShrink: 0,
      }}>
        <input
          className="note-title-input"
          placeholder="Untitled Note"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setEditFocused(true);
              setTimeout(() => textareaRef.current?.focus(), 0);
            }
          }}
        />
        <TagInput tags={tags} onChange={handleTagChange} />
      </div>

      {/* ── Content area ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {/* Edit pane — WYSIWYG overlay approach */}
        {viewMode === 'edit' && (
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {/* Rendered overlay — shows when NOT focused */}
            {!editFocused && (
              <div
                className="editor-rendered-overlay preview-prose"
                onClick={() => {
                  setEditFocused(true);
                  setTimeout(() => {
                    textareaRef.current?.focus();
                    // Place cursor at end
                    const len = textareaRef.current?.value.length || 0;
                    textareaRef.current?.setSelectionRange(len, len);
                  }, 0);
                }}
                style={{
                  ...fontStyle,
                  cursor: 'text',
                  position: 'absolute',
                  inset: 0,
                  overflowY: 'auto',
                  padding: '22px 40px 80px',
                  zIndex: 2,
                  background: 'var(--bg)',
                }}
              >
                {content
                  ? <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                  : <p className="empty-state" style={{ color: 'var(--accents-4)', fontStyle: 'italic' }}>Click to start writing…</p>
                }
              </div>
            )}

            {/* Textarea — always present below, visible when focused */}
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              style={{
                ...fontStyle,
                spellCheck: state.settings.spellCheck,
                position: 'absolute',
                inset: 0,
                opacity: editFocused ? 1 : 0,
                zIndex: editFocused ? 3 : 1,
                pointerEvents: editFocused ? 'auto' : 'none',
              } as any}
              placeholder="Start writing… Markdown supported"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onFocus={() => setEditFocused(true)}
              onBlur={() => {
                // Small delay to allow toolbar button clicks
                setTimeout(() => setEditFocused(false), 150);
              }}
              onSelect={(e) => {
                const ta = e.target as HTMLTextAreaElement;
                socket.sendCursorUpdate(ta.selectionStart);
              }}
            />
          </div>
        )}

        {/* Preview pane */}
        {viewMode === 'preview' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              className="preview-prose"
              style={{ ...fontStyle, overflowY: 'auto', height: '100%' }}
            >
              {content
                ? <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                : <p style={{ color: 'var(--accents-4)', fontStyle: 'italic', fontSize: 14 }}>Nothing to preview yet.</p>
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="editor-footer">
        <div className="editor-footer-stat">
          <span>Markdown</span>
          <span className="editor-footer-sep" />
          <span>{wordCount.toLocaleString()} words</span>
          <span className="editor-footer-sep" />
          <span>{charCount.toLocaleString()} chars</span>
          {lineCount > 1 && (
            <>
              <span className="editor-footer-sep" />
              <span>{lineCount} lines</span>
            </>
          )}
        </div>
        <div className="editor-footer-stat">
          {state.collaborators.length > 0 && (
            <span style={{ color: 'var(--accent)' }}>{state.collaborators.length + 1} editing</span>
          )}
          <span>{new Date(activeNote.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
