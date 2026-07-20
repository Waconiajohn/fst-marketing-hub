import { mintToken, safeEqual } from './_auth.js';

// 8 hours — a working day. After that the team re-enters the password.
const TTL_SECONDS = 60 * 60 * 8;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appPassword = process.env.APP_PASSWORD;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!appPassword || !jwtSecret) {
    return res.status(500).json({
      error: 'Login is not configured — set APP_PASSWORD and SUPABASE_JWT_SECRET in Vercel environment variables',
    });
  }

  const { password } = req.body || {};
  if (!password || !safeEqual(password, appPassword)) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  const token = mintToken(jwtSecret, TTL_SECONDS);
  res.setHeader('Set-Cookie',
    `fst_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL_SECONDS}`);
  return res.status(200).json({ token, expiresIn: TTL_SECONDS });
}
