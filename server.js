const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const MEISTER_PASSWORD = process.env.MEISTER_PASSWORD || process.env.ADMIN_PASSWORD || 'adventures';
const MEISTER_COOKIE_SECRET = process.env.MEISTER_COOKIE_SECRET || process.env.ADMIN_COOKIE_SECRET || 'ava-meister-session-secret';
const MEISTER_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 3;
const BLOG_FILE = path.join(__dirname, 'data', 'blog-posts.json');
const SECURITY_FILE = path.join(__dirname, 'data', 'meister-security.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

let securityState = { attempts: {}, blockedIPs: [] };

function createMeisterToken() {
  const issued = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', MEISTER_COOKIE_SECRET)
    .update(issued)
    .digest('hex');
  return `${issued}.${signature}`;
}

function verifyMeisterToken(token) {
  if (!token || !token.includes('.')) return false;

  const [issued, signature] = token.split('.');
  if (!issued || !signature) return false;

  const expected = crypto
    .createHmac('sha256', MEISTER_COOKIE_SECRET)
    .update(issued)
    .digest('hex');

  if (signature !== expected) return false;

  const age = Date.now() - Number(issued);
  return age >= 0 && age <= MEISTER_SESSION_MAX_AGE;
}

function loadSecurityState() {
  const legacyFile = path.join(__dirname, 'data', 'admin-security.json');
  try {
    if (fs.existsSync(SECURITY_FILE)) {
      securityState = JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf8'));
    } else if (fs.existsSync(legacyFile)) {
      securityState = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
      saveSecurityState();
    }
  } catch {
    securityState = { attempts: {}, blockedIPs: [] };
  }
}

function saveSecurityState() {
  fs.writeFileSync(SECURITY_FILE, JSON.stringify(securityState, null, 2));
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || 'unknown');
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

function isBlocked(ip) {
  return securityState.blockedIPs.includes(ip);
}

function getAttemptsLeft(ip) {
  const used = securityState.attempts[ip] || 0;
  return Math.max(0, MAX_LOGIN_ATTEMPTS - used);
}

function recordFailedAttempt(ip) {
  securityState.attempts[ip] = (securityState.attempts[ip] || 0) + 1;
  if (securityState.attempts[ip] >= MAX_LOGIN_ATTEMPTS && !securityState.blockedIPs.includes(ip)) {
    securityState.blockedIPs.push(ip);
  }
  saveSecurityState();
}

function clearAttempts(ip) {
  delete securityState.attempts[ip];
  saveSecurityState();
}

function isMeister(req) {
  return verifyMeisterToken(req.cookies.meisterSession);
}

function setMeisterCookie(res) {
  const token = createMeisterToken();
  res.cookie('meisterSession', token, {
    httpOnly: true,
    maxAge: MEISTER_SESSION_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  });
  return token;
}

function classifyUpload(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const url = `/uploads/${file.filename}`;
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return { kind: 'images', url };
  if (['.mp4', '.webm', '.mov'].includes(ext)) return { kind: 'videos', url };
  if (ext === '.pdf') return { kind: 'pdfs', url };
  return null;
}

function readPosts() {
  try {
    if (!fs.existsSync(BLOG_FILE)) return [];
    return JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.mkdirSync(path.dirname(BLOG_FILE), { recursive: true });
  fs.writeFileSync(BLOG_FILE, JSON.stringify(posts, null, 2));
}

function deleteMediaFiles(post) {
  [...(post.images || []), ...(post.videos || []), ...(post.pdfs || [])].forEach((mediaPath) => {
    const filename = path.basename(mediaPath);
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
}

loadSecurityState();
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mov', '.pdf'];
    cb(null, allowed.includes(ext));
  },
});

// ─── HIDDEN MEISTER ENTRY ───
app.get(['/meister', '/meister/'], (req, res) => {
  const ip = getClientIP(req);
  if (isBlocked(ip)) {
    return res.redirect('/');
  }
  if (isMeister(req)) {
    return res.redirect('/meister/index.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'meister.html'));
});

app.get('/master', (_req, res) => res.redirect('/meister'));
app.get('/admin', (_req, res) => res.redirect('/meister'));

// ─── MEISTER AUTH ───
app.get('/api/meister/status', (req, res) => {
  const ip = getClientIP(req);
  if (isBlocked(ip)) {
    return res.json({ blocked: true, authenticated: false, attemptsLeft: 0 });
  }
  res.json({
    blocked: false,
    authenticated: isMeister(req),
    attemptsLeft: getAttemptsLeft(ip),
  });
});

app.post('/api/meister/login', (req, res) => {
  const ip = getClientIP(req);

  if (isBlocked(ip)) {
    return res.status(403).json({ blocked: true, error: 'Access restricted' });
  }

  const { password } = req.body || {};
  if (password === MEISTER_PASSWORD) {
    clearAttempts(ip);
    setMeisterCookie(res);
    return res.json({ success: true });
  }

  recordFailedAttempt(ip);
  if (isBlocked(ip)) {
    return res.status(403).json({ blocked: true, error: 'Too many attempts. Access restricted.' });
  }

  res.status(401).json({
    error: 'Incorrect password',
    attemptsLeft: getAttemptsLeft(ip),
  });
});

app.post('/api/meister/logout', (req, res) => {
  res.clearCookie('meisterSession', { path: '/' });
  res.json({ success: true });
});

// ─── BLOG API ───
app.get('/api/blog', (_req, res) => {
  const posts = readPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.post('/api/blog', upload.array('media', 15), (req, res) => {
  if (!isMeister(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const text = (req.body.text || '').trim();
  const images = [];
  const videos = [];
  const pdfs = [];

  (req.files || []).forEach((file) => {
    const classified = classifyUpload(file);
    if (!classified) return;
    if (classified.kind === 'images') images.push(classified.url);
    if (classified.kind === 'videos') videos.push(classified.url);
    if (classified.kind === 'pdfs') pdfs.push(classified.url);
  });

  if (!text && images.length === 0 && videos.length === 0 && pdfs.length === 0) {
    return res.status(400).json({ error: 'Post must include text, photos, videos, or a PDF' });
  }

  const post = {
    id: crypto.randomUUID(),
    text,
    images,
    videos,
    pdfs,
    createdAt: new Date().toISOString(),
  };

  const posts = readPosts();
  posts.unshift(post);
  writePosts(posts);
  res.status(201).json(post);
});

app.delete('/api/blog/:id', (req, res) => {
  if (!isMeister(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const posts = readPosts();
  const index = posts.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  deleteMediaFiles(posts[index]);
  posts.splice(index, 1);
  writePosts(posts);
  res.json({ success: true });
});

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next();
});

// ─── CONTACT API ───
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, phone, organisation, level, teamSize, message } = req.body;

  if (!firstName || !lastName || !email || !organisation || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const levelLabels = {
    'early-career': 'Early-Career Professionals',
    'middle-management': 'Middle Management',
    'c-suite': 'C-Suite Leadership',
    'all-levels': 'All Levels',
    'custom': 'Custom / Not Sure Yet',
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"AVA Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || 'hello@adventures.studio',
      replyTo: email,
      subject: `New AVA Enquiry — ${organisation}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px;">
          <div style="background:#060A14;padding:24px 32px;border-radius:8px 8px 0 0;margin:-32px -32px 32px;">
            <h2 style="color:#00C4B4;font-size:20px;margin:0;">New Enquiry — AdVentures Academy</h2>
          </div>

          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:160px;">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;"><a href="mailto:${email}" style="color:#00C4B4;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${phone || 'Not provided'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Organisation</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-weight:600;">${organisation}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Focus Area</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${levelLabels[level] || level || 'Not specified'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Team Size</td>
                <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${teamSize || 'Not specified'}</td></tr>
          </table>

          <div style="margin-top:24px;">
            <p style="color:#6b7280;font-size:13px;margin-bottom:8px;">Message</p>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;font-size:15px;line-height:1.7;color:#111827;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
            Sent from ava.com.pk/contact · ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail({
      from: `"AdVentures Academy" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We received your message — AVA',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#060A14;padding:32px;border-radius:12px 12px 0 0;">
            <h2 style="color:#00C4B4;font-size:22px;margin:0 0 8px;">Thanks, ${firstName}.</h2>
            <p style="color:#8892A4;margin:0;font-size:15px;">We've received your message and will be in touch within 24 hours.</p>
          </div>
          <div style="background:#f9fafb;padding:32px;border-radius:0 0 12px 12px;">
            <p style="color:#374151;font-size:15px;line-height:1.7;">In the meantime, feel free to explore more about AVA at <a href="https://ava.com.pk" style="color:#00C4B4;">ava.com.pk</a>.</p>
            <p style="color:#374151;font-size:15px;line-height:1.7;">If you have any urgent questions, reach us at <a href="mailto:hello@adventures.studio" style="color:#00C4B4;">hello@adventures.studio</a>.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:13px;">AdVentures Academy · National Incubation Center, Islamabad</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ─── MEISTER PAGE GUARD (before static files) ───
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.path.startsWith('/meister/')) return next();

  const ip = getClientIP(req);
  if (isBlocked(ip)) return res.redirect('/');
  if (!isMeister(req)) return res.redirect('/meister');
  return next();
});

// ─── STATIC FILES ───
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.path.startsWith('/meister/')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AVA server running on http://localhost:${PORT}`);
});
