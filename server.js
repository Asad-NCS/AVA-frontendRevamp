const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meister-ava-2026';

// ── NO-CACHE MIDDLEWARE FOR MEISTER PAGES ──────────────────────────────────────
app.use('/meister', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ── MEISTER PAGE ROUTES (before static so /meister hits this, not a 404) ─────
app.get('/meister', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister.html'));
});
app.get('/meister/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister', 'blog.html'));
});
app.get('/meister/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister', 'about.html'));
});
app.get('/meister/our-work', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister', 'our-work.html'));
});
app.get('/meister/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meister', 'contact.html'));
});

// ── STATIC FILES ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── MEISTER AUTH API ──────────────────────────────────────────────────────────
app.post('/api/meister/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.cookie('meister_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.get('/api/meister/status', (req, res) => {
  res.json({ authenticated: req.cookies.meister_auth === 'authenticated' });
});

app.post('/api/meister/logout', (req, res) => {
  res.clearCookie('meister_auth');
  res.json({ success: true });
});

// ── BLOG API ──────────────────────────────────────────────────────────────────
app.get('/api/blog', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, text, images, videos, pdfs, "createdAt" FROM blog_posts ORDER BY "createdAt" DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[v0] Blog GET error:', err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.post('/api/blog', upload.array('media'), async (req, res) => {
  if (req.cookies.meister_auth !== 'authenticated') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { text } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Post text is required' });
  }

  try {
    // TODO: Handle file uploads (images, videos, pdfs)
    // For now, just store the text
    const result = await pool.query(
      'INSERT INTO blog_posts (text, images, videos, pdfs, "createdAt") VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [text.trim(), '[]', '[]', '[]']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[v0] Blog POST error:', err);
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
    console.error('[v0] Blog DELETE error:', err);
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
    console.error('[v0] Contact POST error:', err);
    res.status(500).json({ error: 'Failed to save contact submission' });
  }
});

// Export for Vercel serverless — also support local dev with listen()
module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`AVA server running on port ${port}`));
}