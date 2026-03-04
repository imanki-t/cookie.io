import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'cookie-io-secret-change-in-prod-2025';
const JWT_EXPIRES = '30d';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

app.use(cors({ origin: isDev ? '*' : false, credentials: true }));
app.use(express.json({ limit: '50mb' })); // larger limit for base64 images

if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// ═══════════════════════════════════════════════════════════
//  MONGODB MODELS
// ═══════════════════════════════════════════════════════════

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 32 },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  accentColor: { type: String, default: '#f59e0b' },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
});

const folderSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true, trim: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  color:    { type: String, default: '#f59e0b' },
  icon:     { type: String, default: 'folder' },
  order:    { type: Number, default: 0 },
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, default: 'Untitled Note', trim: true },
  content:   { type: String, default: '' },
  folderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  tags:      [{ type: String, trim: true }],
  isPinned:  { type: Boolean, default: false },
  color:     { type: String, default: null },
  wordCount: { type: Number, default: 0 },
  charCount: { type: Number, default: 0 },
  order:     { type: Number, default: 0 },
  images:    [{ id: String, data: String, mimeType: String, name: String }],
}, { timestamps: true });

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const User   = mongoose.model('User',   userSchema);
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
//  AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ═══════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 2) return res.status(400).json({ error: 'Username too short (min 2 chars)' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6 chars)' });

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.toLowerCase(),
      password: hashed,
      displayName: displayName || username,
    });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, displayName: user.displayName, accentColor: user.accentColor },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({
      token,
      user: { id: user._id, username: user.username, displayName: user.displayName, accentColor: user.accentColor, settings: user.settings },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, username: user.username, displayName: user.displayName, accentColor: user.accentColor, settings: user.settings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, accentColor, settings } = req.body;
    const update = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (accentColor !== undefined) update.accentColor = accentColor;
    if (settings !== undefined) update.settings = settings;
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    res.json({ id: user._id, username: user.username, displayName: user.displayName, accentColor: user.accentColor, settings: user.settings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short (min 6 chars)' });

    const user = await User.findById(req.userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.userId, { password: hashed });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  WEBSOCKET — Real-time collaboration
// ═══════════════════════════════════════════════════════════

const noteRooms = new Map();

function broadcastToRoom(noteId, message, excludeWs = null) {
  const room = noteRooms.get(noteId);
  if (!room) return;
  const data = JSON.stringify(message);
  room.forEach(({ ws }) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) ws.send(data);
  });
}

function getRoomUsers(noteId) {
  const room = noteRooms.get(noteId);
  if (!room) return [];
  return Array.from(room).map(({ userId, userName, color }) => ({ userId, userName, color }));
}

const USER_COLORS = ['#f59e0b','#10b981','#3b82f6','#e879f9','#ef4444','#06b6d4','#84cc16','#f97316'];

wss.on('connection', (ws) => {
  let currentNoteId = null;
  let currentUser = null;

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    switch (msg.type) {
      case 'join_note': {
        if (currentNoteId && currentUser) {
          const oldRoom = noteRooms.get(currentNoteId);
          if (oldRoom) {
            oldRoom.forEach((u) => { if (u.userId === currentUser.userId) oldRoom.delete(u); });
            if (oldRoom.size === 0) noteRooms.delete(currentNoteId);
          }
          broadcastToRoom(currentNoteId, { type: 'user_left', userId: currentUser.userId, users: getRoomUsers(currentNoteId) });
        }
        currentNoteId = msg.noteId;
        const colorIdx = Math.floor(Math.random() * USER_COLORS.length);
        currentUser = { ws, userId: msg.userId || uuidv4(), userName: msg.userName || 'Anonymous', color: USER_COLORS[colorIdx], cursor: null };
        if (!noteRooms.has(currentNoteId)) noteRooms.set(currentNoteId, new Set());
        noteRooms.get(currentNoteId).add(currentUser);
        ws.send(JSON.stringify({ type: 'room_joined', userId: currentUser.userId, color: currentUser.color, users: getRoomUsers(currentNoteId) }));
        broadcastToRoom(currentNoteId, { type: 'user_joined', user: { userId: currentUser.userId, userName: currentUser.userName, color: currentUser.color }, users: getRoomUsers(currentNoteId) }, ws);
        break;
      }
      case 'note_update': {
        if (!currentNoteId) break;
        try {
          const wc = msg.content ? msg.content.trim().split(/\s+/).filter(Boolean).length : 0;
          await Note.findByIdAndUpdate(currentNoteId, { title: msg.title || 'Untitled Note', content: msg.content || '', tags: msg.tags || [], wordCount: wc, charCount: (msg.content || '').length });
          broadcastToRoom(currentNoteId, { type: 'note_update', noteId: currentNoteId, title: msg.title, content: msg.content, tags: msg.tags, userId: currentUser?.userId }, ws);
        } catch (e) { console.error('note_update error:', e.message); }
        break;
      }
      case 'cursor_update': {
        if (!currentNoteId || !currentUser) break;
        currentUser.cursor = msg.position;
        broadcastToRoom(currentNoteId, { type: 'cursor_update', userId: currentUser.userId, userName: currentUser.userName, color: currentUser.color, position: msg.position }, ws);
        break;
      }
      case 'leave_note': {
        if (currentNoteId && currentUser) {
          const room = noteRooms.get(currentNoteId);
          if (room) { room.forEach((u) => { if (u.userId === currentUser.userId) room.delete(u); }); if (room.size === 0) noteRooms.delete(currentNoteId); }
          broadcastToRoom(currentNoteId, { type: 'user_left', userId: currentUser.userId, users: getRoomUsers(currentNoteId) });
        }
        currentNoteId = null; currentUser = null;
        break;
      }
    }
  });

  ws.on('close', () => {
    if (currentNoteId && currentUser) {
      const room = noteRooms.get(currentNoteId);
      if (room) { room.forEach((u) => { if (u.userId === currentUser.userId) room.delete(u); }); if (room.size === 0) noteRooms.delete(currentNoteId); }
      broadcastToRoom(currentNoteId, { type: 'user_left', userId: currentUser.userId, users: getRoomUsers(currentNoteId) });
    }
  });

  ws.on('error', (err) => console.error('WS error:', err.message));
});

