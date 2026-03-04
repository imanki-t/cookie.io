import { Folder, Note, SearchResult, Stats, Tag } from '../types';

const BASE = '/api';

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Folders ──────────────────────────────────────────────
export const api = {
  folders: {
    list: () => req<Folder[]>('/folders'),
    create: (data: Partial<Folder>) => req<Folder>('/folders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Folder>) => req<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<{ success: boolean }>(`/folders/${id}`, { method: 'DELETE' }),
  },

  notes: {
    list: (params?: { folderId?: string | null; tag?: string }) => {
      const qs = new URLSearchParams();
      if (params?.folderId !== undefined) qs.set('folderId', params.folderId === null ? 'null' : params.folderId);
      if (params?.tag) qs.set('tag', params.tag);
      return req<Note[]>(`/notes?${qs.toString()}`);
    },
    listAll: () => req<Note[]>('/notes/all'),
    get: (id: string) => req<Note>(`/notes/${id}`),
    create: (data: Partial<Note>) => req<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Note>) => req<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
    move: (id: string, folderId: string | null) => req<Note>(`/notes/${id}/move`, { method: 'PATCH', body: JSON.stringify({ folderId }) }),
  },

  search: (q: string, opts?: { folderId?: string; tag?: string; caseSensitive?: boolean }) => {
    const qs = new URLSearchParams({ q });
    if (opts?.folderId) qs.set('folderId', opts.folderId);
    if (opts?.tag) qs.set('tag', opts.tag);
    if (opts?.caseSensitive) qs.set('caseSensitive', 'true');
    return req<SearchResult[]>(`/search?${qs.toString()}`);
  },

  tags: () => req<Tag[]>('/tags'),
  stats: () => req<Stats>('/stats'),
};
