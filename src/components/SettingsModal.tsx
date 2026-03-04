import React, { useState } from 'react';
import {
  X, Settings, Type, Palette, Zap, Eye, Hash,
  Monitor, User, Save, RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SETTINGS, FontFamily, Settings as SettingsType, ViewMode } from '../types';
import { motion } from 'motion/react';
import { socket } from '../services/socket';

const ACCENT_COLORS = [
  { name: 'Amber',   value: '#f59e0b' },
  { name: 'Red',     value: '#ef4444' },
  { name: 'Green',   value: '#10b981' },
  { name: 'Blue',    value: '#3b82f6' },
  { name: 'Purple',  value: '#8b5cf6' },
  { name: 'Orange',  value: '#f97316' },
  { name: 'Cyan',    value: '#06b6d4' },
  { name: 'Pink',    value: '#ec4899' },
  { name: 'Lime',    value: '#84cc16' },
  { name: 'Indigo',  value: '#6366f1' },
];

const FONT_FAMILIES: { value: FontFamily; label: string; preview: string }[] = [
  { value: 'geist-sans', label: 'Geist Sans',  preview: 'Aa' },
  { value: 'geist-mono', label: 'Geist Mono',  preview: 'Aa' },
  { value: 'serif',      label: 'Serif',        preview: 'Aa' },
  { value: 'cursive',    label: 'Cursive',      preview: 'Aa' },
];

const VIEW_MODES: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'edit',    label: 'Edit',    icon: '✏️' },
  { value: 'preview', label: 'Preview', icon: '👁' },
  { value: 'split',   label: 'Split',   icon: '⬛' },
];

type Tab = 'editor' | 'appearance' | 'collaboration' | 'about';

