import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Filter, Clock, FileText, Folder, Tag, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api';
import { SearchResult } from '../types';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
  );
}

export function SearchModal() {
  const { state, dispatch } = useApp();
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [folderId, setFolderId]   = useState<string>('all');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookie_recent_searches') || '[]'); }
    catch { return []; }
  });

  const inputRef   = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Focus on open
  useEffect(() => {
    if (state.searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
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
    searchTimer.current = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(searchTimer.current);
  }, [query, doSearch]);

  const saveRecentSearch = useCallback((q: string) => {
    const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('cookie_recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const selectResult = useCallback((result: SearchResult) => {
    dispatch({ type: 'SET_ACTIVE_NOTE', id: result._id });
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
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="modal-panel"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-accents-2">
          {loading
            ? <div className="h-4 w-4 border-2 border-accents-3 border-t-accent rounded-full animate-spin shrink-0" style={{ borderTopColor: 'var(--accent)' }} />
            : <Search className="h-4 w-4 text-accents-5 shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, content, tags…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-accents-4 outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`toolbar-btn ${filtersOpen ? 'active' : ''}`}
              title="Filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: false })}
              className="toolbar-btn"
            >
              <X className="h-3.5 w-3.5" />
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
              transition={{ duration: 0.2 }}
              className="border-b border-accents-2 overflow-hidden"
            >
              <div className="px-4 py-3 flex flex-wrap gap-4">
                {/* Folder filter */}
                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-accents-4" />
                  <span className="text-xs text-accents-5">Folder:</span>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="text-xs bg-accents-1 border border-accents-2 rounded-lg px-2 py-1 text-foreground outline-none focus:border-accent"
                    style={{ '--accent': 'var(--accent)' } as any}
                  >
                    <option value="all">All folders</option>
                    <option value="root">Root (no folder)</option>
                    {state.folders.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Case sensitive */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setCaseSensitive((v) => !v)}
                    className={`w-8 h-4 rounded-full transition-colors ${caseSensitive ? 'bg-accent' : 'bg-accents-2'}`}
                    style={caseSensitive ? { background: 'var(--accent)' } : {}}
                  >
                    <div className={`h-3 w-3 rounded-full bg-white m-0.5 transition-transform ${caseSensitive ? 'translate-x-4' : ''}`} />
                  </div>
                  <span className="text-xs text-accents-5">Case sensitive</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {!query.trim() ? (
            <div className="py-2">
              {recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-accents-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accents-4">Recent searches</span>
                  </div>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-accents-5 hover:bg-accents-1 hover:text-foreground transition-colors"
                    >
                      <Search className="h-3.5 w-3.5 shrink-0" />
                      {s}
                    </button>
                  ))}
                </>
              )}
              {recentSearches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-8 w-8 text-accents-3 mb-3" />
                  <p className="text-sm text-accents-5">Start typing to search your notes</p>
                  <p className="text-xs text-accents-4 mt-1">Search by title, content, or tags</p>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-accents-2 border-t-accent rounded-full animate-spin" style={{ borderTopColor: 'var(--accent)' }} />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-8 w-8 text-accents-3 mb-3" />
              <p className="text-sm text-accents-5">No results for "<strong>{query}</strong>"</p>
              <p className="text-xs text-accents-4 mt-1">Try different keywords or adjust filters</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-accents-4">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-accents-4">↑↓ navigate · ↵ open</span>
              </div>
              {results.map((result, i) => {
                const folder = state.folders.find((f) => f._id === result.folderId);
                return (
                  <motion.button
                    key={result._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.03 }}
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      i === selectedIdx ? 'bg-accents-1' : 'hover:bg-accents-1'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-accents-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold truncate">
                          {highlightMatch(result.title, query)}
                        </span>
                        {result.isPinned && <span className="text-[10px] text-accent font-mono">📌</span>}
                      </div>
                      {result.snippet && (
                        <p className="text-xs text-accents-5 line-clamp-2 leading-relaxed">
                          {highlightMatch(result.snippet, query)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {folder && (
                          <span className="flex items-center gap-1 text-[10px] text-accents-4">
                            <Folder className="h-2.5 w-2.5" style={{ color: folder.color }} />
                            {folder.name}
                          </span>
                        )}
                        {result.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag-pill text-[10px] py-0">
                            {highlightMatch(tag, query)}
                          </span>
                        ))}
                        <span className="text-[10px] text-accents-4 font-mono ml-auto">
                          {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 transition-opacity ${i === selectedIdx ? 'opacity-100 text-accent' : 'opacity-0'}`}
                      style={i === selectedIdx ? { color: 'var(--accent)' } : {}} />
                  </motion.button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-accents-2 px-4 py-2.5 flex items-center gap-4 text-[10px] text-accents-4">
          <span className="flex items-center gap-1"><kbd className="rounded border border-accents-2 bg-accents-1 px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-accents-2 bg-accents-1 px-1 py-0.5 font-mono">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-accents-2 bg-accents-1 px-1 py-0.5 font-mono">esc</kbd> close</span>
        </div>
      </motion.div>
    </div>
  );
}
