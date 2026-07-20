// Shared auth helpers for the FST Marketing Hub serverless routes.
// The underscore prefix keeps Vercel from treating this file as a route.
//
// The team logs in once with a shared APP_PASSWORD (via /api/login). In return
// they get a short-lived token that is ALSO a valid Supabase "authenticated" JWT
// (signed with the project's JWT secret). That single token does two jobs:
//   1. Gates /api/config, /api/generate, /api/blotato — sent back as an HttpOnly
//      cookie, so those routes reject anyone who hasn't logged in.
//   2. Lets the browser talk to Supabase as an authenticated user, so we can lock
//      RLS to `authenticated` and the public anon key alone can no longer read
//      or write any table.
// The secret that mints tokens never leaves the server.

import crypto from 'node:crypto';

function b64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlToBuf(input) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function hmac(data, secret) {
  return b64url(crypto.createHmac('sha256', secret).update(data).digest());
}

// Mint a Supabase-compatible HS256 JWT with the `authenticated` role.
export function mintToken(secret, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    role: 'authenticated',
    aud: 'authenticated',
    sub: 'fst-team',
    iat: now,
    exp: now + ttlSeconds,
  }));
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${hmac(signingInput, secret)}`;
}

// Verify signature + expiry. Returns the decoded payload or null.
export function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = hmac(`${header}.${payload}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let claims;
  try {
    claims = JSON.parse(b64urlToBuf(payload).toString('utf8'));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!claims.exp || claims.exp < now) return null;
  return claims;
}

// Constant-time string compare that doesn't leak length via early return timing
// any more than necessary. Returns false on any mismatch.
export function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Pull the token from the HttpOnly cookie first, then a Bearer header.
export function readToken(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/(?:^|;\s*)fst_session=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// Gate a route. Writes the error response and returns null when unauthenticated,
// so callers can do: `if (!requireAuth(req, res)) return;`
export function requireAuth(req, res) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SUPABASE_JWT_SECRET is not configured in Vercel environment variables' });
    return null;
  }
  const claims = verifyToken(readToken(req), secret);
  if (!claims) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return claims;
}
