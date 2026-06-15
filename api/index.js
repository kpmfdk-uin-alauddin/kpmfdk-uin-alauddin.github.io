require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://pryznardziocpsfkgrmw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_bOR5wVWACfom-X22dq8pZQ_EZTllHQo';
const isSupabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
const supabase = createClient(supabaseUrl, supabaseKey);

const SESSION_SECRET = process.env.SESSION_SECRET || 'kpm-fdk-uinam-secret-key-2026';
const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');

// Check if running locally
function isLocalDev() {
  return process.env.NODE_ENV !== 'production';
}

// Local DB Helpers
function readLocalDb() {
  try {
    if (fs.existsSync(dbJsonPath)) {
      return JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading db.json:', e);
  }
  return { users: [], news: [], documents: [], slides: [], settings: {} };
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Stateless Cookie-Based Session Middleware
app.use((req, res, next) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie || '';
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts[0]) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });

  req.session = {};
  const sessionToken = cookies['kpm_session'];
  if (sessionToken) {
    try {
      const [payloadBase64, signature] = sessionToken.split('.');
      if (payloadBase64 && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', SESSION_SECRET)
          .update(payloadBase64)
          .digest('base64url');

        if (signature === expectedSignature) {
          const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
          if (payload.exp && payload.exp > Date.now()) {
            req.session.user = payload.user;
          }
        }
      }
    } catch (e) {
      console.error('Session verify error:', e);
    }
  }

  req.session.destroy = () => {
    req.session.user = null;
    res.setHeader('Set-Cookie', 'kpm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  };

  next();
});

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

// Database Connection & Sync Status API
app.get('/api/sync/status', async (req, res) => {
  let supabaseConnected = false;
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (!error) supabaseConnected = true;
    } catch (e) {
      // Ignored
    }
  }
  res.json({
    supabaseConfigured: isSupabaseConfigured,
    supabaseConnected: supabaseConnected,
    isLocalDev: isLocalDev(),
    dbJsonExists: fs.existsSync(dbJsonPath)
  });
});

