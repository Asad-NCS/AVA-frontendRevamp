const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');

const app = express();

app.use(express.json());
app.use(cookieParser());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// No hardcoded fallback here on purpose — this repo is public on GitHub, so a
// default password baked into the code would be visible to anyone. If
// ADMIN_PASSWORD isn't set in the environment, login is disabled below
// rather than silently falling back to something guessable.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.warn('WARNING: ADMIN_PASSWORD is not set. /meister login is disabled until it is configured in your environment variables.');
}

// ── FILE UPLOAD SETUP ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/|^video\/|^application\/pdf$/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

// ── MEISTER PAGE ROUTES (before static so /meister hits this, not a 404) ─────
app.get('/meister', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister.html'));
});
app.get('/meister/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/meister/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister', 'blog.html'));
});
app.get('/meister/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/meister/our-work', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'our-work.html'));
});
app.get('/meister/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// ── STATIC FILES ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── MEISTER LOGIN RATE LIMITING ───────────────────────────────────────────────
// Simple in-memory attempt tracker, keyed by IP. This resets whenever the
// serverless function cold-starts (goes idle and spins back up), so it's a
// speed bump against casual brute-forcing, not a hard guarantee — good
// enough for a low-stakes internal admin panel. For anything higher-stakes,
// swap this Map for a shared store like Upstash/Redis so limits survive
// across cold starts and multiple function instances.
const loginAttempts = new Map(); // ip -> { count, firstAttempt, lockedUntil }

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // failed attempts older than this don't count
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // how long a lockout lasts

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function getLoginStatus(ip) {
  const record = loginAttempts.get(ip);
  const now = Date.now();

  if (!record) {
    return { blocked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    return { blocked: true, attemptsLeft: 0, lockedUntil: record.lockedUntil };
  }

  if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
    // Window expired, attempts no longer count
    return { blocked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }

  return { blocked: false, attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - record.count) };
}

// ── MEISTER AUTH API ──────────────────────────────────────────────────────────
app.post('/api/meister/login', (req, res) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const status = getLoginStatus(ip);

  if (status.blocked) {
    const minutesLeft = Math.ceil((status.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      blocked: true,
      error: `Too many attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    });
  }

  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      success: false,
      error: 'Login is not configured. Set ADMIN_PASSWORD in your environment variables.',
    });
  }

  if (password === ADMIN_PASSWORD) {
    loginAttempts.delete(ip);
    res.cookie('meister_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }

  // Wrong password — record the attempt
  let record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > LOGIN_WINDOW_MS) {
    record = { count: 0, firstAttempt: now, lockedUntil: null };
  }
  record.count += 1;

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOGIN_LOCKOUT_MS;
    loginAttempts.set(ip, record);
    return res.status(429).json({
      success: false,
      blocked: true,
      error: `Too many attempts. Try again in ${Math.ceil(LOGIN_LOCKOUT_MS / 60000)} minutes.`,
    });
  }

  loginAttempts.set(ip, record);
  const attemptsLeft = MAX_LOGIN_ATTEMPTS - record.count;
  res.status(401).json({ success: false, error: 'Invalid password', attemptsLeft });
});

app.get('/api/meister/status', (req, res) => {
  const ip = getClientIp(req);
  const status = getLoginStatus(ip);
  res.json({
    authenticated: req.cookies.meister_auth === 'authenticated',
    blocked: status.blocked,
    attemptsLeft: status.attemptsLeft,
  });
});

app.post('/api/meister/logout', (req, res) => {
  res.clearCookie('meister_auth');
  res.json({ success: true });
});

// ── BLOG API ──────────────────────────────────────────────────────────────────
app.get('/api/blog', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, text, images, videos, pdfs, created_at AS "createdAt"
       FROM blog_posts
       WHERE published = true
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.post('/api/blog', upload.array('media', 10), async (req, res) => {
  if (req.cookies.meister_auth !== 'authenticated') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const text = (req.body.text || '').trim();
  const files = req.files || [];

  if (!text && files.length === 0) {
    return res.status(400).json({ error: 'Post must include text or at least one attachment' });
  }

  const images = [];
  const videos = [];
  const pdfs = [];

  files.forEach((file) => {
    const url = `/uploads/${file.filename}`;
    if (file.mimetype.startsWith('image/')) images.push(url);
    else if (file.mimetype.startsWith('video/')) videos.push(url);
    else if (file.mimetype === 'application/pdf') pdfs.push(url);
  });

  try {
    const result = await pool.query(
      `INSERT INTO blog_posts (text, images, videos, pdfs, published)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, text, images, videos, pdfs, created_at AS "createdAt"`,
      [text, JSON.stringify(images), JSON.stringify(videos), JSON.stringify(pdfs)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  if (req.cookies.meister_auth !== 'authenticated') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// ── CONTACT API ───────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, organisation, level, teamSize, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO contact_submissions (first_name, last_name, email, phone, organisation, level, team_size, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [firstName, lastName, email, phone, organisation, level, teamSize, message]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save contact submission' });
  }
});

// Export for Vercel serverless — also support local dev with listen()
module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`AVA server running on port ${port}`));
}