import type { NextApiRequest, NextApiResponse } from 'next';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meister-ava-2026';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const attemptLog: { [ip: string]: { attempts: number; blockedUntil?: number } } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipKey = Array.isArray(clientIp) ? clientIp[0] : clientIp;

  // Check if blocked
  const isBlocked = attemptLog[ipKey]?.blockedUntil && attemptLog[ipKey].blockedUntil > Date.now();
  if (isBlocked) {
    return res.status(200).json({ blocked: true });
  }

  // Check if authenticated
  const authCookie = req.cookies['meister-auth'];
  const isAuthenticated = authCookie === 'true';

  const attemptsLeft = attemptLog[ipKey] ? MAX_ATTEMPTS - attemptLog[ipKey].attempts : MAX_ATTEMPTS;

  return res.status(200).json({
    authenticated: isAuthenticated,
    blocked: false,
    attemptsLeft,
  });
}
