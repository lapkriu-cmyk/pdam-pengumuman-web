const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'announcements.json');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'ganti-session-secret-ini';
const PDAM_NAME = process.env.PDAM_NAME || 'PDAM Tirta Daerah';
const PDAM_PHONE = process.env.PDAM_PHONE || '081234567890';
const PDAM_EMAIL = process.env.PDAM_EMAIL || 'layanan@pdam.local';

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/admin-assets', express.static(path.join(__dirname, 'admin')));

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAnnouncements() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Gagal membaca data:', error.message);
    return [];
  }
}

function writeAnnouncements(items) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminLoggedIn) return next();
  return res.status(401).json({ message: 'Anda belum login sebagai admin.' });
}

function sortAnnouncements(a, b) {
  const rank = { Darurat: 3, Penting: 2, Normal: 1 };
  const prio = (rank[b.priority] || 0) - (rank[a.priority] || 0);
  if (prio !== 0) return prio;
  return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
}

function cleanText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function normalizeAnnouncement(input, oldItem = {}) {
  const now = new Date().toISOString();
  return {
    id: oldItem.id || crypto.randomUUID(),
    title: cleanText(input.title, oldItem.title),
    message: cleanText(input.message, oldItem.message),
    category: cleanText(input.category, oldItem.category || 'Info Umum'),
    area: cleanText(input.area, oldItem.area || 'Semua wilayah layanan'),
    status: cleanText(input.status, oldItem.status || 'Aktif'),
    priority: cleanText(input.priority, oldItem.priority || 'Normal'),
    startDate: cleanText(input.startDate, oldItem.startDate || ''),
    endDate: cleanText(input.endDate, oldItem.endDate || ''),
    published: typeof input.published === 'boolean' ? input.published : oldItem.published ?? true,
    createdAt: oldItem.createdAt || now,
    updatedAt: now
  };
}

function validateAnnouncement(item) {
  if (!item.title) return 'Judul pengumuman wajib diisi.';
  if (!item.message) return 'Isi pengumuman wajib diisi.';
  if (!item.category) return 'Kategori wajib diisi.';
  if (!item.status) return 'Status wajib diisi.';
  if (!item.priority) return 'Prioritas wajib diisi.';
  return null;
}

app.get('/api/settings', (req, res) => {
  res.json({
    name: PDAM_NAME,
    phone: PDAM_PHONE,
    email: PDAM_EMAIL
  });
});

app.get('/api/announcements', (req, res) => {
  const { q = '', category = '', status = '' } = req.query;
  const search = String(q).toLowerCase().trim();
  let items = readAnnouncements().filter((item) => item.published);

  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);
  if (search) {
    items = items.filter((item) => {
      const haystack = `${item.title} ${item.message} ${item.area} ${item.category} ${item.status}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  res.json(items.sort(sortAnnouncements));
});

app.get('/admin', (req, res) => {
  if (req.session && req.session.adminLoggedIn) {
    return res.redirect('/admin/dashboard');
  }
  return res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminLoggedIn) {
    return res.redirect('/admin/dashboard');
  }
  return res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  if (!req.session || !req.session.adminLoggedIn) {
    return res.redirect('/admin/login');
  }
  return res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.post('/api/admin/login', (req, res) => {
  const username = cleanText(req.body.username);
  const password = cleanText(req.body.password);
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.adminLoggedIn = true;
    req.session.adminUsername = username;
    return res.json({ message: 'Login berhasil.', username });
  }
  return res.status(401).json({ message: 'Username atau password salah.' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logout berhasil.' });
  });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ username: req.session.adminUsername || ADMIN_USERNAME });
});

app.get('/api/admin/announcements', requireAdmin, (req, res) => {
  res.json(readAnnouncements().sort(sortAnnouncements));
});

app.post('/api/admin/announcements', requireAdmin, (req, res) => {
  const items = readAnnouncements();
  const item = normalizeAnnouncement(req.body);
  const error = validateAnnouncement(item);
  if (error) return res.status(400).json({ message: error });
  items.push(item);
  writeAnnouncements(items);
  res.status(201).json(item);
});

app.put('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const items = readAnnouncements();
  const index = items.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });

  const updated = normalizeAnnouncement(req.body, items[index]);
  const error = validateAnnouncement(updated);
  if (error) return res.status(400).json({ message: error });

  items[index] = updated;
  writeAnnouncements(items);
  res.json(updated);
});

app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const items = readAnnouncements();
  const filtered = items.filter((item) => item.id !== req.params.id);
  if (filtered.length === items.length) return res.status(404).json({ message: 'Pengumuman tidak ditemukan.' });
  writeAnnouncements(filtered);
  res.json({ message: 'Pengumuman berhasil dihapus.' });
});

app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan.');
});

app.listen(PORT, () => {
  console.log(`Web pengumuman PDAM berjalan di http://localhost:${PORT}`);
  if (ADMIN_USERNAME === 'admin' && ADMIN_PASSWORD === 'admin123') {
    console.log('PERINGATAN: Ganti ADMIN_USERNAME dan ADMIN_PASSWORD sebelum dipakai online.');
  }
});
