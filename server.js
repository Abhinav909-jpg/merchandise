const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
let Database;
const path = require('path');

const PORT = process.env.PORT || 8000;
const app = express();
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// initialize data directory and SQLite DB
// We attempt to use the filesystem. If it fails (read-only, Vercel, etc.), we fall back to memory.
let useMemory = !!process.env.VERCEL; // Default to true if Vercel env is detected

if (!useMemory) {
  try {
    fs.ensureDirSync(DATA_DIR);
  } catch (e) {
    console.warn('Could not create data dir, switching to in-memory mode:', e.message);
    useMemory = true;
  }
}

const DB_FILE = path.join(DATA_DIR, 'database.sqlite');
let db;
let usingSqlite = false;

// In-memory fallback
let MEMORY_USERS = {};
let MEMORY_ORDERS = [];

// Try to use better-sqlite3 if available and NOT in memory mode.
if (!useMemory) {
  try {
    Database = require('better-sqlite3');
    db = new Database(DB_FILE);
    usingSqlite = true;
    // Create tables if missing
    db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    items TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL
  );
  `);
    // Ensure default user exists
    const userExists = db.prepare('SELECT 1 FROM users WHERE email = ?').get('user@example.com');
    if (!userExists) {
      const hashed = bcrypt.hashSync('password123', 10);
      db.prepare('INSERT INTO users(email,password_hash) VALUES (?,?)').run('user@example.com', hashed);
    }
  } catch (e) {
    console.warn('better-sqlite3 not present or failed to initialize — falling back to JSON files.');
    usingSqlite = false;
    // ensure JSON files exist
    try {
      fs.ensureFileSync(USERS_FILE);
      fs.ensureFileSync(ORDERS_FILE);
      if (fs.readFileSync(USERS_FILE, 'utf8').trim() === '') fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
      if (fs.readFileSync(ORDERS_FILE, 'utf8').trim() === '') fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
    } catch (err) {
      console.warn('File system is read-only, switching to in-memory mode.');
      useMemory = true;
    }
  }
}

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Simple in-memory products list - same data as previous PHP
const PRODUCTS = [
  { id: 1, name: 'DHH Hoodie', price: 2500, image: 'images/hoodie.png' },
  { id: 2, name: 'DHH Cap', price: 1200, image: 'images/cap.png' },
  { id: 3, name: 'DHH T-Shirt', price: 1500, image: 'images/tshirt.png' }
];

// helper to read and write files
function readUsers() {
  if (useMemory) return MEMORY_USERS;
  if (usingSqlite) {
    const rows = db.prepare('SELECT email, password_hash FROM users').all();
    const obj = {};
    rows.forEach(r => obj[r.email] = r.password_hash);
    return obj;
  }
  // fallback to JSON
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}'); } catch (e) { return MEMORY_USERS; }
}
function writeUsers(obj) {
  if (useMemory) { MEMORY_USERS = obj; return; }
  if (usingSqlite) {
    const insert = db.prepare('INSERT OR REPLACE INTO users(email,password_hash) VALUES (?,?)');
    const trx = db.transaction((items) => {
      for (const [email, hash] of Object.entries(items)) insert.run(email, hash);
    });
    trx(obj);
    return;
  }
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2), 'utf8'); } catch (e) { MEMORY_USERS = obj; useMemory = true; }
}
function readOrders() {
  if (useMemory) return MEMORY_ORDERS;
  if (usingSqlite) {
    return db.prepare('SELECT id, user, items, time, status FROM orders ORDER BY id ASC').all();
  }
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]'); } catch (e) { return MEMORY_ORDERS; }
}
function addOrder(user, items, time, status) {
  if (useMemory) {
    const id = MEMORY_ORDERS.length + 1;
    const entry = { id, user, items, time, status }; // items is already object
    MEMORY_ORDERS.push(entry);
    return entry;
  }
  if (usingSqlite) {
    const stmt = db.prepare('INSERT INTO orders (user, items, time, status) VALUES (?,?,?,?)');
    return stmt.run(user, JSON.stringify(items), time, status);
  }
  const orders = readOrders();
  const id = (orders.length ? (Math.max(...orders.map(o => o.id || 0)) + 1) : 1);
  const entry = { id, user, items: JSON.stringify(items), time, status };
  // keep old orders.json format compatibility (items as object) — store in a simple form
  orders.push({ id, user, items, time, status });
  try { fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8'); } catch (e) { MEMORY_ORDERS = orders; useMemory = true; }
  return entry;
}

// API endpoints
app.get('/api/products', (req, res) => {
  res.json(PRODUCTS);
});

app.get('/api/csrf', (req, res) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = require('crypto').randomBytes(24).toString('hex');
  }
  res.json({ csrf: req.session.csrfToken });
});

function requireCsrf(req, res) {
  const token = req.get('x-csrf-token');
  if (!token || !req.session.csrfToken || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'invalid csrf' });
  }
  return null;
}

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'password too short' });
  const err = requireCsrf(req, res);
  if (err) return;

  if (usingSqlite && !useMemory) {
    const stmt = db.prepare('SELECT password_hash FROM users WHERE email = ?');
    const row = stmt.get(email);
    if (row) return res.status(409).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users(email,password_hash) VALUES (?,?)').run(email, hash);
  } else {
    const users = readUsers();
    if (users[email]) return res.status(409).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    users[email] = hash;
    writeUsers(users);
  }

  req.session.user = email;
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  const { email, password } = req.body;

  let hash;
  if (usingSqlite && !useMemory) {
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(email);
    hash = row && row.password_hash;
  } else {
    const users = readUsers();
    hash = users[email];
  }

  if (!hash) return res.status(401).json({ error: 'invalid' });

  try {
    const match = await bcrypt.compare(password, hash);
    if (!match) return res.status(401).json({ error: 'invalid' });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }

  req.session.user = email;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  req.session.destroy(err => res.json({ ok: !err }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/add-to-cart', (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  if (!req.session.user) return res.status(401).json({ error: 'not authorized' });
  const { id } = req.body;
  const pid = parseInt(id, 10);
  if (!PRODUCTS.find(p => p.id === pid)) return res.status(400).json({ error: 'invalid product' });
  req.session.cart = req.session.cart || {};
  req.session.cart[pid] = (req.session.cart[pid] || 0) + 1;
  res.json({ ok: true, cart: req.session.cart });
});

app.get('/api/cart', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'not authorized' });
  const cart = req.session.cart || {};
  const items = Object.entries(cart).map(([id, qty]) => {
    const product = PRODUCTS.find(p => p.id === Number(id));
    return { id: Number(id), qty, product };
  });
  res.json({ items, total: items.reduce((s, it) => s + (it.product.price * it.qty), 0) });
});

app.post('/api/place-order', async (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  if (!req.session.user) return res.status(401).json({ error: 'not authorized' });
  const cart = req.session.cart || {};
  if (Object.keys(cart).length === 0) return res.status(400).json({ error: 'empty cart' });
  const orders = readOrders();
  const items = Object.entries(cart).reduce((acc, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    if (p) acc.push({ id: p.id, name: p.name, qty: Number(qty), price: p.price });
    return acc;
  }, []);
  const order = { items, time: new Date().toISOString(), status: 'Processing', user: req.session.user };
  orders.push(order);
  addOrder(req.session.user, items, order.time, order.status);
  // clear cart
  req.session.cart = {};
  res.json({ ok: true, order });
});

app.get('/api/orders', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'not authorized' });
  const orders = readOrders();
  const mine = (orders || []).filter(o => o.user === req.session.user).map(o => ({
    id: o.id,
    user: o.user,
    items: (typeof o.items === 'string' ? JSON.parse(o.items) : o.items),
    time: o.time,
    status: o.status
  }));
  res.json(mine);
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  const entry = { time: new Date().toISOString(), name, email, message };
  if (!useMemory) {
    try {
      fs.ensureDirSync(path.join(__dirname, 'logs'));
      fs.appendFileSync(path.join(__dirname, 'logs', 'contact.log'), JSON.stringify(entry) + '\n');
    } catch (e) { console.warn('Cannot write contact log'); }
  }
  res.json({ ok: true });
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (useMemory) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));
}
