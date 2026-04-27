import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../../db/pool.js';
import { signAdminToken } from '../../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
    const admin = rows[0];

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });

    const token = signAdminToken(admin);
    res.json({
      token,
      admin: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role },
    });
  } catch (error) {
    console.error('admin login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/me', (req, res) => {
  // This is reachable only via adminAuth wrapper outside, so pass-through for health check
  res.json({ ok: true });
});

export default router;
