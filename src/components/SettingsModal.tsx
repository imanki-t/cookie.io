import React, { useState } from 'react';
import {
  X, Type, Palette, Zap, User, Lock,
  Loader2, Check, Moon, Sun, Monitor, ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SETTINGS, FontFamily, Settings as SettingsType, ViewMode, Theme } from '../types';
import { UserAvatar } from './Logo';
import { motion, AnimatePresence } from 'motion/react';

/* ── 18 Accent colors — 9x2 grid ── */
const ACCENT_COLORS = [
  { name: 'Amber',     value: '#d97706' },
  { name: 'Gold',      value: '#f59e0b' },
  { name: 'Orange',    value: '#ea580c' },
  { name: 'Red',       value: '#dc2626' },
  { name: 'Rose',      value: '#e11d48' },
  { name: 'Pink',      value: '#db2777' },
  { name: 'Purple',    value: '#9333ea' },
  { name: 'Indigo',    value: '#4f46e5' },
  { name: 'Blue',      value: '#2563eb' },
  { name: 'Cyan',      value: '#0891b2' },
  { name: 'Teal',      value: '#0d9488' },
  { name: 'Green',     value: '#16a34a' },
  { name: 'Emerald',   value: '#059669' },
  { name: 'Lime',      value: '#65a30d' },
  { name: 'Olive',     value: '#854d0e' },
  { name: 'Slate',     value: '#475569' },
  { name: 'Warm Gray', value: '#78716c' },
  { name: 'Zinc',      value: '#52525b' },
];

const FONT_FAMILIES: { value: FontFamily; label: string; preview: string; css: string }[] = [
  { value: 'geist-sans', label: 'Sans',    preview: 'Ag', css: 'Geist Sans, sans-serif' },
  { value: 'geist-mono', label: 'Mono',    preview: 'Ag', css: 'Geist Mono, monospace' },
  { value: 'serif',      label: 'Serif',   preview: 'Ag', css: 'Georgia, serif' },
  { value: 'cursive',    label: 'Cursive', preview: 'Ag', css: 'cursive' },
];

type Tab = 'editor' | 'appearance' | 'account';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'editor',     label: 'Editor',     icon: <Type size={13} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={13} /> },
  { id: 'account',    label: 'Account',    icon: <User size={13} /> },
];

