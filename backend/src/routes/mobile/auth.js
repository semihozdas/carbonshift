import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../db/pool.js';
import { signMobileToken } from '../../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password, full_name, city_id, district_id } = req.body || {};
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Geçerli e-posta ve en az 6 karakterli şifre gerekli.' });
  }

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Bu e-posta ile kayıtlı bir hesap var.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, city_id, district_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name`,
      [email, hash, full_name || null, city_id || null, district_id || null]
    );
    const user = rows[0];
    const token = signMobileToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('register error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0 || !rows[0].password_hash) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    }
    const user = rows[0];
    if (user.is_banned) return res.status(403).json({ error: 'Hesap askıya alındı.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    const token = signMobileToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/firebase-exchange', async (req, res) => {
  // Client sends Firebase ID token; server verifies and issues our JWT
  // The mobileAuth middleware upserts the user automatically on its first call,
  // so we just return the token after verifying via a simple check here.
  // For simplicity, mobile clients can use their Firebase token directly.
  return res.status(501).json({ error: 'Kullanim disi: Firebase ID token Authorization header olarak gonderilebilir.' });
});

export default router;