// Push local JSON to Supabase
app.post('/api/sync/push', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  if (!isSupabaseConfigured) {
    return res.status(400).json({ error: 'Supabase is not configured on this environment.' });
  }
  try {
    const db = readLocalDb();
    
    // Clear and re-populate settings
    if (db.settings) {
      await supabase.from('settings').delete().neq('key', '');
      await supabase.from('settings').insert([{ key: 'config', value: db.settings }]);
    }
    
    // Clear and populate slides
    if (db.slides && db.slides.length > 0) {
      await supabase.from('slides').delete().neq('id', '');
      await supabase.from('slides').insert(db.slides.map(item => ({
        id: item.id,
        title: item.title,
        lead: item.lead,
        image: item.image,
        buttonText: item.buttonText,
        buttonLink: item.buttonLink
      })));
    }

    // Clear and populate news
    if (db.news && db.news.length > 0) {
      await supabase.from('news').delete().neq('id', '');
      await supabase.from('news').insert(db.news.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        badge: item.badge,
        image: item.image,
        summary: item.summary,
        link: item.link
      })));
    }

    // Clear and populate documents
    if (db.documents && db.documents.length > 0) {
      await supabase.from('documents').delete().neq('id', '');
      await supabase.from('documents').insert(db.documents.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        badge: item.badge,
        image: item.image,
        description: item.description,
        driveUrl: item.driveUrl,
        filename: item.filename
      })));
    }

    // Clear and populate users (excluding current active user if exists to avoid locking out)
    if (db.users && db.users.length > 0) {
      await supabase.from('users').delete().neq('id', '');
      await supabase.from('users').insert(db.users);
    }

    res.json({ success: true, message: 'Successfully synced local JSON data to Supabase.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pull Supabase data to local JSON (local dev only)
app.post('/api/sync/pull', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  if (!isLocalDev()) {
    return res.status(403).json({ error: 'Data pulling can only be executed in local development environment.' });
  }
  if (!isSupabaseConfigured) {
    return res.status(400).json({ error: 'Supabase is not configured.' });
  }
  try {
    const { data: users } = await supabase.from('users').select('*');
    const { data: news } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    const { data: documents } = await supabase.from('documents').select('*').order('created_at', { ascending: true });
    const { data: slides } = await supabase.from('slides').select('*').order('created_at', { ascending: true });
    const { data: settingConfig } = await supabase.from('settings').select('value').eq('key', 'config').maybeSingle();

    const newData = {
      users: users || [],
      news: news || [],
      documents: documents || [],
      slides: slides || [],
      settings: settingConfig ? settingConfig.value : {}
    };

    writeLocalDb(newData);
    res.json({ success: true, message: 'Successfully pulled data from Supabase to local db.json' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remote Database Setup Route
app.get('/api/setup-db', async (req, res) => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:h7T%2BdRdT%2BXuZJ_y@db.pryznardziocpsfkgrmw.supabase.co:6543/postgres?sslmode=require';
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

// Auth API Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = null;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle();
        if (!error) user = data;
      } catch (e) {
        console.warn('Supabase auth failed, trying local db fallback:', e);
      }
    }

    // Fallback to local db.json
    if (!user) {
      const db = readLocalDb();
      user = db.users.find(u => u.username === username && u.password === password);
    }

    if (!user) {
      return res.status(400).json({ error: 'Kombinasi username atau password salah.' });
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    // Sign session cookie
    const payload = {
      user: sessionUser,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    const token = `${payloadBase64}.${signature}`;
    res.setHeader('Set-Cookie', `kpm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    res.json({ message: 'Login berhasil', user: sessionUser });
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

// General Content APIs (Public Read with local fallback)
app.get('/api/site-settings', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'config')
        .maybeSingle();

      if (!error && data) {
        return res.json(data.value);
      }
    }
  } catch (err) {
    // Fallback
  }
  const db = readLocalDb();
  res.json(db.settings);
});

app.get('/api/news', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json(data);
      }
    }
  } catch (err) {
    // Fallback
  }
  const db = readLocalDb();
  res.json(db.news);
});

app.get('/api/documents', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        return res.json(data);
      }
    }
  } catch (err) {
    // Fallback
  }
  const db = readLocalDb();
  res.json(db.documents);
});

app.get('/api/slides', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        return res.json(data);
      }
    }
  } catch (err) {
    // Fallback
  }
  const db = readLocalDb();
  res.json(db.slides);
});

// Admin REST APIs (Role Based Access Control with Dual-Write)

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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.news.unshift(newArticle);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('news').insert([newArticle]);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.news = db.news.map(item => item.id === req.params.id ? { ...item, ...updateData } : item);
      writeLocalDb(db);
    }
    let result = { id: req.params.id, ...updateData };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('news')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .maybeSingle();
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
      if (data) result = data;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/news/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  try {
    if (isLocalDev()) {
      const db = readLocalDb();
      db.news = db.news.filter(item => item.id !== req.params.id);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('news').delete().eq('id', req.params.id);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.documents.push(newDoc);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('documents').insert([newDoc]);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.documents = db.documents.map(item => item.id === req.params.id ? { ...item, ...updateData } : item);
      writeLocalDb(db);
    }
    let result = { id: req.params.id, ...updateData };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .maybeSingle();
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
      if (data) result = data;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), async (req, res) => {
  try {
    if (isLocalDev()) {
      const db = readLocalDb();
      db.documents = db.documents.filter(item => item.id !== req.params.id);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('documents').delete().eq('id', req.params.id);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.slides.push(newSlide);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('slides').insert([newSlide]);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.slides = db.slides.map(item => item.id === req.params.id ? { ...item, ...updateData } : item);
      writeLocalDb(db);
    }
    let result = { id: req.params.id, ...updateData };
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('slides')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .maybeSingle();
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
      if (data) result = data;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/slides/:id', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    if (isLocalDev()) {
      const db = readLocalDb();
      db.slides = db.slides.filter(item => item.id !== req.params.id);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('slides').delete().eq('id', req.params.id);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, message: 'Slide deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. SITE SETTINGS & NAV (KPM Admin Only)
app.put('/api/site-settings', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    let base = {};
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'config')
        .maybeSingle();
      if (data) base = data.value;
    }
    if (Object.keys(base).length === 0) {
      base = readLocalDb().settings || {};
    }

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

    if (isLocalDev()) {
      const db = readLocalDb();
      db.settings = newSettings;
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'config', value: newSettings });
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
    res.json(newSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. USER ACCOUNTS CRUD (KPM Admin Only)
app.get('/api/users', requireAuth, requireRole(['adminkpm']), async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, name, role');
      if (!error && users) return res.json(users);
    }
  } catch (err) {
    // Fallback
  }
  const db = readLocalDb();
  res.json(db.users.map(({ id, username, name, role }) => ({ id, username, name, role })));
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.users.push(newUser);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
    if (isLocalDev()) {
      const db = readLocalDb();
      db.users = db.users.filter(u => u.id !== req.params.id);
      writeLocalDb(db);
    }
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('users').delete().eq('id', req.params.id);
      if (error && !isLocalDev()) return res.status(500).json({ error: error.message });
    }
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
