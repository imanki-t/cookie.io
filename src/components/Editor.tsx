import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Eye, Edit2, Columns, Tag, X, Pin,
  AlignLeft, Copy, Check, Maximize2, Minimize2, Undo, Redo,
  Image, Download, FileText, Clock, ArrowRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { ViewMode, Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

// ─── Note color options ──────────────────────────────────────
const NOTE_COLORS = [null,'#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#f97316','#06b6d4','#ec4899'];

// ─── SVG icons ───────────────────────────────────────────────
const H1Icon = () => <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>H1</span>;
const H2Icon = () => <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>H2</span>;
const H3Icon = () => <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>H3</span>;
const PinSVG = ({ filled }: { filled: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
);

// ─── Tag input ───────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = useCallback(() => {
    const t = input.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }, [input, tags, onChange]);
  const remove = useCallback((tag: string) => onChange(tags.filter((t) => t !== tag)), [tags, onChange]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-10 pb-3">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accents-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      {tags.map((tag) => (
        <span key={tag} className="tag-pill text-[10px]">
          {tag}
          <button onClick={() => remove(tag)} className="ml-0.5 opacity-60 hover:opacity-100">
            <X size={9} />
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
        className="bg-transparent outline-none text-[11px] placeholder:opacity-40 min-w-[60px]"
        style={{ color: 'var(--accents-5)', fontFamily: 'var(--font-sans)' }}
      />
    </div>
  );
}

