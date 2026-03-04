import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Filter, Clock, FileText, Folder } from 'lucide-react';
import { api } from '../services/api';
import { SearchResult } from '../types';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
}

export function SearchModal() {
  const { state, dispatch } = useApp();
  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState<SearchResult[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [folderId,      setFolderId]      = useState<string>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [selectedIdx,   setSelectedIdx]   = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookie_recent_searches') || '[]'); }
    catch { return []; }
  });

  const inputRef    = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (state.searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
    }
  }, [state.searchOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.search(q, {
        folderId: folderId === 'all' ? undefined : folderId,
        caseSensitive,
      });
      setResults(res);
      setSelectedIdx(0);
    } catch {}
    finally { setLoading(false); }
  }, [folderId, caseSensitive]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(query), 220);
    return () => clearTimeout(searchTimer.current);
  }, [query, doSearch]);

  const saveRecentSearch = useCallback((q: string) => {
    const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('cookie_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const selectResult = useCallback((result: SearchResult) => {
    dispatch({ type: 'SET_ACTIVE_NOTE',  id: result._id });
    dispatch({ type: 'SET_SEARCH_OPEN', open: false });
    if (result.folderId) dispatch({ type: 'SET_ACTIVE_FOLDER', id: result.folderId });
    if (query.trim()) saveRecentSearch(query);
  }, [dispatch, query, saveRecentSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { dispatch({ type: 'SET_SEARCH_OPEN', open: false }); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) selectResult(results[selectedIdx]);
  }, [dispatch, results, selectedIdx, selectResult]);

  if (!state.searchOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: false })}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="search-input-wrapper">
          {loading ? (
            <div style={{
              width: 14, height: 14, border: '1.5px solid var(--accents-3)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite', flexShrink: 0,
            }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" style={{ color: 'var(--accents-5)', flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          )}
          <input
            ref={inputRef}
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, content, tags…"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              className={`toolbar-btn ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen((v) => !v)}
              title="Filters"
            >
              <Filter size={12} />
            </button>
            <button
              className="toolbar-btn"
              onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: false })}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', borderBottom: '1px solid var(--accents-2)' }}
            >
              <div style={{ padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {/* Folder filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Folder size={11} style={{ color: 'var(--accents-4)' }} />
                  <span style={{ fontSize: 11, color: 'var(--accents-5)' }}>Folder:</span>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    style={{
                      fontSize: 11,
                      background: 'var(--accents-1)',
                      border: '1px solid var(--accents-2)',
                      borderRadius: 'var(--r-md)',
                      padding: '3px 8px',
                      color: 'var(--fg)',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All folders</option>
                    <option value="root">Root</option>
                    {state.folders.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Case sensitive toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div
                    onClick={() => setCaseSensitive((v) => !v)}
                    className={`toggle-track ${caseSensitive ? 'on' : ''}`}
                    style={{ width: 30, height: 16 }}
                  >
                    <div className="toggle-thumb" style={{ width: 10, height: 10, top: 3, left: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accents-5)' }}>Case sensitive</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results area */}
        <div style={{ overflowY: 'auto', maxHeight: '55vh' }}>
          {!query.trim() ? (
            <div style={{ padding: '6px 0' }}>
              {recentSearches.length > 0 ? (
                <>
                  <div style={{
                    padding: '8px 14px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--accents-4)',
                  }}>
                    <Clock size={11} />
                    Recent
                  </div>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 14px',
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12.5,
                        color: 'var(--accents-5)',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accents-1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
                        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      {s}
                    </button>
                  ))}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', textAlign: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 15 15" fill="none" style={{ color: 'var(--accents-3)', marginBottom: 10 }}>
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: 12.5, color: 'var(--accents-5)' }}>Start typing to search</p>
                  <p style={{ fontSize: 11, color: 'var(--accents-4)', marginTop: 3 }}>Search by title, content, or tags</p>
                </div>
              )}
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
              <div style={{
                width: 20, height: 20,
                border: '2px solid var(--accents-2)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', textAlign: 'center' }}>
              <FileText size={28} style={{ color: 'var(--accents-3)', marginBottom: 10 }} />
              <p style={{ fontSize: 12.5, color: 'var(--accents-5)' }}>No results for "<strong>{query}</strong>"</p>
              <p style={{ fontSize: 11, color: 'var(--accents-4)', marginTop: 3 }}>Try different keywords</p>
            </div>
          ) : (
            <>
              <div style={{
                padding: '8px 14px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accents-4)',
              }}>
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                <span style={{ letterSpacing: 0, fontWeight: 400, textTransform: 'none', fontSize: 10 }}>
                  ↑↓ navigate · ↵ open
                </span>
              </div>
              {results.map((result, i) => {
                const folder = state.folders.find((f) => f._id === result.folderId);
                return (
                  <motion.button
                    key={result._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.12, delay: i * 0.025 }}
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className="search-result-item"
                    style={i === selectedIdx ? { background: 'var(--accents-1)' } : {}}
                  >
                    <FileText size={13} style={{ color: 'var(--accents-4)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {highlightMatch(result.title || 'Untitled', query)}
                        </span>
                        {result.isPinned && (
                          <span style={{ fontSize: 10, color: 'var(--accent)' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
                              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24ZM12 17v5"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      {result.snippet && (
                        <p style={{
                          fontSize: 11, color: 'var(--accents-5)', lineHeight: 1.4,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: 4,
                        }}>
                          {highlightMatch(result.snippet, query)}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {folder && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--accents-4)' }}>
                            <Folder size={9} style={{ color: folder.color }} />
                            {folder.name}
                          </span>
                        )}
                        {result.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="tag-pill" style={{ fontSize: 9, padding: '1px 5px' }}>
                            {highlightMatch(tag, query)}
                          </span>
                        ))}
                        <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--accents-4)' }}>
                          {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <svg
                      width="11" height="11" viewBox="0 0 15 15" fill="none"
                      style={{
                        color: i === selectedIdx ? 'var(--accent)' : 'transparent',
                        flexShrink: 0, marginTop: 1, transition: 'color 0.1s',
                      }}
                    >
                      <path d="M6 3l6 4.5L6 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--accents-2)',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 10,
          color: 'var(--accents-4)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd className="kbd">↑↓</kbd> navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd className="kbd">↵</kbd> open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd className="kbd">esc</kbd> close
          </span>
        </div>
      </motion.div>
    </div>
  );
}
