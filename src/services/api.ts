import { Folder, Note, SearchResult, Stats, Tag } from '../types';

const BASE = '/api';
const TOKEN_KEY = 'cookie_auth_token';

function getToken() { return localStorage.getItem(TOKEN_KEY); }

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + url, {
    headers: { ...headers, ...(opts.headers as any) },
    ...opts,
  });

  if (res.status === 401) {
    // Token expired — clear and reload to auth page
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cookie_auth_user');
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  folders: {
    list:   ()                        => req<Folder[]>('/folders'),
    create: (data: Partial<Folder>)   => req<Folder>('/folders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Folder>) => req<Folder>(`/folders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)              => req<{ success: boolean }>(`/folders/${id}`, { method: 'DELETE' }),
  },

  notes: {
    list: (params?: { folderId?: string | null; tag?: string }) => {
      const qs = new URLSearchParams();
      if (params?.folderId !== undefined) qs.set('folderId', params.folderId === null ? 'null' : params.folderId);
      if (params?.tag) qs.set('tag', params.tag);
      return req<Note[]>(`/notes?${qs.toString()}`);
    },
    listAll:  ()                           => req<Note[]>('/notes/all'),
    recent:   ()                           => req<Note[]>('/notes/recent'),
    get:      (id: string)                 => req<Note>(`/notes/${id}`),
    create:   (data: Partial<Note>)        => req<Note>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update:   (id: string, data: Partial<Note>) => req<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete:   (id: string)                 => req<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
    move:     (id: string, folderId: string | null) => req<Note>(`/notes/${id}/move`, { method: 'PATCH', body: JSON.stringify({ folderId }) }),
    addImage: (id: string, data: string, mimeType: string, name: string) =>
      req<{ id: string; url: string }>(`/notes/${id}/images`, { method: 'POST', body: JSON.stringify({ data, mimeType, name }) }),
  },

  search: (q: string, opts?: { folderId?: string; tag?: string; caseSensitive?: boolean }) => {
    const qs = new URLSearchParams({ q });
    if (opts?.folderId) qs.set('folderId', opts.folderId);
    if (opts?.tag) qs.set('tag', opts.tag);
    if (opts?.caseSensitive) qs.set('caseSensitive', 'true');
    return req<SearchResult[]>(`/search?${qs.toString()}`);
  },

  tags:  ()           => req<Tag[]>('/tags'),
  stats: ()           => req<Stats>('/stats'),
};