// ─── Recent Notes Home Screen ─────────────────────────────────
function RecentNotesHome() {
  const { state, dispatch, createNote } = useApp();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notes.recent().then((notes) => { setRecentNotes(notes); setLoading(false); }).catch(() => setLoading(false));
  }, [state.notes.length]);

  const totalWords = state.notes.reduce((a, n) => a + (n.wordCount || 0), 0);

  return (
    <div className="empty-state px-8 py-12 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-[pulse-dot_2s_ease_infinite]" style={{ background: 'var(--accent)' }} />
            {state.wsConnected ? 'Live sync active' : 'Connecting…'}
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: '-0.04em' }}>
            Good to see you
          </h1>
          <p className="text-sm" style={{ color: 'var(--accents-5)' }}>
            Select a note or create a new one
          </p>
        </div>

        {/* Stats */}
        {state.notes.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            {[
              { label: 'Notes', value: state.notes.length },
              { label: 'Folders', value: state.folders.length },
              { label: 'Words', value: totalWords.toLocaleString() },
              { label: 'Tags', value: state.tags.length },
            ].map(({ label, value }) => (
              <div key={label} className="stat-chip">
                <span className="font-semibold" style={{ color: 'var(--fg)' }}>{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent notes grid */}
        {!loading && recentNotes.length > 0 && (
          <div>
            <div className="divider-label mb-4">Recent Notes</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
              {recentNotes.map((note) => (
                <motion.button
                  key={note._id}
                  className="recent-note-card"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_NOTE', id: note._id })}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold truncate leading-tight" style={{ letterSpacing: '-0.01em' }}>
                      {note.title || 'Untitled Note'}
                    </span>
                    {note.color && <div className="note-color-dot shrink-0 mt-1" style={{ background: note.color }} />}
                  </div>
                  {note.content && (
                    <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: 'var(--accents-5)' }}>
                      {note.content.replace(/#{1,6}\s/g, '').replace(/[*_`\[\]()>]/g, '').slice(0, 80)}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                    </span>
                    {note.wordCount > 0 && (
                      <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
                        {note.wordCount}w
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={() => createNote()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-85 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'var(--fg)', color: 'var(--bg)' }}
          >
            Create new note
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Editor ─────────────────────────────────────────────
export function Editor() {
  const { state, dispatch, updateNote, deleteNote, activeNote } = useApp();
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(state.settings.defaultView);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [remoteEditors, setRemoteEditors] = useState<Record<string, { name: string; color: string }>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout>>();
  const wsTimer     = useRef<ReturnType<typeof setTimeout>>();
  const prevNoteId  = useRef<string | null>(null);

  // Sync from active note
  useEffect(() => {
    if (!activeNote) { setTitle(''); setContent(''); setTags([]); return; }
    if (activeNote._id !== prevNoteId.current) {
      setTitle(activeNote.title   || '');
      setContent(activeNote.content || '');
      setTags(activeNote.tags    || []);
      prevNoteId.current = activeNote._id;
      socket.joinNote(activeNote._id);
      setIsEditorFocused(false);
    }
  }, [activeNote]);

  // WebSocket events
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

  // Save & broadcast
  const scheduleSync = useCallback((t: string, c: string, tg: string[]) => {
    clearTimeout(saveTimer.current);
    clearTimeout(wsTimer.current);
    wsTimer.current = setTimeout(() => socket.sendNoteUpdate(t, c, tg), 250);
    saveTimer.current = setTimeout(async () => {
      if (!activeNote) return;
      setSaving(true);
      try {
        await updateNote(activeNote._id, { title: t, content: c, tags: tg });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
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

  // ─── Markdown helpers ─────────────────────────────────────
  const wrap = useCallback((prefix: string, suffix = prefix) => {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const sel = content.slice(start, end) || 'text';
    const next = content.slice(0, start) + prefix + sel + suffix + content.slice(end);
    setContent(next); scheduleSync(title, next, tags);
    setTimeout(() => { ta.focus(); ta.selectionStart = start + prefix.length; ta.selectionEnd = start + prefix.length + sel.length; }, 0);
  }, [content, title, tags, scheduleSync]);

  const insertLine = useCallback((prefix: string) => {
    const ta = textareaRef.current; if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const next = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    setContent(next); scheduleSync(title, next, tags);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = lineStart + prefix.length; }, 0);
  }, [content, title, tags, scheduleSync]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const spaces = ' '.repeat(state.settings.tabSize);
      const next = content.slice(0, start) + spaces + content.slice(ta.selectionEnd);
      setContent(next); scheduleSync(title, next, tags);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + state.settings.tabSize; }, 0);
    }
  }, [content, title, tags, state.settings.tabSize, scheduleSync]);

  // ─── Image insertion ──────────────────────────────────────
  const handleImageInsert = useCallback(async (file: File) => {
    if (!activeNote) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const base64  = dataUrl.split(',')[1];
      const mime    = file.type;
      try {
        const result = await api.notes.addImage(activeNote._id, base64, mime, file.name);
        const imageMarkdown = `\n![${file.name}](${result.url})\n`;
        const ta = textareaRef.current;
        const pos = ta ? ta.selectionStart : content.length;
        const next = content.slice(0, pos) + imageMarkdown + content.slice(pos);
        setContent(next);
        scheduleSync(title, next, tags);
      } catch {
        // Fallback: embed base64 directly
        const imageMarkdown = `\n![${file.name}](${dataUrl})\n`;
        const pos = textareaRef.current?.selectionStart ?? content.length;
        const next = content.slice(0, pos) + imageMarkdown + content.slice(pos);
        setContent(next);
        scheduleSync(title, next, tags);
      }
    };
    reader.readAsDataURL(file);
  }, [activeNote, content, title, tags, scheduleSync]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
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

  // ─── Download as .txt ─────────────────────────────────────
  const downloadTxt = useCallback(() => {
    if (!activeNote) return;
    const text = `${title}\n${'='.repeat(title.length || 10)}\n\n${content}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${title || 'note'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeNote, title, content]);

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const charCount = content.length;

  if (!activeNote) return <RecentNotesHome />;

  const toolbarGroups = [
    [
      { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>, title: 'Undo', action: () => document.execCommand('undo') },
      { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>, title: 'Redo', action: () => document.execCommand('redo') },
    ],
    [
      { icon: <H1Icon />, title: 'Heading 1', action: () => insertLine('# ') },
      { icon: <H2Icon />, title: 'Heading 2', action: () => insertLine('## ') },
      { icon: <H3Icon />, title: 'Heading 3', action: () => insertLine('### ') },
    ],
    [
      { icon: <Bold size={12} />,          title: 'Bold',          action: () => wrap('**') },
      { icon: <Italic size={12} />,        title: 'Italic',        action: () => wrap('_') },
      { icon: <Strikethrough size={12} />, title: 'Strike',        action: () => wrap('~~') },
      { icon: <Code size={12} />,          title: 'Inline code',   action: () => wrap('`') },
    ],
    [
      { icon: <List size={12} />,        title: 'Bullet list',   action: () => insertLine('- ') },
      { icon: <ListOrdered size={12} />, title: 'Numbered list', action: () => insertLine('1. ') },
      { icon: <Quote size={12} />,       title: 'Blockquote',    action: () => insertLine('> ') },
      { icon: <Minus size={12} />,       title: 'Divider',       action: () => { const n = content + '\n\n---\n\n'; setContent(n); scheduleSync(title, n, tags); } },
    ],
    [
      { icon: <Image size={12} />, title: 'Insert image', action: () => imageInputRef.current?.click() },
    ],
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden ${fullscreen ? 'fixed inset-0 z-[300] bg-[var(--bg)]' : ''}`}
      style={{ background: 'var(--bg)' }}>

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageInsert(f); e.target.value = ''; }}
      />

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--accents-2)', background: 'var(--bg)' }}>
        {/* Save state */}
        <div className="flex items-center gap-1.5 mr-auto min-w-0">
          {saving && (
            <div className="save-indicator">
              <div className="save-dot saving" />
              <span>Saving</span>
            </div>
          )}
          {saved && !saving && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="save-indicator"
            >
              <div className="save-dot saved" />
              <span>Saved</span>
            </motion.div>
          )}
          {!saving && !saved && (
            <div className="save-indicator">
              <div className="save-dot" style={{ background: 'var(--accents-3)' }} />
              <span style={{ opacity: 0.5 }}>Auto-save on</span>
            </div>
          )}

          {/* Remote editors */}
          {Object.values(remoteEditors).length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {Object.values(remoteEditors).map((e, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] text-white font-semibold"
                  style={{ background: e.color }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-[pulse-dot_1s_ease_infinite]" />
                  {e.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Word count */}
        {state.settings.showWordCount && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>{wordCount.toLocaleString()} words</span>
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
        <div className="relative">
          <button className="toolbar-btn" onClick={() => setColorOpen((v) => !v)} title="Note color">
            <div className="w-3 h-3 rounded-full border border-[var(--accents-3)]"
              style={{ background: activeNote.color || 'transparent' }} />
          </button>
          <AnimatePresence>
            {colorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="absolute right-0 top-full mt-1 z-50 p-2 flex flex-wrap gap-1.5 rounded-xl"
                  style={{ background: 'var(--bg)', border: '1px solid var(--accents-2)', boxShadow: 'var(--shadow-lg)', width: 160 }}
                >
                  {NOTE_COLORS.map((c, i) => (
                    <button
                      key={i}
                      className="color-swatch"
                      style={{ background: c || 'transparent', borderColor: c === activeNote.color ? 'var(--fg)' : 'var(--accents-2)' }}
                      onClick={() => { updateNote(activeNote._id, { color: c }); setColorOpen(false); }}
                    >
                      {!c && <X size={12} style={{ margin: 'auto', color: 'var(--accents-4)' }} />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Copy */}
        <button className={`toolbar-btn ${copied ? 'active' : ''}`} onClick={copyContent} title="Copy content">
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>

        {/* Download .txt */}
        <button className="toolbar-btn" onClick={downloadTxt} title="Download as .txt">
          <Download size={12} />
        </button>

        {/* View mode */}
        <div className="view-switcher">
          {([
            { mode: 'edit'    as ViewMode, icon: <Edit2 size={11} />, title: 'Edit' },
            { mode: 'preview' as ViewMode, icon: <Eye size={11} />,   title: 'Preview' },
            { mode: 'split'   as ViewMode, icon: <Columns size={11} />, title: 'Split' },
          ]).map((v) => (
            <button
              key={v.mode}
              className={`view-switcher-btn ${viewMode === v.mode ? 'active' : ''}`}
              title={v.title}
              onClick={() => setViewMode(v.mode)}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Fullscreen */}
        <button className="toolbar-btn" onClick={() => setFullscreen((v) => !v)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      {/* ── Toolbar ── */}
      {(viewMode === 'edit' || viewMode === 'split') && (
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
      <div className="shrink-0" style={{
        borderBottom: '1px solid var(--accents-2)',
        borderLeft: activeNote.color ? `3px solid ${activeNote.color}` : undefined,
      }}>
        <input
          className="note-title-input"
          placeholder="Untitled Note"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); textareaRef.current?.focus(); setIsEditorFocused(true); }
          }}
          onClick={() => setIsEditorFocused(true)}
        />
        <TagInput tags={tags} onChange={handleTagChange} />
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Edit pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`relative flex-1 overflow-hidden ${viewMode === 'split' ? '' : ''}`}
            style={viewMode === 'split' ? { borderRight: '1px solid var(--accents-2)' } : {}}>

            {/* Click to edit overlay when not focused */}
            {!isEditorFocused && viewMode === 'edit' && (
              <div
                className="absolute inset-0 z-10 cursor-text flex items-start"
                onClick={() => { setIsEditorFocused(true); setTimeout(() => textareaRef.current?.focus(), 0); }}
              >
                {!content && (
                  <p className="px-10 pt-8 text-sm select-none pointer-events-none" style={{ color: 'var(--accents-4)' }}>
                    Click to start writing… Markdown supported
                  </p>
                )}
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="editor-textarea"
              style={{
                fontSize: `${state.settings.fontSize}px`,
                lineHeight: state.settings.lineHeight,
                fontFamily: state.settings.fontFamily === 'geist-mono' ? 'Geist Mono, monospace'
                  : state.settings.fontFamily === 'serif' ? 'Georgia, serif'
                  : state.settings.fontFamily === 'cursive' ? 'cursive'
                  : 'Geist Sans, sans-serif',
                spellCheck: state.settings.spellCheck,
              } as any}
              placeholder={isEditorFocused ? 'Start writing… Markdown is supported' : ''}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsEditorFocused(true)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onSelect={(e) => {
                const ta = e.target as HTMLTextAreaElement;
                socket.sendCursorUpdate(ta.selectionStart);
              }}
            />
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'flex-1' : 'w-full'} overflow-y-auto`}>
            <div className="preview-prose"
              style={{ fontSize: `${state.settings.fontSize}px`, lineHeight: state.settings.lineHeight }}>
              {content ? (
                <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
              ) : (
                <p className="italic" style={{ color: 'var(--accents-4)' }}>Nothing to preview yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-1.5 shrink-0"
        style={{ borderTop: '1px solid var(--accents-2)' }}>
        <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
          <span>Markdown</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
          {content.split('\n').length > 1 && <>
            <span>·</span>
            <span>{content.split('\n').length} lines</span>
          </>}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: 'var(--accents-4)' }}>
          {state.collaborators.length > 0 && (
            <span style={{ color: 'var(--accent)' }}>{state.collaborators.length + 1} editing</span>
          )}
          <span>{new Date(activeNote.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