/* ── Shared sub-components ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="settings-section-title">{children}</p>;
}

function Divider() {
  return <div className="settings-divider" />;
}

function ToggleRow({
  label, sub, checked, onChange,
}: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className="toggle-row"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p className="toggle-label">{label}</p>
        {sub && <p className="toggle-sub">{sub}</p>}
      </div>
      <div className={`toggle-track ${checked ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </button>
  );
}

function SliderRow({
  label, value, min, max, step = 1, onChange, format,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="slider-row">
      <div className="slider-label-row">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="geist-slider"
      />
    </div>
  );
}

/* ── Editor tab ── */
function EditorTab() {
  const { state, dispatch } = useApp();
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  const s  = state.settings;

  return (
    <div className="settings-body">
      <SectionTitle>Font Family</SectionTitle>
      <div className="font-grid">
        {FONT_FAMILIES.map((f) => (
          <button
            key={f.value}
            onClick={() => up({ fontFamily: f.value })}
            className={`font-card ${s.fontFamily === f.value ? 'active' : ''}`}
          >
            <span className="font-card-preview" style={{ fontFamily: f.css }}>{f.preview}</span>
            <span className="font-card-label">{f.label}</span>
          </button>
        ))}
      </div>

      <Divider />
      <SectionTitle>Typography</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SliderRow label="Font size"   value={s.fontSize}   min={11} max={24}          onChange={(v) => up({ fontSize: v })}   format={(v) => `${v}px`} />
        <SliderRow label="Line height" value={s.lineHeight} min={1.2} max={2.4} step={0.1} onChange={(v) => up({ lineHeight: v })} format={(v) => v.toFixed(1)} />
        <SliderRow label="Tab size"    value={s.tabSize}    min={2}  max={8}   step={2}  onChange={(v) => up({ tabSize: v })}   format={(v) => `${v} sp`} />
        <SliderRow label="Autosave"    value={s.autosaveDelay} min={500} max={5000} step={500} onChange={(v) => up({ autosaveDelay: v })} format={(v) => `${(v/1000).toFixed(1)}s`} />
      </div>

      <Divider />
      <SectionTitle>Behavior</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ToggleRow label="Spell check" sub="Highlight misspelled words" checked={s.spellCheck} onChange={(v) => up({ spellCheck: v })} />
      </div>

      <Divider />
      <SectionTitle>Default View</SectionTitle>
      <div className="view-mode-grid">
        {(['edit', 'preview'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => up({ defaultView: m })}
            className={`view-mode-btn ${s.defaultView === m ? 'active' : ''}`}
          >
            {m === 'edit'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            {m === 'preview' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            <span style={{ textTransform: 'capitalize' }}>{m}</span>
          </button>
        ))}
      </div>

      <Divider />

      <button
        className="settings-btn secondary"
        onClick={() => dispatch({ type: 'UPDATE_SETTINGS', settings: DEFAULT_SETTINGS })}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <RotateCcw size={13} />
        Reset to defaults
      </button>
    </div>
  );
}

/* ── Appearance tab ── */
function AppearanceTab() {
  const { state, dispatch } = useApp();
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  const s  = state.settings;

  const themes: { value: Theme; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: 'dark',   icon: <Moon size={19} />,    label: 'Dark',   desc: 'Easy on eyes' },
    { value: 'light',  icon: <Sun size={19} />,     label: 'Light',  desc: 'Bright mode' },
    { value: 'system', icon: <Monitor size={19} />, label: 'System', desc: 'Follows OS' },
  ];

  return (
    <div className="settings-body">
      <SectionTitle>Theme</SectionTitle>
      <div className="theme-cards">
        {themes.map((t) => (
          <button
            key={t.value}
            className={`theme-card ${state.theme === t.value ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_THEME', theme: t.value })}
          >
            <span className="theme-card-icon">{t.icon}</span>
            <span className="theme-card-label">{t.label}</span>
            <span className="theme-card-desc">{t.desc}</span>
            {state.theme === t.value && (
              <span className="theme-check"><Check size={9} /></span>
            )}
          </button>
        ))}
      </div>

      <Divider />
      <SectionTitle>Accent Color — 18 colors</SectionTitle>

      {/* 18 swatches in 9×2 grid */}
      <div className="accent-grid" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.name}
            onClick={() => up({ accentColor: c.value })}
            className={`accent-swatch ${s.accentColor === c.value ? 'active' : ''}`}
            style={{
              background: c.value,
              color: c.value,
              ...(s.accentColor === c.value ? { boxShadow: `0 0 0 3px var(--bg), 0 0 0 5px ${c.value}` } : {}),
            }}
          >
            {s.accentColor === c.value && <Check size={11} color="white" style={{ margin: 'auto' }} />}
          </button>
        ))}
      </div>

      {/* Custom color */}
      <div className="custom-color-row">
        <span style={{ fontSize: 12.5, color: 'var(--accents-5)' }}>Custom color</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="color"
            value={s.accentColor}
            onChange={(e) => up({ accentColor: e.target.value })}
            className="color-input-native"
          />
          <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--accents-4)' }}>
            {s.accentColor}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Account tab ── */
function AccountTab() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { dispatch } = useApp();
  const [displayName,   setDisplayName]   = useState(user?.displayName || '');
  const [saveMsg,       setSaveMsg]       = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currPass,      setCurrPass]      = useState('');
  const [newPass,       setNewPass]       = useState('');
  const [passMsg,       setPassMsg]       = useState('');
  const [passError,     setPassError]     = useState('');
  const [changingPass,  setChangingPass]  = useState(false);
  const [passOpen,      setPassOpen]      = useState(false);

  const username = user?.username || 'anonymous';

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ displayName });
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e: any) { setSaveMsg(e.message); }
    setSavingProfile(false);
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(''); setPassMsg('');
    if (newPass.length < 6) { setPassError('Min 6 characters'); return; }
    setChangingPass(true);
    try {
      await changePassword(currPass, newPass);
      setPassMsg('Password updated');
      setCurrPass(''); setNewPass('');
      setTimeout(() => { setPassMsg(''); setPassOpen(false); }, 2000);
    } catch (e: any) { setPassError(e.message); }
    setChangingPass(false);
  };

  return (
    <div className="settings-body">
      {/* Profile card */}
      <div className="profile-card">
        <UserAvatar username={username} size={50} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="profile-name truncate">{user?.displayName || user?.username}</p>
          <p className="profile-username">@{username}</p>
        </div>
      </div>

      <SectionTitle>Display Name</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <input
          className="settings-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          maxLength={32}
        />
        <button
          className="settings-btn primary"
          onClick={saveProfile}
          disabled={savingProfile}
          style={{ alignSelf: 'flex-start' }}
        >
          {savingProfile ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {saveMsg || 'Save name'}
        </button>
      </div>

      <Divider />

      {/* Change password collapsible */}
      <button className="collapsible-trigger" onClick={() => setPassOpen((v) => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Lock size={14} style={{ color: 'var(--accents-5)' }} />
          <span>Change Password</span>
        </div>
        <ChevronRight
          size={14}
          style={{
            color: 'var(--accents-4)',
            transform: passOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.18s',
          }}
        />
      </button>
      <AnimatePresence>
        {passOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <form
              onSubmit={handleChangePass}
              style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '11px 0 5px' }}
            >
              <input
                type="password"
                className="settings-input"
                value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                placeholder="Current password"
              />
              <input
                type="password"
                className="settings-input"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="New password (min 6 chars)"
              />
              {passError && <p className="form-error">{passError}</p>}
              {passMsg   && <p className="form-success">{passMsg}</p>}
              <button
                type="submit"
                className="settings-btn primary"
                disabled={changingPass || !currPass || !newPass}
                style={{ alignSelf: 'flex-start' }}
              >
                {changingPass ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                Update password
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <Divider />

      <button
        className="settings-btn danger"
        onClick={() => { dispatch({ type: 'SET_SETTINGS_OPEN', open: false }); logout(); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign out
      </button>
    </div>
  );
}

/* ── Main modal ── */
export function SettingsModal() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('editor');

  if (!state.settingsOpen) return null;

  return (
    <div
      className="settings-backdrop"
      onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}
    >
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-drag-handle" />

        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button
            className="settings-close"
            onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}
            aria-label="Close settings"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab bar — 3 tabs only (no About) */}
        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16 }}
            >
              {tab === 'editor'     && <EditorTab />}
              {tab === 'appearance' && <AppearanceTab />}
              {tab === 'account'    && <AccountTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
