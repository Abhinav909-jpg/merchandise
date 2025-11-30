const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const path = require('path');

const PORT = process.env.PORT || 8000;
const app = express();

// Force memory mode for Vercel (no file system access)
let useMemory = true;
let usingSqlite = false;

// In-memory storage
let MEMORY_USERS = {};
let MEMORY_ORDERS = [];

console.log('SERVER STARTING - FORCED IN-MEMORY MODE (Vercel Serverless)');

// DO NOT serve static files from __dirname on Vercel
// Instead, only serve JSON from API routes
// If you need to serve static files, put them in a 'public' folder
// and use: app.use(express.static('public'));
app.use(express.static(__dirname)); // Keeping this for now to serve root files

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

// helper to read and write files - REFACTORED FOR MEMORY ONLY
function readUsers() {
  return MEMORY_USERS;
}
function writeUsers(obj) {
  MEMORY_USERS = obj;
}
function readOrders() {
  return MEMORY_ORDERS;
}
function addOrder(user, items, time, status) {
  const id = MEMORY_ORDERS.length + 1;
  const entry = { id, user, items, time, status }; // items is already object
  MEMORY_ORDERS.push(entry);
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

  const users = readUsers();
  if (users[email]) return res.status(409).json({ error: 'user exists' });
  const hash = await bcrypt.hash(password, 10);
  users[email] = hash;
  writeUsers(users);

  req.session.user = email;
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  const { email, password } = req.body;

  const users = readUsers();
  const hash = users[email];

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
  // In memory mode, we just ignore the write or log to console
  console.log('Contact Form Submitted:', { name, email, message });
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
