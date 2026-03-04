import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// In dev allow cross-origin from Vite dev server; in prod same origin
app.use(cors({ origin: isDev ? '*' : false }));
app.use(express.json({ limit: '10mb' }));

// ── Serve built frontend in production ────────────────────────
if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// ═══════════════════════════════════════════════════════════
//  MONGODB MODELS
// ═══════════════════════════════════════════════════════════

const folderSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  color:    { type: String, default: '#f59e0b' },
  icon:     { type: String, default: 'folder' },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  title:     { type: String, default: 'Untitled Note', trim: true },
  content:   { type: String, default: '' },
  folderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  tags:      [{ type: String, trim: true }],
  isPinned:  { type: Boolean, default: false },
  color:     { type: String, default: null },
  wordCount: { type: Number, default: 0 },
  charCount: { type: Number, default: 0 },
  order:     { type: Number, default: 0 },
}, { timestamps: true });

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Folder = mongoose.model('Folder', folderSchema);
const Note   = mongoose.model('Note',   noteSchema);

// ═══════════════════════════════════════════════════════════
//  CONNECT MONGODB
// ═══════════════════════════════════════════════════════════

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cookieio';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message));

// ═══════════════════════════════════════════════════════════
//  WEBSOCKET — Real-time collaboration
// ═══════════════════════════════════════════════════════════

// noteRooms: Map<noteId, Set<{ws, userId, userName, color, cursor}>>
const noteRooms = new Map();

function broadcastToRoom(noteId, message, excludeWs = null) {
  const room = noteRooms.get(noteId);
  if (!room) return;
  const data = JSON.stringify(message);
  room.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function getRoomUsers(noteId) {
  const room = noteRooms.get(noteId);
  if (!room) return [];
  return Array.from(room).map(({ userId, userName, color }) => ({ userId, userName, color }));
}

const USER_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#e879f9',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316',
];

wss.on('connection', (ws) => {
  let currentNoteId = null;
  let currentUser = null;

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return; }

    switch (msg.type) {
      case 'join_note': {
        // Leave old room
        if (currentNoteId && currentUser) {
          const oldRoom = noteRooms.get(currentNoteId);
          if (oldRoom) {
            oldRoom.forEach((u) => { if (u.userId === currentUser.userId) oldRoom.delete(u); });
            if (oldRoom.size === 0) noteRooms.delete(currentNoteId);
          }
          broadcastToRoom(currentNoteId, {
            type: 'user_left',
            userId: currentUser.userId,
            users: getRoomUsers(currentNoteId),
          });
        }

        currentNoteId = msg.noteId;
        const colorIdx = Math.floor(Math.random() * USER_COLORS.length);
        currentUser = {
          ws,
          userId:   msg.userId   || uuidv4(),
          userName: msg.userName || 'Anonymous',
          color:    USER_COLORS[colorIdx],
          cursor:   null,
        };

        if (!noteRooms.has(currentNoteId)) noteRooms.set(currentNoteId, new Set());
        noteRooms.get(currentNoteId).add(currentUser);

        // Send current users to the new joiner
        ws.send(JSON.stringify({
          type:   'room_joined',
          userId: currentUser.userId,
          color:  currentUser.color,
          users:  getRoomUsers(currentNoteId),
        }));

        // Tell everyone else about the new user
        broadcastToRoom(currentNoteId, {
          type:  'user_joined',
          user:  { userId: currentUser.userId, userName: currentUser.userName, color: currentUser.color },
          users: getRoomUsers(currentNoteId),
        }, ws);
        break;
      }

      case 'note_update': {
        if (!currentNoteId) break;
        try {
          const wc = msg.content ? msg.content.trim().split(/\s+/).filter(Boolean).length : 0;
          await Note.findByIdAndUpdate(currentNoteId, {
            title:     msg.title   || 'Untitled Note',
            content:   msg.content || '',
            tags:      msg.tags    || [],
            wordCount: wc,
            charCount: (msg.content || '').length,
          });
          broadcastToRoom(currentNoteId, {
            type:    'note_update',
            noteId:  currentNoteId,
            title:   msg.title,
            content: msg.content,
            tags:    msg.tags,
            userId:  currentUser?.userId,
          }, ws);
        } catch (e) { console.error('note_update error:', e.message); }
        break;
      }

      case 'cursor_update': {
        if (!currentNoteId || !currentUser) break;
        currentUser.cursor = msg.position;
        broadcastToRoom(currentNoteId, {
          type:     'cursor_update',
          userId:   currentUser.userId,
          userName: currentUser.userName,
          color:    currentUser.color,
          position: msg.position,
        }, ws);
        break;
      }

      case 'leave_note': {
        if (currentNoteId && currentUser) {
          const room = noteRooms.get(currentNoteId);
          if (room) {
            room.forEach((u) => { if (u.userId === currentUser.userId) room.delete(u); });
            if (room.size === 0) noteRooms.delete(currentNoteId);
          }
          broadcastToRoom(currentNoteId, {
            type:   'user_left',
            userId: currentUser.userId,
            users:  getRoomUsers(currentNoteId),
          });
        }
        currentNoteId = null;
        currentUser = null;
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentNoteId && currentUser) {
      const room = noteRooms.get(currentNoteId);
      if (room) {
        room.forEach((u) => { if (u.userId === currentUser.userId) room.delete(u); });
        if (room.size === 0) noteRooms.delete(currentNoteId);
      }
      broadcastToRoom(currentNoteId, {
        type:   'user_left',
        userId: currentUser.userId,
        users:  getRoomUsers(currentNoteId),
      });
    }
  });

  ws.on('error', (err) => console.error('WS error:', err.message));
});

