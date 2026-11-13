/* Admin login: username + password come from Vercel environment variables
   or fallback to dummy demo credentials for immediate testing.
   A signed, HttpOnly cookie keeps you logged in for 7 days.

   Optional/Production environment variables (Vercel > Settings > Environment Variables):
     ADMIN_USERNAME   your custom login name
     ADMIN_PASSWORD   your custom password
     SESSION_SECRET   any long random text, at least 32 characters */

import crypto from 'node:crypto';
import { send } from './http.js';
import store from './db.js';

const COOKIE = 'aisha_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const FALLBACK_SECRET = 'aisha-portfolio-demo-session-secret-key-32chars-minimum!';

// Configured default credentials for Aisha's portfolio dashboard
export const DEFAULT_ADMIN_USER = 'aisha_muhammad_ali_@7623';
export const DEFAULT_ADMIN_PASS = 'aisha_MUHAMMAD@#!Ali';

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) return FALLBACK_SECRET;
  return value;
}

const base64url = (input) => Buffer.from(input).toString('base64url');

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

// Compares two strings in constant time, so the check doesn't leak timing
export function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const a = Buffer.from(testHash, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function checkCredentials(username, password) {
  const u = String(username || '').trim();
  const p = String(password || '');

  // 1. Check against database-stored credentials (Neon Postgres or local JSON store)
  try {
    const creds = await store.getAdminCredentials(u);
    if (creds && creds.username) {
      const userOk = safeEqual(u, creds.username);
      let passOk = false;
      if (creds.password_hash && creds.salt) {
        passOk = verifyPassword(p, creds.password_hash, creds.salt);
      } else if (creds.password) {
        passOk = safeEqual(p, creds.password);
      }
      if (userOk && passOk) return true;
    }
  } catch (err) {
    console.warn('[Auth] Database credentials check error:', err.message);
  }

  // 2. Check environment variables
  const expectedUser = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;

  if (expectedUser && expectedPass) {
    const userOk = safeEqual(u, expectedUser);
    const passOk = safeEqual(p, expectedPass);
    if (userOk && passOk) return true;
  }

  // 3. Fallback default credentials
  if (safeEqual(u, DEFAULT_ADMIN_USER) && safeEqual(p, DEFAULT_ADMIN_PASS)) {
    return true;
  }

  return false;
}

export function createSession(username) {
  const payload = base64url(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + MAX_AGE }));
  return payload + '.' + sign(payload);
}

function readCookie(req, name) {
  const header = req.headers?.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function getSession(req) {
  const token = readCookie(req, COOKIE);
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  if (signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function sessionCookie(token, req) {
  const isProd = process.env.NODE_ENV === 'production';
  const isHttps = req && (req.headers?.['x-forwarded-proto'] === 'https' || req.socket?.encrypted);
  const secureFlag = (isProd || isHttps) ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearCookie(req) {
  const isProd = process.env.NODE_ENV === 'production';
  const isHttps = req && (req.headers?.['x-forwarded-proto'] === 'https' || req.socket?.encrypted);
  const secureFlag = (isProd || isHttps) ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=0`;
}

// Returns the session, or sends 401 and returns null
export function requireAdmin(req, res) {
  const session = getSession(req);
  if (!session) {
    send(res, 401, { error: 'Please log in again.' });
    return null;
  }
  return session;
}
