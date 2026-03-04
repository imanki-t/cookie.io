import React, { useState } from 'react';
import { X, Type, Palette, Zap, Hash, User, Lock, Loader2, Check, Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_SETTINGS, FontFamily, Settings as SettingsType, ViewMode, Theme } from '../types';
import { UserAvatar } from './Logo';
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

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'editor',     label: 'Editor',     icon: <Type size={16} /> },
  { id: 'appearance', label: 'Look',       icon: <Palette size={16} /> },
  { id: 'account',    label: 'Account',    icon: <User size={16} /> },
  { id: 'about',      label: 'About',      icon: <Hash size={16} /> },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="settings-section-title">{children}</h3>
  );
}

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      className="settings-toggle-row"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <div className="flex-1 text-left">
        <p className="settings-toggle-label">{label}</p>
        {sub && <p className="settings-toggle-sub">{sub}</p>}
      </div>
      <div className={`toggle-track ${checked ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </button>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, format }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="settings-slider-row">
      <div className="flex items-center justify-between mb-2">
        <span className="settings-slider-label">{label}</span>
        <span className="settings-slider-value">{format ? format(value) : value}</span>
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
  const [passOpen, setPassOpen] = useState(false);

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
      setPassMsg('Password changed!');
      setCurrPass(''); setNewPass('');
      setTimeout(() => { setPassMsg(''); setPassOpen(false); }, 2000);
    } catch (e: any) { setPassError(e.message); }
    setChangingPass(false);
  };

  return (
    <div className="settings-tab-content">
      {/* Profile card */}
      <div className="profile-card">
        <UserAvatar username={username} size={52} />
        <div className="min-w-0 flex-1">
          <p className="profile-card-name">{user?.displayName || user?.username}</p>
          <p className="profile-card-username">@{username}</p>
        </div>
      </div>

      <SectionTitle>Display Name</SectionTitle>
      <div className="settings-input-group">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
          className="settings-input"
          maxLength={32}
        />
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="settings-save-btn"
        >
          {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saveMsg || 'Save'}
        </button>
      </div>

      {/* Password section */}
      <button
        className="settings-collapsible-header"
        onClick={() => setPassOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Lock size={14} style={{ color: 'var(--accents-5)' }} />
          <span>Change Password</span>
        </div>
        <ChevronRight
          size={14}
          style={{
            color: 'var(--accents-4)',
            transform: passOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence>
        {passOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <form onSubmit={handleChangePass} className="settings-pass-form">
              <input
                type="password" value={currPass}
                onChange={(e) => setCurrPass(e.target.value)}
                placeholder="Current password"
                className="settings-input"
              />
              <input
                type="password" value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="settings-input"
              />
              {passError && <p className="settings-error">{passError}</p>}
              {passMsg && <p className="settings-success">{passMsg}</p>}
              <button
                type="submit"
                disabled={changingPass || !currPass || !newPass}
                className="settings-save-btn"
              >
                {changingPass ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                Update password
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign out */}
      <div className="settings-danger-zone">
        <button
          onClick={() => { dispatch({ type: 'SET_SETTINGS_OPEN', open: false }); logout(); }}
          className="settings-danger-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { state, dispatch } = useApp();
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  const s = state.settings;

  const themes: { value: Theme; icon: React.ReactNode; label: string; desc: string }[] = [
    { value: 'dark',   icon: <Moon size={20} />,    label: 'Dark',   desc: 'Easy on the eyes' },
    { value: 'light',  icon: <Sun size={20} />,     label: 'Light',  desc: 'Bright workspace' },
    { value: 'system', icon: <Monitor size={20} />, label: 'System', desc: 'Follows OS setting' },
  ];

  return (
    <div className="settings-tab-content">
      {/* Theme — prominent at top */}
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
              <div className="theme-card-check">
                <Check size={10} />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="settings-divider" />

      <SectionTitle>Accent Color</SectionTitle>
      <div className="accent-grid">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.name}
            onClick={() => up({ accentColor: c.value })}
            className="accent-swatch"
            style={{
              background: c.value,
              borderColor: s.accentColor === c.value ? 'var(--fg)' : 'transparent',
              boxShadow: s.accentColor === c.value ? `0 0 0 3px ${c.value}40` : 'none',
            }}
          >
            {s.accentColor === c.value && <Check size={13} color="white" style={{ margin: 'auto' }} />}
          </button>
        ))}
      </div>

      <div className="custom-color-row">
        <span className="settings-label">Custom color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={s.accentColor}
            onChange={(e) => up({ accentColor: e.target.value })}
            className="color-input-native"
          />
          <span className="settings-mono-text">{s.accentColor}</span>
        </div>
      </div>
    </div>
  );
}

function EditorTab() {
  const { state, dispatch } = useApp();
  const up = (patch: Partial<SettingsType>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });
  const s = state.settings;

  return (
    <div className="settings-tab-content">
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

      <div className="settings-divider" />

      <SectionTitle>Typography</SectionTitle>
      <div className="sliders-list">
        <SliderRow
          label="Font size"
          value={s.fontSize} min={11} max={24}
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
        <SliderRow
          label="Autosave delay"
          value={s.autosaveDelay} min={500} max={5000} step={500}
          onChange={(v) => up({ autosaveDelay: v })}
          format={(v) => `${(v / 1000).toFixed(1)}s`}
        />
      </div>

      <div className="settings-divider" />

      <SectionTitle>Behavior</SectionTitle>
      <div className="toggles-list">
        <ToggleRow
          label="Spell check"
          sub="Highlight misspelled words"
          checked={s.spellCheck}
          onChange={(v) => up({ spellCheck: v })}
        />
        <ToggleRow
          label="Word count"
          sub="Show in editor toolbar"
          checked={s.showWordCount}
          onChange={(v) => up({ showWordCount: v })}
        />
      </div>

      <div className="settings-divider" />

      <SectionTitle>Default View</SectionTitle>
      <div className="view-mode-grid">
        {(['edit', 'preview', 'split'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => up({ defaultView: m })}
            className={`view-mode-btn ${s.defaultView === m ? 'active' : ''}`}
          >
            {m === 'edit' ? '✏️' : m === 'preview' ? '👁' : '⊟'}
            <span>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AboutTab() {
  const { state } = useApp();
  const { dispatch } = useApp();
  const totalWords = state.notes.reduce((a, n) => a + (n.wordCount || 0), 0);

  return (
    <div className="settings-tab-content">
      <div className="about-hero">
        <div className="text-5xl mb-3">🍪</div>
        <h2 className="about-title">cookie<span className="text-accent">.io</span></h2>
        <p className="about-subtitle">Advanced notepad with real-time collaboration</p>
        <span className="about-version">v2.0.0</span>
      </div>

      <div className="about-stats">
        {[
          { label: 'Notes', value: state.notes.length, icon: '📝' },
          { label: 'Folders', value: state.folders.length, icon: '📁' },
          { label: 'Words', value: totalWords.toLocaleString(), icon: '📖' },
          { label: 'Tags', value: state.tags.length, icon: '🏷️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="about-stat">
            <span className="about-stat-icon">{icon}</span>
            <span className="about-stat-value">{value}</span>
            <span className="about-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: 'UPDATE_SETTINGS', settings: DEFAULT_SETTINGS })}
        className="settings-reset-btn"
      >
        Reset all settings to defaults
      </button>
    </div>
  );
}

export function SettingsModal() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<Tab>('editor');

  if (!state.settingsOpen) return null;

  return (
    <div
      className="modal-backdrop settings-backdrop"
      onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="settings-drag-handle" />

        {/* Header */}
        <div className="settings-header">
          <span className="settings-header-title">Settings</span>
          <button
            onClick={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}
            className="settings-close-btn"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="settings-tab-icon">{t.icon}</span>
              <span className="settings-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'editor'     && <EditorTab />}
              {tab === 'appearance' && <AppearanceTab />}
              {tab === 'account'    && <AccountTab />}
              {tab === 'about'      && <AboutTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