// ═══════════════════════════════════════════════════════════
//  FOLDER ROUTES
// ═══════════════════════════════════════════════════════════

app.get('/api/folders', async (req, res) => {
  try {
    const folders = await Folder.find().sort({ order: 1, createdAt: 1 });
    res.json(folders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/folders', async (req, res) => {
  try {
    const folder = await Folder.create(req.body);
    res.status(201).json(folder);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/folders/:id', async (req, res) => {
  try {
    const folder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    const folderId = req.params.id;
    // Move all notes in this folder to root
    await Note.updateMany({ folderId }, { folderId: null });
    // Delete child folders recursively (simple: just move their notes too)
    const childFolders = await Folder.find({ parentId: folderId });
    for (const child of childFolders) {
      await Note.updateMany({ folderId: child._id }, { folderId: null });
      await Folder.findByIdAndDelete(child._id);
    }
    await Folder.findByIdAndDelete(folderId);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  NOTE ROUTES
// ═══════════════════════════════════════════════════════════

app.get('/api/notes', async (req, res) => {
  try {
    const filter = {};
    if (req.query.folderId === 'null' || req.query.folderId === 'root') {
      filter.folderId = null;
    } else if (req.query.folderId) {
      filter.folderId = req.query.folderId;
    }
    if (req.query.tag) filter.tags = req.query.tag;
    const notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes/all', async (req, res) => {
  try {
    const notes = await Note.find().sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notes', async (req, res) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/notes/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.content !== undefined) {
      body.wordCount = body.content.trim().split(/\s+/).filter(Boolean).length;
      body.charCount = body.content.length;
    }
    const note = await Note.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Move note to folder
app.patch('/api/notes/:id/move', async (req, res) => {
  try {
    const { folderId } = req.body;
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { folderId: folderId || null },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  SEARCH ROUTE
// ═══════════════════════════════════════════════════════════

app.get('/api/search', async (req, res) => {
  try {
    const { q, folderId, tag, caseSensitive } = req.query;
    if (!q || q.trim().length === 0) return res.json([]);

    const filter = {};

    // Text search
    if (caseSensitive === 'true') {
      filter.$or = [
        { title:   { $regex: q, $options: '' } },
        { content: { $regex: q, $options: '' } },
        { tags:    { $regex: q, $options: '' } },
      ];
    } else {
      filter.$or = [
        { title:   { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags:    { $regex: q, $options: 'i' } },
      ];
    }

    if (folderId && folderId !== 'all') {
      filter.folderId = folderId === 'root' ? null : new mongoose.Types.ObjectId(folderId);
    }
    if (tag) filter.tags = tag;

    const notes = await Note.find(filter).sort({ updatedAt: -1 }).limit(50);

    // Highlight snippets
    const results = notes.map((note) => {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive === 'true' ? 'g' : 'gi');
      const contentSnippet = (() => {
        const idx = note.content.search(regex);
        if (idx === -1) return note.content.slice(0, 120);
        const start = Math.max(0, idx - 40);
        const end   = Math.min(note.content.length, idx + 120);
        return (start > 0 ? '…' : '') + note.content.slice(start, end) + (end < note.content.length ? '…' : '');
      })();
      return {
        _id:         note._id,
        title:       note.title,
        content:     note.content,
        folderId:    note.folderId,
        tags:        note.tags,
        isPinned:    note.isPinned,
        wordCount:   note.wordCount,
        updatedAt:   note.updatedAt,
        createdAt:   note.createdAt,
        snippet:     contentSnippet,
      };
    });

    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  TAGS ROUTE
// ═══════════════════════════════════════════════════════════

app.get('/api/tags', async (req, res) => {
  try {
    const tags = await Note.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(tags.map((t) => ({ name: t._id, count: t.count })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  STATS ROUTE
// ═══════════════════════════════════════════════════════════

app.get('/api/stats', async (req, res) => {
  try {
    const [noteCount, folderCount, wordStats] = await Promise.all([
      Note.countDocuments(),
      Folder.countDocuments(),
      Note.aggregate([{ $group: { _id: null, totalWords: { $sum: '$wordCount' }, totalChars: { $sum: '$charCount' } } }]),
    ]);
    const pinned = await Note.countDocuments({ isPinned: true });
    res.json({
      noteCount,
      folderCount,
      pinnedCount: pinned,
      totalWords: wordStats[0]?.totalWords || 0,
      totalChars: wordStats[0]?.totalChars || 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Catch-all: serve index.html for client-side routing (production) ──
if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🍪 cookie.io server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});