// ═══════════════════════════════════════════════════════════
//  FOLDER ROUTES (protected)
// ═══════════════════════════════════════════════════════════

app.get('/api/folders', authMiddleware, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.userId }).sort({ order: 1, createdAt: 1 });
    res.json(folders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/folders', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.create({ ...req.body, userId: req.userId });
    res.status(201).json(folder);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/folders/:id', authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/folders/:id', authMiddleware, async (req, res) => {
  try {
    const folderId = req.params.id;
    await Note.updateMany({ folderId, userId: req.userId }, { folderId: null });
    const childFolders = await Folder.find({ parentId: folderId, userId: req.userId });
    for (const child of childFolders) {
      await Note.updateMany({ folderId: child._id, userId: req.userId }, { folderId: null });
      await Folder.findByIdAndDelete(child._id);
    }
    await Folder.findOneAndDelete({ _id: folderId, userId: req.userId });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  NOTE ROUTES (protected)
// ═══════════════════════════════════════════════════════════

app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const filter = { userId: req.userId };
    if (req.query.folderId === 'null' || req.query.folderId === 'root') filter.folderId = null;
    else if (req.query.folderId) filter.folderId = req.query.folderId;
    if (req.query.tag) filter.tags = req.query.tag;
    const notes = await Note.find(filter).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes/all', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ isPinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes/recent', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(8);
    res.json(notes);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  try {
    const note = await Note.create({ ...req.body, userId: req.userId });
    res.status(201).json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.content !== undefined) {
      body.wordCount = body.content.trim().split(/\s+/).filter(Boolean).length;
      body.charCount = body.content.length;
    }
    const note = await Note.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, body, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/notes/:id/move', authMiddleware, async (req, res) => {
  try {
    const { folderId } = req.body;
    const note = await Note.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { folderId: folderId || null }, { new: true });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Image upload (base64)
app.post('/api/notes/:id/images', authMiddleware, async (req, res) => {
  try {
    const { data, mimeType, name } = req.body;
    if (!data) return res.status(400).json({ error: 'No image data' });
    const imageId = uuidv4();
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $push: { images: { id: imageId, data, mimeType: mimeType || 'image/png', name: name || 'image' } } },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ id: imageId, url: `data:${mimeType || 'image/png'};base64,${data}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
//  SEARCH + TAGS + STATS (protected)
// ═══════════════════════════════════════════════════════════

app.get('/api/search', authMiddleware, async (req, res) => {
  try {
    const { q, folderId, tag, caseSensitive } = req.query;
    if (!q || q.trim().length === 0) return res.json([]);
    const filter = { userId: req.userId };
    const opts = caseSensitive === 'true' ? '' : 'i';
    filter.$or = [
      { title:   { $regex: q, $options: opts } },
      { content: { $regex: q, $options: opts } },
      { tags:    { $regex: q, $options: opts } },
    ];
    if (folderId && folderId !== 'all') filter.folderId = folderId === 'root' ? null : new mongoose.Types.ObjectId(folderId);
    if (tag) filter.tags = tag;
    const notes = await Note.find(filter).sort({ updatedAt: -1 }).limit(50);
    const results = notes.map((note) => {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive === 'true' ? 'g' : 'gi');
      const idx = note.content.search(regex);
      const snippet = idx === -1 ? note.content.slice(0, 120) : ((idx > 0 ? '…' : '') + note.content.slice(Math.max(0, idx - 40), Math.min(note.content.length, idx + 120)) + (idx + 120 < note.content.length ? '…' : ''));
      return { _id: note._id, title: note.title, content: note.content, folderId: note.folderId, tags: note.tags, isPinned: note.isPinned, wordCount: note.wordCount, updatedAt: note.updatedAt, createdAt: note.createdAt, snippet };
    });
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tags', authMiddleware, async (req, res) => {
  try {
    const tags = await Note.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(tags.map((t) => ({ name: t._id, count: t.count })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const [noteCount, folderCount, wordStats, pinned] = await Promise.all([
      Note.countDocuments({ userId: uid }),
      Folder.countDocuments({ userId: uid }),
      Note.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, totalWords: { $sum: '$wordCount' }, totalChars: { $sum: '$charCount' } } }]),
      Note.countDocuments({ userId: uid, isPinned: true }),
    ]);
    res.json({ noteCount, folderCount, pinnedCount: pinned, totalWords: wordStats[0]?.totalWords || 0, totalChars: wordStats[0]?.totalChars || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Catch-all ──
if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🍪 cookie.io v2 server running on http://localhost:${PORT}`);
  console.log(`🔑 Auth: JWT (30-day tokens)`);
  console.log(`🔌 WebSocket server ready`);
});
