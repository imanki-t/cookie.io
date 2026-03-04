import React, { useState } from 'react';
import { X, Type, Palette, Zap, Hash, User, Lock, Loader2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SETTINGS, FontFamily, Settings as SettingsType, ViewMode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

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

const FONT_FAMILIES: { value: FontFamily; label: string; preview: string; css: string }[] = [
  { value: 'geist-sans', label: 'Sans',    preview: 'Ag', css: 'Geist Sans, sans-serif' },
  { value: 'geist-mono', label: 'Mono',    preview: 'Ag', css: 'Geist Mono, monospace' },
  { value: 'serif',      label: 'Serif',   preview: 'Ag', css: 'Georgia, serif' },
  { value: 'cursive',    label: 'Cursive', preview: 'Ag', css: 'cursive' },
];

type Tab = 'editor' | 'appearance' | 'account' | 'about';

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <div>
        <p className="text-[13px]">{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--accents-5)' }}>{sub}</p>}
      </div>
      <button className={`toggle-track ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </button>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, format }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px]" style={{ color: 'var(--accents-6)' }}>{label}</span>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--accents-1)', color: 'var(--accents-5)', border: '1px solid var(--accents-2)' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="geist-slider"
      />
    </div>
  );
}

function AccountTab() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { dispatch } = useApp();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saveMsg, setSaveMsg]   = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currPass, setCurrPass]   = useState('');
  const [newPass, setNewPass]     = useState('');
  const [passMsg, setPassMsg]     = useState('');
  const [passError, setPassError] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const saveProfile = async () => {
    setSavingProfile(true);
    try { await updateProfile({ displayName }); setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
    catch (e: any) { setSaveMsg(e.message); }
    setSavingProfile(false);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(''); setPassMsg('');
    if (newPass.length < 6) { setPassError('New password too short (min 6)'); return; }
    setChangingPass(true);
    try {
      await changePassword(currPass, newPass);
      setPassMsg('Password changed!');
      setCurrPass(''); setNewPass('');
      setTimeout(() => setPassMsg(''), 3000);
    } catch (e: any) { setPassError(e.message); }
    setChangingPass(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile section */}
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Profile</h3>
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}>
          <div className="user-avatar text-[14px] w-10 h-10" style={{ background: 'var(--accent)' }}>
            {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
            <p className="text-[11px] font-mono" style={{ color: 'var(--accents-4)' }}>@{user?.username}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--accents-4)' }}>Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
              style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
              maxLength={32}
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-85"
            style={{ background: 'var(--fg)', color: 'var(--bg)' }}
          >
            {savingProfile ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {saveMsg || 'Save profile'}
          </button>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--accents-2)' }} />

      {/* Change password */}
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>
          <Lock size={10} className="inline mr-1" />
          Change Password
        </h3>
        <form onSubmit={handleChangePass} className="space-y-3">
          <input
            type="password" value={currPass} onChange={(e) => setCurrPass(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          />
          <input
            type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
            placeholder="New password (min 6)"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
            style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)', color: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
          />
          {passError && <p className="text-[11px] text-red-400">{passError}</p>}
          {passMsg && <p className="text-[11px]" style={{ color: 'var(--success)' }}>{passMsg}</p>}
          <button
            type="submit" disabled={changingPass || !currPass || !newPass}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-40"
            style={{ background: 'var(--fg)', color: 'var(--bg)' }}
          >
            {changingPass ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
            Change password
          </button>
        </form>
      </section>

      <div style={{ height: 1, background: 'var(--accents-2)' }} />

      {/* Sign out */}
      <section>
        <button
          onClick={() => { dispatch({ type: 'SET_SETTINGS_OPEN', open: false }); logout(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </section>
    </div>
  );
}

export function SettingsModal() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('editor');

  if (!state.settingsOpen) return null;

  const s  = state.settings;
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'editor',     label: 'Editor',     icon: <Type size={13} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={13} /> },
    { id: 'account',    label: 'Account',    icon: <User size={13} /> },
    { id: 'about',      label: 'About',      icon: <Hash size={13} /> },
  ];

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
        className="modal-panel"
        style={{ maxWidth: 560, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accents-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 1 0 .01 14.14"/><path d="M19.07 4.93l-.01 3.54L15.52 12"/></svg>
            Settings
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => up(DEFAULT_SETTINGS)} className="toolbar-btn text-[10px] px-2" title="Reset defaults">Reset</button>
            <button onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })} className="toolbar-btn">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex" style={{ maxHeight: 'calc(85vh - 57px)', overflow: 'hidden' }}>
          {/* Tabs sidebar */}
          <div className="w-32 shrink-0 py-2 px-1.5" style={{ borderRight: '1px solid var(--accents-2)' }}>
            {tabs.map((t) => (
              <button key={t.id} className={`settings-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {tab === 'editor' && (
              <>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Typography</h3>
                  {/* Font */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {FONT_FAMILIES.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => up({ fontFamily: f.value })}
                        className="rounded-xl border p-3 text-left transition-all"
                        style={s.fontFamily === f.value
                          ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)' }
                          : { borderColor: 'var(--accents-2)', background: 'var(--bg)' }
                        }
                      >
                        <div className="text-xl mb-0.5" style={{ fontFamily: f.css }}>{f.preview}</div>
                        <div className="text-[11px]" style={{ color: 'var(--accents-5)' }}>{f.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <SliderRow label="Font size" value={s.fontSize} min={11} max={24} onChange={(v) => up({ fontSize: v })} format={(v) => `${v}px`} />
                    <SliderRow label="Line height" value={s.lineHeight} min={1.2} max={2.4} step={0.1} onChange={(v) => up({ lineHeight: v })} format={(v) => v.toFixed(1)} />
                    <SliderRow label="Tab size" value={s.tabSize} min={2} max={8} step={2} onChange={(v) => up({ tabSize: v })} format={(v) => `${v}sp`} />
                    <SliderRow label="Autosave delay" value={s.autosaveDelay} min={500} max={5000} step={500} onChange={(v) => up({ autosaveDelay: v })} format={(v) => `${(v/1000).toFixed(1)}s`} />
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--accents-2)' }} />
                <div className="space-y-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Behavior</h3>
                  <ToggleRow label="Spell check" sub="Highlight misspelled words" checked={s.spellCheck} onChange={(v) => up({ spellCheck: v })} />
                  <ToggleRow label="Show word count" sub="Display in editor bar" checked={s.showWordCount} onChange={(v) => up({ showWordCount: v })} />
                </div>
                <div style={{ height: 1, background: 'var(--accents-2)' }} />
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Default view</h3>
                  <div className="flex gap-2">
                    {(['edit', 'preview', 'split'] as ViewMode[]).map((m) => (
                      <button key={m} onClick={() => up({ defaultView: m })}
                        className="flex-1 rounded-xl border py-2.5 text-[12px] transition-all capitalize"
                        style={s.defaultView === m
                          ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent)' }
                          : { borderColor: 'var(--accents-2)', color: 'var(--accents-5)' }
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'appearance' && (
              <>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Accent Color</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ACCENT_COLORS.map((c) => (
                      <button key={c.value} title={c.name} onClick={() => up({ accentColor: c.value })}
                        className="color-swatch"
                        style={{ background: c.value, borderColor: s.accentColor === c.value ? 'var(--fg)' : 'transparent' }}>
                        {s.accentColor === c.value && <Check size={12} color="white" style={{ margin: 'auto' }} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px]" style={{ color: 'var(--accents-5)' }}>Custom:</span>
                    <input type="color" value={s.accentColor} onChange={(e) => up({ accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border" style={{ borderColor: 'var(--accents-2)' }} />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--accents-4)' }}>{s.accentColor}</span>
                  </div>
                </div>
                <div style={{ height: 1, background: 'var(--accents-2)' }} />
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--accents-4)' }}>Theme</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button key={t} onClick={() => dispatch({ type: 'SET_THEME', theme: t })}
                        className="rounded-xl border py-3 text-[12px] font-medium transition-all capitalize"
                        style={state.theme === t
                          ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent)' }
                          : { borderColor: 'var(--accents-2)', color: 'var(--accents-5)' }
                        }
                      >
                        <div className="text-base mb-0.5">
                          {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '⚙️'}
                        </div>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'account' && <AccountTab />}

            {tab === 'about' && (
              <div className="text-center py-4 space-y-4">
                <div className="text-4xl">🍪</div>
                <div>
                  <h2 className="text-xl font-bold" style={{ letterSpacing: '-0.03em' }}>
                    cookie<span className="text-accent">.io</span>
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--accents-5)' }}>Advanced notepad with real-time collaboration</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--accents-4)' }}>Version 2.0.0</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: 'Total notes', value: state.notes.length },
                    { label: 'Folders', value: state.folders.length },
                    { label: 'Total words', value: state.notes.reduce((a, n) => a + (n.wordCount || 0), 0).toLocaleString() },
                    { label: 'Tags', value: state.tags.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3" style={{ border: '1px solid var(--accents-2)', background: 'var(--accents-1)' }}>
                      <div className="text-xl font-bold mono">{value}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--accents-5)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
