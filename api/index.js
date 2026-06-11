require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://wwbxskxiixlzycaadfpm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_D4d0om54xN8injfxPuRDeg_0SGgEZ3E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Remote Database Setup Route
app.get('/api/setup-db', async (req, res) => {
  const connectionString = 'postgresql://postgres:h7T%2BdRdT%2BXuZJ_y@db.wwbxskxiixlzycaadfpm.supabase.co:6543/postgres?sslmode=require';
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const sqlPath = path.join(__dirname, '..', 'data', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    res.send('Database schema initialized successfully!');
  } catch (err) {
    res.status(500).send('Error initializing database: ' + err.message);
  } finally {
    await client.end();
  }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'kpm-fdk-uinam-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication Middlewares
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}

// Auth API Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ error: 'Kombinasi username atau password salah.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    res.json({ message: 'Login berhasil', user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logout berhasil' });
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

// General Content APIs (Public Read)
app.get('/api/site-settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'config')
      .maybeSingle();

    if (error || !data) return res.json({});
    res.json(data.value);
  } catch (err) {
    res.json({});
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.json([]);
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return res.json([]);
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/slides', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return res.json([]);
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// Admin REST APIs (Role Based Access Control)

// 1. NEWS CRUD
app.post('/api/news', requireAuth, requireRole(['adminkpm', 'admingpm', 'adminjurusan']), async (req, res) => {
  const newArticle = {
    id: Date.now().toString(),
    title: req.body.title,
    category: req.body.category || 'Kegiatan',
    badge: req.body.badge || 'badge-success',
    image: req.body.image || 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=60',
    summary: req.body.summary,
    link: req.body.link || '#'
  };

  try {
    const { error } = await supabase.from('news').insert([newArticle]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(newArticle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/news/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  const updateData = {
    title: req.body.title,
    category: req.body.category,
    badge: req.body.badge,
    image: req.body.image,
    summary: req.body.summary,
    link: req.body.link
  };
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabase
      .from('news')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  try {
    const { error } = await supabase.from('news').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DOCUMENTS CRUD
app.post('/api/documents', requireAuth, requireRole(['adminkpm', 'admingpm', 'adminjurusan']), async (req, res) => {
  const newDoc = {
    id: Date.now().toString(),
    title: req.body.title,
    category: req.body.category || 'Kebijakan',
    badge: req.body.badge || 'badge-success',
    image: req.body.image || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=60',
    description: req.body.description,
    driveUrl: req.body.driveUrl,
    filename: req.body.filename || 'dokumen.pdf'
  };

  try {
    const { error } = await supabase.from('documents').insert([newDoc]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(newDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  const updateData = {
    title: req.body.title,
    category: req.body.category,
    badge: req.body.badge,
    image: req.body.image,
    description: req.body.description,
    driveUrl: req.body.driveUrl,
    filename: req.body.filename
  };
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  try {
    const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SLIDES CRUD
app.post('/api/slides', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  const newSlide = {
    id: Date.now().toString(),
    title: req.body.title,
    lead: req.body.lead,
    image: req.body.image || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
    buttonText: req.body.buttonText || 'Lihat Selengkapnya',
    buttonLink: req.body.buttonLink || '#'
  };

  try {
    const { error } = await supabase.from('slides').insert([newSlide]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(newSlide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/slides/:id', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  const updateData = {
    title: req.body.title,
    lead: req.body.lead,
    image: req.body.image,
    buttonText: req.body.buttonText,
    buttonLink: req.body.buttonLink
  };
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  try {
    const { data, error } = await supabase
      .from('slides')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/slides/:id', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    const { error } = await supabase.from('slides').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SITE SETTINGS & NAV (KPM Admin Only)
app.put('/api/site-settings', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    const { data: currentSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'config')
      .maybeSingle();

    const base = currentSettings ? currentSettings.value : {};

    const newSettings = {
      ...base,
      siteTitle: req.body.siteTitle || base.siteTitle,
      siteSub: req.body.siteSub || base.siteSub,
      logo: req.body.logo || base.logo,
      navLinks: req.body.navLinks || base.navLinks,
      footer: {
        ...base.footer,
        address: req.body.footerAddress || (base.footer && base.footer.address),
        phone: req.body.footerPhone || (base.footer && base.footer.phone),
        email: req.body.footerEmail || (base.footer && base.footer.email),
        copyright: req.body.footerCopyright || (base.footer && base.footer.copyright)
      }
    };

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'config', value: newSettings });

    if (error) return res.status(500).json({ error: error.message });
    res.json(newSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. USER ACCOUNTS CRUD (KPM Admin Only)
app.get('/api/users', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, name, role');

    if (error) return res.status(500).json({ error: error.message });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  const newUser = {
    id: Date.now().toString(),
    username: req.body.username,
    password: req.body.password || 'password123',
    name: req.body.name,
    role: req.body.role || 'adminjurusan'
  };

  try {
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  if (req.params.id === req.session.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  try {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handle unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

module.exports = app;
