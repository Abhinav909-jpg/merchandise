const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const path = require('path');

const PORT = process.env.PORT || 8000;
const app = express();

// Connection URL - Using the provided string with URL encoded password
// Password: Abhinav@88btgd -> Abhinav%4088btgd
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abhinavsharma7686_db_user:Abhinav%4088btgd@cluster0.vusykte.mongodb.net/?appName=Cluster0';
const DB_NAME = 'merchandise_store';

let db;
let usersCollection;
let ordersCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    ordersCollection = db.collection('orders');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}

connectDB();

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

// Products list (Static for now)
const PRODUCTS = [
  { id: 1, name: 'DHH Hoodie', price: 2500, image: 'images/hoodie.png' },
  { id: 2, name: 'DHH Cap', price: 1200, image: 'images/cap.png' },
  { id: 3, name: 'DHH T-Shirt', price: 1500, image: 'images/tshirt.png' }
];

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

  try {
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'user exists' });

    const hash = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ email, password_hash: hash });

    req.session.user = email;
    res.json({ ok: true });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const err = requireCsrf(req, res);
  if (err) return;
  const { email, password } = req.body;

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'invalid' });

    req.session.user = email;
    res.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'server error' });
  }
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

  const items = Object.entries(cart).reduce((acc, [id, qty]) => {
    const p = PRODUCTS.find(x => x.id === Number(id));
    if (p) acc.push({ id: p.id, name: p.name, qty: Number(qty), price: p.price });
    return acc;
  }, []);

  const order = {
    items,
    time: new Date().toISOString(),
    status: 'Processing',
    user: req.session.user
  };

  try {
    await ordersCollection.insertOne(order);
    // clear cart
    req.session.cart = {};
    res.json({ ok: true, order });
  } catch (e) {
    console.error('Place order error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/api/orders', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'not authorized' });
  try {
    const orders = await ordersCollection.find({ user: req.session.user }).sort({ time: -1 }).toArray();
    res.json(orders);
  } catch (e) {
    console.error('Get orders error:', e);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Contact Form Submitted:', { name, email, message });
  res.json({ ok: true });
});

// fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel
module.exports = app;

// Start server if not running on Vercel (local dev)
if (require.main === module) {
  app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));
}