function SliderRow({ label, value, min, max, step = 1, onChange, format }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-accents-5 w-36 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-amber-400"
        style={{ accentColor: 'var(--accent)' }}
      />
      <span className="text-xs font-mono text-accents-4 w-12 text-right">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

function ToggleRow({ label, sublabel, checked, onChange }: {
  label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-accents-5">{sublabel}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors shrink-0`}
        style={{ background: checked ? 'var(--accent)' : 'var(--accents-2)' }}
      >
        <div className={`h-3.5 w-3.5 rounded-full bg-white m-0.5 transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export function SettingsModal() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('editor');

  if (!state.settingsOpen) return null;

  const s  = state.settings;
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });

  const resetAll = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: DEFAULT_SETTINGS });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'editor',        label: 'Editor',        icon: <Type className="h-3.5 w-3.5" /> },
    { id: 'appearance',    label: 'Appearance',    icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'collaboration', label: 'Collaboration', icon: <Zap className="h-3.5 w-3.5" /> },
    { id: 'about',         label: 'About',         icon: <Hash className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: 580 }}
        className="modal-panel w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-accents-2">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-accents-5" />
            <h2 className="text-sm font-semibold">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} className="toolbar-btn text-[10px]" title="Reset to defaults">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })} className="toolbar-btn">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0" style={{ maxHeight: '75vh' }}>
          {/* Tabs */}
          <div className="w-36 shrink-0 border-r border-accents-2 py-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`folder-item w-full text-xs ${tab === t.id ? 'active' : ''}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {tab === 'editor' && (
              <>
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Typography</h3>

                  {/* Font family */}
                  <div>
                    <p className="text-sm text-accents-5 mb-2">Font family</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_FAMILIES.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => up({ fontFamily: f.value })}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            s.fontFamily === f.value
                              ? 'border-accent bg-accent-bg'
                              : 'border-accents-2 bg-background hover:bg-accents-1'
                          }`}
                          style={s.fontFamily === f.value ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' } : {}}
                        >
                          <div
                            className="text-xl font-medium mb-1"
                            style={{
                              fontFamily: f.value === 'geist-mono' ? 'Geist Mono' : f.value === 'serif' ? 'Georgia' : f.value === 'cursive' ? 'cursive' : 'Geist Sans'
                            }}
                          >
                            {f.preview}
                          </div>
                          <div className="text-xs text-accents-5">{f.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <SliderRow
                    label="Font size"
                    value={s.fontSize} min={11} max={24} step={1}
                    onChange={(v) => up({ fontSize: v })}
                    format={(v) => `${v}px`}
                  />
                  <SliderRow
                    label="Line height"
                    value={s.lineHeight} min={1.2} max={2.4} step={0.1}
                    onChange={(v) => up({ lineHeight: v })}
                    format={(v) => v.toFixed(1)}
                  />
                  <SliderRow
                    label="Tab size"
                    value={s.tabSize} min={2} max={8} step={2}
                    onChange={(v) => up({ tabSize: v })}
                    format={(v) => `${v} spaces`}
                  />
                </section>

                <hr className="border-accents-2" />

                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Behavior</h3>
                  <ToggleRow label="Spell check" sublabel="Underline misspelled words" checked={s.spellCheck} onChange={(v) => up({ spellCheck: v })} />
                  <ToggleRow label="Show word count" sublabel="Display in editor bar" checked={s.showWordCount} onChange={(v) => up({ showWordCount: v })} />
                  <SliderRow
                    label="Autosave delay"
                    value={s.autosaveDelay} min={500} max={5000} step={500}
                    onChange={(v) => up({ autosaveDelay: v })}
                    format={(v) => `${v / 1000}s`}
                  />
                </section>

                <hr className="border-accents-2" />

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Default view</h3>
                  <div className="flex gap-2">
                    {VIEW_MODES.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => up({ defaultView: m.value })}
                        className={`flex-1 rounded-xl border py-2.5 text-sm transition-all ${
                          s.defaultView === m.value ? '' : 'border-accents-2 hover:bg-accents-1'
                        }`}
                        style={s.defaultView === m.value ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' } : {}}
                      >
                        <div className="text-lg mb-0.5">{m.icon}</div>
                        <div className="text-xs font-medium">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {tab === 'appearance' && (
              <>
                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Accent color</h3>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => up({ accentColor: c.value })}
                        className="group flex flex-col items-center gap-1"
                        title={c.name}
                      >
                        <div
                          className="h-8 w-8 rounded-full transition-transform group-hover:scale-110 flex items-center justify-center"
                          style={{ background: c.value, outline: s.accentColor === c.value ? `3px solid ${c.value}` : 'none', outlineOffset: 2 }}
                        >
                          {s.accentColor === c.value && (
                            <div className="h-3 w-3 rounded-full bg-white/80" />
                          )}
                        </div>
                        <span className="text-[9px] text-accents-4">{c.name}</span>
                      </button>
                    ))}
                  </div>
                  {/* Custom color */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-accents-5">Custom:</span>
                    <input
                      type="color"
                      value={s.accentColor}
                      onChange={(e) => up({ accentColor: e.target.value })}
                      className="h-8 w-8 rounded-lg cursor-pointer border border-accents-2"
                    />
                    <span className="font-mono text-xs text-accents-4">{s.accentColor}</span>
                  </div>
                </section>

                <hr className="border-accents-2" />

                <section className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => dispatch({ type: 'SET_THEME', theme: t })}
                        className={`rounded-xl border py-3 text-sm font-medium transition-all capitalize ${
                          state.theme === t ? '' : 'border-accents-2 hover:bg-accents-1'
                        }`}
                        style={state.theme === t ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' } : {}}
                      >
                        {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '⚙️'}
                        <div className="mt-1">{t}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {tab === 'collaboration' && (
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-accents-4">Your profile</h3>
                <div>
                  <label className="block text-sm text-accents-5 mb-2">Display name</label>
                  <input
                    value={s.userName}
                    onChange={(e) => up({ userName: e.target.value })}
                    className="w-full rounded-xl border border-accents-2 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-accents-4 outline-none"
                    placeholder="Your name"
                    maxLength={32}
                  />
                  <p className="text-xs text-accents-4 mt-1">Shown to collaborators editing the same note.</p>
                </div>
                <div className="rounded-xl border border-accents-2 bg-accents-1/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`ws-dot ${state.wsConnected ? 'connected' : 'disconnected'}`} />
                    <span className="text-sm font-medium">
                      {state.wsConnected ? 'Connected to real-time server' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-accents-5">
                    Changes sync instantly to all collaborators.
                    WebSocket connection auto-reconnects if lost.
                  </p>
                </div>
                {state.collaborators.length > 0 && (
                  <div>
                    <p className="text-sm text-accents-5 mb-2">Currently editing with you:</p>
                    <div className="space-y-2">
                      {state.collaborators.map((c) => (
                        <div key={c.userId} className="flex items-center gap-2">
                          <div className="collab-avatar" style={{ background: c.color, marginLeft: 0 }}>{c.userName[0]}</div>
                          <span className="text-sm">{c.userName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {tab === 'about' && (
              <section className="space-y-4 text-center py-4">
                <div className="text-4xl mb-2">🍪</div>
                <h2 className="text-xl font-bold">cookie<span style={{ color: 'var(--accent)' }}>.io</span></h2>
                <p className="text-sm text-accents-5">Advanced notepad with real-time collaboration</p>
                <div className="text-xs text-accents-4 space-y-1 font-mono">
                  <p>Version 1.0.0</p>
                  <p>Built with React + MongoDB + WebSockets</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl border border-accents-2 p-3">
                    <div className="text-2xl font-bold">{state.notes.length}</div>
                    <div className="text-xs text-accents-5">Total notes</div>
                  </div>
                  <div className="rounded-xl border border-accents-2 p-3">
                    <div className="text-2xl font-bold">{state.folders.length}</div>
                    <div className="text-xs text-accents-5">Folders</div>
                  </div>
                  <div className="rounded-xl border border-accents-2 p-3">
                    <div className="text-2xl font-bold font-mono">
                      {state.notes.reduce((a, n) => a + (n.wordCount || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-accents-5">Total words</div>
                  </div>
                  <div className="rounded-xl border border-accents-2 p-3">
                    <div className="text-2xl font-bold">{state.tags.length}</div>
                    <div className="text-xs text-accents-5">Unique tags</div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
