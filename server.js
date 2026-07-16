const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meister-ava-2026';

// ═════════════════════════════════════ MEISTER AUTH ═════════════════════════════════════
app.post('/api/meister/login', async (req, res) => {
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
  const authenticated = req.cookies.meister_auth === 'authenticated';
  res.json({ authenticated });
});

app.post('/api/meister/logout', (req, res) => {
  res.clearCookie('meister_auth');
  res.json({ success: true });
});

// ═════════════════════════════════════ BLOG APIS ═════════════════════════════════════
app.get('/api/blog', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, slug, content, published, created_at FROM blog_posts WHERE published = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.post('/api/blog', async (req, res) => {
  const authenticated = req.cookies.meister_auth === 'authenticated';
  if (!authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, content } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const result = await pool.query(
      'INSERT INTO blog_posts (title, slug, content, published) VALUES ($1, $2, $3, true) RETURNING *',
      [title, slug, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

app.delete('/api/blog/:id', async (req, res) => {
  const authenticated = req.cookies.meister_auth === 'authenticated';
  if (!authenticated) {
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

// ═════════════════════════════════════ CONTACT APIS ═════════════════════════════════════
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, organisation, level, teamSize, message } = req.body;

  try {
    await pool.query(
      'INSERT INTO contact_submissions (first_name, last_name, email, phone, organisation, level, team_size, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [firstName, lastName, email, phone, organisation, level, teamSize, message]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save contact submission' });
  }
});

// ═════════════════════════════════════ CATCH ALL ═════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`AVA server running on port ${port}`);
});
