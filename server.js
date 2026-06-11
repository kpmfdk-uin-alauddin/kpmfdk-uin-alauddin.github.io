const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'kpm-fdk-uinam-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// DB Helper Functions
function readDb() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json, returning empty template:', err);
    return { users: [], news: [], documents: [], slides: [], settings: {} };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
}

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
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(400).json({ error: 'Kombinasi username atau password salah.' });
  }
  
  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  
  res.json({ message: 'Login berhasil', user: req.session.user });
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
app.get('/api/site-settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

app.get('/api/news', (req, res) => {
  const db = readDb();
  res.json(db.news);
});

app.get('/api/documents', (req, res) => {
  const db = readDb();
  res.json(db.documents);
});

app.get('/api/slides', (req, res) => {
  const db = readDb();
  res.json(db.slides);
});

// Admin REST APIs (Role Based Access Control)

// 1. NEWS CRUD
// adminkpm/admingpm can add/edit/delete; adminjurusan can only add.
app.post('/api/news', requireAuth, requireRole(['adminkpm', 'admingpm', 'adminjurusan']), (req, res) => {
  const db = readDb();
  const newArticle = {
    id: Date.now().toString(),
    title: req.body.title,
    category: req.body.category || 'Kegiatan',
    badge: req.body.badge || 'badge-success',
    image: req.body.image || 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=60',
    summary: req.body.summary,
    link: req.body.link || '#'
  };
  
  db.news.unshift(newArticle);
  writeDb(db);
  res.status(201).json(newArticle);
});

app.put('/api/news/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), (req, res) => {
  const db = readDb();
  const idx = db.news.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Article not found' });
  
  db.news[idx] = {
    ...db.news[idx],
    title: req.body.title || db.news[idx].title,
    category: req.body.category || db.news[idx].category,
    badge: req.body.badge || db.news[idx].badge,
    image: req.body.image || db.news[idx].image,
    summary: req.body.summary || db.news[idx].summary,
    link: req.body.link || db.news[idx].link
  };
  
  writeDb(db);
  res.json(db.news[idx]);
});

app.delete('/api/news/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), (req, res) => {
  const db = readDb();
  const filterNews = db.news.filter(n => n.id !== req.params.id);
  if (filterNews.length === db.news.length) return res.status(404).json({ error: 'Article not found' });
  
  db.news = filterNews;
  writeDb(db);
  res.json({ success: true, message: 'Article deleted successfully' });
});

// 2. DOCUMENTS CRUD
// adminkpm/admingpm can add/edit/delete; adminjurusan can only add.
app.post('/api/documents', requireAuth, requireRole(['adminkpm', 'admingpm', 'adminjurusan']), (req, res) => {
  const db = readDb();
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
  
  db.documents.push(newDoc);
  writeDb(db);
  res.status(201).json(newDoc);
});

app.put('/api/documents/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), (req, res) => {
  const db = readDb();
  const idx = db.documents.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Document not found' });
  
  db.documents[idx] = {
    ...db.documents[idx],
    title: req.body.title || db.documents[idx].title,
    category: req.body.category || db.documents[idx].category,
    badge: req.body.badge || db.documents[idx].badge,
    image: req.body.image || db.documents[idx].image,
    description: req.body.description || db.documents[idx].description,
    driveUrl: req.body.driveUrl || db.documents[idx].driveUrl,
    filename: req.body.filename || db.documents[idx].filename
  };
  
  writeDb(db);
  res.json(db.documents[idx]);
});

app.delete('/api/documents/:id', requireAuth, requireRole(['adminkpm', 'admingpm']), (req, res) => {
  const db = readDb();
  const filterDocs = db.documents.filter(d => d.id !== req.params.id);
  if (filterDocs.length === db.documents.length) return res.status(404).json({ error: 'Document not found' });
  
  db.documents = filterDocs;
  writeDb(db);
  res.json({ success: true, message: 'Document deleted successfully' });
});

// 3. SLIDES CRUD
// adminkpm can edit/delete; others cannot access.
app.post('/api/slides', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  const newSlide = {
    id: Date.now().toString(),
    title: req.body.title,
    lead: req.body.lead,
    image: req.body.image || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
    buttonText: req.body.buttonText || 'Lihat Selengkapnya',
    buttonLink: req.body.buttonLink || '#'
  };
  
  db.slides.push(newSlide);
  writeDb(db);
  res.status(201).json(newSlide);
});

app.put('/api/slides/:id', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  const idx = db.slides.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Slide not found' });
  
  db.slides[idx] = {
    ...db.slides[idx],
    title: req.body.title || db.slides[idx].title,
    lead: req.body.lead || db.slides[idx].lead,
    image: req.body.image || db.slides[idx].image,
    buttonText: req.body.buttonText || db.slides[idx].buttonText,
    buttonLink: req.body.buttonLink || db.slides[idx].buttonLink
  };
  
  writeDb(db);
  res.json(db.slides[idx]);
});

app.delete('/api/slides/:id', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  const filterSlides = db.slides.filter(s => s.id !== req.params.id);
  if (filterSlides.length === db.slides.length) return res.status(404).json({ error: 'Slide not found' });
  
  db.slides = filterSlides;
  writeDb(db);
  res.json({ success: true, message: 'Slide deleted successfully' });
});

// 4. SITE SETTINGS & NAV (KPM Admin Only)
app.put('/api/site-settings', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    siteTitle: req.body.siteTitle || db.settings.siteTitle,
    siteSub: req.body.siteSub || db.settings.siteSub,
    logo: req.body.logo || db.settings.logo,
    navLinks: req.body.navLinks || db.settings.navLinks,
    footer: {
      ...db.settings.footer,
      address: req.body.footerAddress || db.settings.footer.address,
      phone: req.body.footerPhone || db.settings.footer.phone,
      email: req.body.footerEmail || db.settings.footer.email,
      copyright: req.body.footerCopyright || db.settings.footer.copyright
    }
  };
  
  writeDb(db);
  res.json(db.settings);
});

// 5. USER ACCOUNTS CRUD (KPM Admin Only)
app.get('/api/users', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  const cleanUsers = db.users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
  res.json(cleanUsers);
});

app.post('/api/users', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  const newUser = {
    id: Date.now().toString(),
    username: req.body.username,
    password: req.body.password || 'password123',
    name: req.body.name,
    role: req.body.role || 'adminjurusan'
  };
  
  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role });
});

app.delete('/api/users/:id', requireAuth, requireRole(['adminkpm']), (req, res) => {
  const db = readDb();
  if (req.params.id === req.session.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }
  
  const filterUsers = db.users.filter(u => u.id !== req.params.id);
  if (filterUsers.length === db.users.length) return res.status(404).json({ error: 'User not found' });
  
  db.users = filterUsers;
  writeDb(db);
  res.json({ success: true, message: 'User deleted successfully' });
});

// Serve frontend assets
app.use(express.static(path.join(__dirname)));

// Fallback to serve index.html for index URL access
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================================`);
  console.log(` KPM FDK UINAM Server running at: http://localhost:${PORT}`);
  console.log(` Credentials:`);
  console.log(`   - Admin KPM: admin_kpm / password123`);
  console.log(`   - Admin GPM: admin_gpm / password123`);
  console.log(`   - Admin Jurusan: admin_jurusan / password123`);
  console.log(`========================================================================`);
});
