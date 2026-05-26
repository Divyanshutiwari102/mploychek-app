const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'mploychek_secret_key_2026';
const DB_PATH = path.join(__dirname, 'db.json');

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── DB Helpers ───────────────────────────────────────────────────────────────
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// ─── Delay Middleware ─────────────────────────────────────────────────────────
// Accepts ?delay=<ms> query param to simulate async latency
const simulateDelay = (req, res, next) => {
  const delay = parseInt(req.query.delay) || 0;
  if (delay > 0 && delay <= 10000) {
    setTimeout(next, delay);
  } else {
    next();
  }
};
app.use(simulateDelay);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ message: 'userId and password are required' });
  }

  const db = readDB();
  const user = db.users.find(u => u.userId === userId);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, userId: user.userId, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      userId: user.userId,
      name: user.name,
      role: user.role,
      department: user.department,
      joinDate: user.joinDate,
      status: user.status
    }
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// ═══════════════════════════════════════════════════════════════════════════════
// RECORDS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/records  — Admin sees all, General User sees only their own
app.get('/api/records', authenticate, (req, res) => {
  const db = readDB();
  let records = db.verificationRecords;
  if (req.user.role !== 'Admin') {
    records = records.filter(r => r.requestedBy === req.user.id);
  }
  res.json({ records, total: records.length, role: req.user.role });
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT ROUTES (Admin only)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/users
app.get('/api/users', authenticate, authorizeAdmin, (req, res) => {
  const db = readDB();
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// POST /api/users
app.post('/api/users', authenticate, authorizeAdmin, async (req, res) => {
  const { userId, password, name, role, department } = req.body;
  if (!userId || !password || !name || !role) {
    return res.status(400).json({ message: 'userId, password, name and role are required' });
  }
  const db = readDB();
  if (db.users.find(u => u.userId === userId)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    userId,
    password: hashed,
    name,
    role,
    department: department || 'General',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  };
  db.users.push(newUser);
  writeDB(db);
  const { password: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticate, authorizeAdmin, async (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });

  const { name, role, department, status, password } = req.body;
  if (name) db.users[idx].name = name;
  if (role) db.users[idx].role = role;
  if (department) db.users[idx].department = department;
  if (status) db.users[idx].status = status;
  if (password) db.users[idx].password = await bcrypt.hash(password, 10);

  writeDB(db);
  const { password: _, ...safeUser } = db.users[idx];
  res.json(safeUser);
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authenticate, authorizeAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' });
  }
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  db.users.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'User deleted successfully' });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => {
  console.log(`MPloyChek API running on http://localhost:${PORT}`);
  console.log('Default credentials: password123');
});
