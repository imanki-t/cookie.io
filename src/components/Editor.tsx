import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2,
  List, ListOrdered, Quote, Minus, Heading1, Heading2, Heading3,
  Eye, Edit2, Columns, Save, Tag, X, Pin, Palette,
  AlignLeft, Clock, Hash, Copy, Check, MoreHorizontal,
  Maximize2, Minimize2, Undo, Redo,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../context/AppContext';
import { socket } from '../services/socket';
import { ViewMode, Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// ─── Note color options ──────────────────────────────────────
const NOTE_COLORS = [
  null, '#f59e0b', '#ef4444', '#10b981', '#3b82f6',
  '#8b5cf6', '#f97316', '#06b6d4', '#ec4899',
];

// ─── Toolbar button helper ───────────────────────────────────
function ToolBtn({
  icon, title, active = false, onClick,
}: {
  icon: React.ReactNode; title: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`toolbar-btn ${active ? 'active' : ''}`}
      title={title}
    >
      {icon}
    </button>
  );
}

// ─── Tag input ───────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = useCallback(() => {
    const t = input.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }, [input, tags, onChange]);

  const remove = useCallback((tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Hash className="h-3.5 w-3.5 text-accents-4 shrink-0" />
      {tags.map((tag) => (
        <span key={tag} className="tag-pill">
          {tag}
          <button onClick={() => remove(tag)} className="ml-0.5 opacity-70 hover:opacity-100">
            <X className="h-2.5 w-2.5" />
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
        className="bg-transparent outline-none text-xs text-accents-5 placeholder:text-accents-3 min-w-[70px] w-auto"
      />
    </div>
  );
}

// ─── Word count bar ──────────────────────────────────────────
function WordCountBar({ count, target = 500 }: { count: number; target?: number }) {
  const pct = Math.min((count / target) * 100, 100);
  return (
    <div className="word-count-bar w-20">
      <div className="word-count-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Cursor indicator ─────────────────────────────────────────
function CursorIndicator({ name, color, position }: { name: string; color: string; position: number }) {
  return (
    <div
      className="absolute pointer-events-none z-20 flex items-start"
      style={{ top: 0, left: 0, transform: `translateX(${position}px)` }}
    >
      <div className="h-4 w-0.5 rounded-full" style={{ background: color }} />
      <div
        className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-full whitespace-nowrap -mt-4"
        style={{ background: color }}
      >
        {name}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────
function EmptyState() {
  const { createNote, state } = useApp();
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm"
      >
        <div
          className="mx-auto mb-6 h-20 w-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
        >
          🍪
        </div>
        <h2 className="text-2xl font-bold mb-2">cookie<span style={{ color: 'var(--accent)' }}>.io</span></h2>
        <p className="text-sm text-accents-5 mb-6 leading-relaxed">
          Select a note to start editing, or create a new one.
          Real-time collaboration keeps your team in sync.
        </p>
        <button
          onClick={() => createNote()}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          Create your first note
        </button>
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
  const [remoteEditors, setRemoteEditors] = useState<Record<string, { name: string; color: string; position: number }>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout>>();
  const wsTimer     = useRef<ReturnType<typeof setTimeout>>();
  const prevNoteId  = useRef<string | null>(null);

  // Sync from active note
  useEffect(() => {
    if (!activeNote) {
      setTitle(''); setContent(''); setTags([]);
      return;
    }
    if (activeNote._id !== prevNoteId.current) {
      setTitle(activeNote.title   || '');
      setContent(activeNote.content || '');
      setTags(activeNote.tags    || []);
      prevNoteId.current = activeNote._id;
      // Join note room
      socket.joinNote(activeNote._id);
    }
  }, [activeNote]);

  // WebSocket - incoming updates from other users
  useEffect(() => {
    const off1 = socket.on('note_update', (msg: any) => {
      if (msg.userId === socket.getUserId()) return;
      if (msg.noteId !== activeNote?._id) return;
      setTitle(msg.title   || '');
      setContent(msg.content || '');
      setTags(msg.tags    || []);
    });
    const off2 = socket.on('cursor_update', (msg: any) => {
      if (msg.userId === socket.getUserId()) return;
      setRemoteEditors((prev) => ({
        ...prev,
        [msg.userId]: { name: msg.userName, color: msg.color, position: msg.position },
      }));
    });
    const off3 = socket.on('user_left', (msg: any) => {
      setRemoteEditors((prev) => {
        const next = { ...prev };
        delete next[msg.userId];
        return next;
      });
    });
    return () => { off1(); off2(); off3(); };
  }, [activeNote?._id]);

  // Leave note on unmount / change
  useEffect(() => {
    return () => { socket.leaveNote(); };
  }, [activeNote?._id]);

  // Save & broadcast changes
  const scheduleSync = useCallback((newTitle: string, newContent: string, newTags: string[]) => {
    clearTimeout(saveTimer.current);
    clearTimeout(wsTimer.current);

    // Broadcast via WebSocket immediately (debounced slightly)
    wsTimer.current = setTimeout(() => {
      socket.sendNoteUpdate(newTitle, newContent, newTags);
    }, 200);

    // Persist to DB
    saveTimer.current = setTimeout(async () => {
      if (!activeNote) return;
      setSaving(true);
      try {
        await updateNote(activeNote._id, { title: newTitle, content: newContent, tags: newTags });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {}
      finally { setSaving(false); }
    }, state.settings.autosaveDelay);
  }, [activeNote, updateNote, state.settings.autosaveDelay]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    scheduleSync(v, content, tags);
  }, [content, tags, scheduleSync]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContent(v);
    scheduleSync(title, v, tags);
    // Send cursor position
    socket.sendCursorUpdate(e.target.selectionStart);
  }, [title, tags, scheduleSync]);

  const handleTagChange = useCallback((newTags: string[]) => {
    setTags(newTags);
    scheduleSync(title, content, newTags);
  }, [title, content, scheduleSync]);

  // ─── Markdown toolbar helpers ─────────────────────────────
  const wrap = useCallback((prefix: string, suffix = prefix, placeholder = 'text') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart;
    const end    = ta.selectionEnd;
    const sel    = content.slice(start, end) || placeholder;
    const before = content.slice(0, start);
    const after  = content.slice(end);
    const next   = `${before}${prefix}${sel}${suffix}${after}`;
    setContent(next);
    scheduleSync(title, next, tags);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd   = start + prefix.length + sel.length;
    }, 0);
  }, [content, title, tags, scheduleSync]);

  const insertLine = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start  = ta.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const before = content.slice(0, lineStart);
    const rest   = content.slice(lineStart);
    const next   = `${before}${prefix}${rest}`;
    setContent(next);
    scheduleSync(title, next, tags);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = lineStart + prefix.length; }, 0);
  }, [content, title, tags, scheduleSync]);

  // ─── Tab key ───────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const spaces = ' '.repeat(state.settings.tabSize);
      const next = content.slice(0, start) + spaces + content.slice(ta.selectionEnd);
      setContent(next);
      scheduleSync(title, next, tags);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + state.settings.tabSize; }, 0);
    }
  }, [content, title, tags, state.settings.tabSize, scheduleSync]);

  const wordCount = useMemo(() => {
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = content.length;

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  if (!activeNote) return <EmptyState />;

  const toolbarGroups = [
    [
      { icon: <Undo className="h-3.5 w-3.5" />,      title: 'Undo', action: () => document.execCommand('undo') },
      { icon: <Redo className="h-3.5 w-3.5" />,      title: 'Redo', action: () => document.execCommand('redo') },
    ],
    [
      { icon: <span className="text-xs font-black">H1</span>, title: 'Heading 1',     action: () => insertLine('# ') },
      { icon: <span className="text-xs font-bold">H2</span>,  title: 'Heading 2',     action: () => insertLine('## ') },
      { icon: <span className="text-xs font-bold">H3</span>,  title: 'Heading 3',     action: () => insertLine('### ') },
    ],
    [
      { icon: <Bold className="h-3.5 w-3.5" />,         title: 'Bold',          action: () => wrap('**') },
      { icon: <Italic className="h-3.5 w-3.5" />,       title: 'Italic',        action: () => wrap('_') },
      { icon: <Strikethrough className="h-3.5 w-3.5" />,title: 'Strikethrough', action: () => wrap('~~') },
      { icon: <Code className="h-3.5 w-3.5" />,         title: 'Inline code',   action: () => wrap('`') },
    ],
    [
      { icon: <List className="h-3.5 w-3.5" />,        title: 'Bullet list',   action: () => insertLine('- ') },
      { icon: <ListOrdered className="h-3.5 w-3.5" />, title: 'Numbered list', action: () => insertLine('1. ') },
      { icon: <Quote className="h-3.5 w-3.5" />,       title: 'Blockquote',    action: () => insertLine('> ') },
      { icon: <Minus className="h-3.5 w-3.5" />,       title: 'Divider',       action: () => { const next = `${content}\n\n---\n\n`; setContent(next); scheduleSync(title, next, tags); } },
    ],
  ];

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${fullscreen ? 'fixed inset-0 z-[300]' : ''}`}>
      {/* ── Header bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-accents-2 bg-background/95 backdrop-blur-sm shrink-0">
        {/* Status */}
        <div className="flex items-center gap-2 mr-auto">
          {saving && (
            <div className="flex items-center gap-1.5 text-xs text-accents-4">
              <div className="h-3 w-3 border border-accents-3 border-t-accent rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
              Saving…
            </div>
          )}
          {saved && !saving && (
            <div className="flex items-center gap-1.5 text-xs text-accents-4 animate-fade-in">
              <Check className="h-3.5 w-3.5 text-green-400" />
              Saved
            </div>
          )}

          {/* Collaborators on this note */}
          {state.collaborators.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {state.collaborators.slice(0, 3).map((c) => (
                <div key={c.userId} className="collab-avatar text-[9px]" style={{ background: c.color }} title={c.userName}>
                  {c.userName[0]}
                </div>
              ))}
              {state.collaborators.length > 3 && (
                <span className="text-[10px] text-accents-4 ml-1">+{state.collaborators.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Word count */}
        {state.settings.showWordCount && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] font-mono text-accents-4">{wordCount.toLocaleString()} words</span>
            <WordCountBar count={wordCount} />
            <span className="text-[11px] font-mono text-accents-4">{charCount.toLocaleString()} chars</span>
          </div>
        )}

        {/* Pin */}
        <button
          onClick={() => updateNote(activeNote._id, { isPinned: !activeNote.isPinned })}
          className={`toolbar-btn ${activeNote.isPinned ? 'active' : ''}`}
          title={activeNote.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>

        {/* Note color */}
        <div className="relative">
          <button
            onClick={() => setColorOpen((v) => !v)}
            className="toolbar-btn"
            title="Note color"
          >
            <div
              className="h-3.5 w-3.5 rounded-full border border-accents-3"
              style={{ background: activeNote.color || 'transparent' }}
            />
          </button>
          <AnimatePresence>
            {colorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93 }}
                  className="absolute right-0 top-full mt-1 z-50 p-2 rounded-xl border border-accents-2 bg-background shadow-xl flex gap-1.5 flex-wrap w-48"
                >
                  {NOTE_COLORS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { updateNote(activeNote._id, { color: c }); setColorOpen(false); }}
                      className="h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110"
                      style={{
                        background: c || 'transparent',
                        borderColor: c === activeNote.color ? 'var(--accent)' : 'var(--accents-2)',
                      }}
                      title={c || 'No color'}
                    >
                      {!c && <X className="h-3.5 w-3.5 text-accents-4 m-auto" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Copy */}
        <button onClick={copyContent} className={`toolbar-btn ${copied ? 'active' : ''}`} title="Copy content">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {/* View mode */}
        <div className="flex items-center rounded-lg border border-accents-2 bg-accents-1 p-0.5 gap-0.5">
          {([
            { mode: 'edit'    as ViewMode, icon: <Edit2 className="h-3.5 w-3.5" />,    title: 'Edit' },
            { mode: 'preview' as ViewMode, icon: <Eye className="h-3.5 w-3.5" />,      title: 'Preview' },
            { mode: 'split'   as ViewMode, icon: <Columns className="h-3.5 w-3.5" />, title: 'Split' },
          ]).map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              title={v.title}
              className={`flex items-center justify-center rounded-md h-6 w-6 transition-all ${
                viewMode === v.mode ? 'bg-background text-foreground shadow-sm border border-accents-2' : 'text-accents-5 hover:text-foreground'
              }`}
            >
              {v.icon}
            </button>
          ))}
        </div>

        {/* Fullscreen */}
        <button
          onClick={() => setFullscreen((v) => !v)}
          className="toolbar-btn"
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Toolbar ── */}
      {(viewMode === 'edit' || viewMode === 'split') && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-accents-2 bg-background overflow-x-auto scrollbar-hide shrink-0">
          {toolbarGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="toolbar-separator" />}
              {group.map((btn, bi) => (
                <ToolBtn key={bi} icon={btn.icon} title={btn.title} onClick={btn.action} />
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Title ── */}
      <div className="shrink-0 border-b border-accents-2/50" style={{ borderLeftColor: activeNote.color || 'transparent', borderLeftWidth: activeNote.color ? 3 : 0 }}>
        <input
          className="title-input"
          placeholder="Untitled Note"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); textareaRef.current?.focus(); } }}
        />
        {/* Tags */}
        <div className="px-10 pb-3">
          <TagInput tags={tags} onChange={handleTagChange} />
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {/* Edit pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`relative flex-1 overflow-hidden ${viewMode === 'split' ? 'border-r border-accents-2' : ''}`}>
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
                overflowY: 'auto',
                height: '100%',
              } as any}
              placeholder="Start writing… Markdown is supported ✓"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onSelect={(e) => {
                const ta = e.target as HTMLTextAreaElement;
                socket.sendCursorUpdate(ta.selectionStart);
              }}
            />
            {/* Remote cursors (decorative) */}
            {Object.values(remoteEditors).map((editor) => (
              <div key={editor.color} className="absolute bottom-4 right-4 text-[10px] text-white px-2 py-1 rounded-full flex items-center gap-1"
                style={{ background: editor.color }}>
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {editor.name} is editing
              </div>
            ))}
          </div>
        )}

        {/* Preview pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'flex-1' : 'w-full'} overflow-y-auto`}>
            <div
              className="preview-prose"
              style={{ fontSize: `${state.settings.fontSize}px`, lineHeight: state.settings.lineHeight }}
            >
              {content ? (
                <Markdown remarkPlugins={[remarkGfm]}>
                  {content}
                </Markdown>
              ) : (
                <p className="text-accents-4 italic">Nothing to preview yet. Start writing in the editor.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-accents-2 bg-background/80 shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-mono text-accents-4">
          <span>Markdown</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
          {state.settings.showWordCount && content.split('\n').length > 1 && (
            <>
              <span>·</span>
              <span>{content.split('\n').length} lines</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-accents-4">
          {state.collaborators.length > 0 && (
            <span style={{ color: 'var(--accent)' }}>
              🟢 {state.collaborators.length + 1} editing
            </span>
          )}
          <span className="font-mono">
            {new Date(activeNote.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
