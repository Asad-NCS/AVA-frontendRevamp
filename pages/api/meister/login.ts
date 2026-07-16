import type { NextApiRequest, NextApiResponse } from 'next';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meister-ava-2026';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// In-memory attempt tracking (reset on server restart)
const attemptLog: { [ip: string]: { attempts: number; blockedUntil?: number } } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipKey = Array.isArray(clientIp) ? clientIp[0] : clientIp;

  // Check if IP is blocked
  if (attemptLog[ipKey]?.blockedUntil && attemptLog[ipKey].blockedUntil > Date.now()) {
    return res.status(429).json({ blocked: true, error: 'Too many attempts. Try again later.' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  // Track attempt
  if (!attemptLog[ipKey]) {
    attemptLog[ipKey] = { attempts: 0 };
  }

  attemptLog[ipKey].attempts++;

  if (attemptLog[ipKey].attempts > MAX_ATTEMPTS) {
    attemptLog[ipKey].blockedUntil = Date.now() + LOCKOUT_TIME;
    return res.status(429).json({
      blocked: true,
      error: 'Too many attempts. Try again in 15 minutes.',
    });
  }

  const attemptsLeft = MAX_ATTEMPTS - attemptLog[ipKey].attempts;

  if (password === ADMIN_PASSWORD) {
    // Clear attempts on success
    delete attemptLog[ipKey];

    // Set cookie
    res.setHeader('Set-Cookie', `meister-auth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    return res.status(200).json({ success: true });
  }

  return res.status(401).json({
    success: false,
    error: 'Incorrect password',
    attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
  });
}
