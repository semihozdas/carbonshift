import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q, limit = 100, offset = 0 } = req.query;
  try {
    const where = q ? `WHERE u.full_name ILIKE $1 OR u.email ILIKE $1` : '';
    const params = q ? [`%${q}%`, Number(limit), Number(offset)] : [Number(limit), Number(offset)];
    const sql = `
      SELECT u.id, u.email, u.full_name, u.avatar_url, u.cc_balance, u.xp, u.level,
             u.total_co2_saved, u.is_banned, u.created_at, u.last_login,
             c.name AS city_name
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ${q ? '$2' : '$1'} OFFSET ${q ? '$3' : '$2'}
    `;
    const { rows } = await pool.query(sql, params);
    const { rows: countRows } = await pool.query(
      q ? `SELECT COUNT(*) c FROM users u ${where}` : `SELECT COUNT(*) c FROM users u`,
      q ? [`%${q}%`] : []
    );
    res.json({ users: rows, total: Number(countRows[0].c) });
  } catch (e) {
    console.error('admin users list error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [user, tx, activities, badges] = await Promise.all([
      pool.query(
        `SELECT u.*, c.name AS city_name, d.name AS district_name,
                ds.current_streak, ds.longest_streak
         FROM users u
         LEFT JOIN cities c ON u.city_id = c.id
         LEFT JOIN districts d ON u.district_id = d.id
         LEFT JOIN daily_streaks ds ON ds.user_id = u.id
         WHERE u.id = $1`,
        [id]
      ),
      pool.query(
        `SELECT * FROM cc_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [id]
      ),
      pool.query(
        `SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [id]
      ),
      pool.query(
        `SELECT b.*, ub.earned_at FROM user_badges ub
         JOIN badges b ON b.id = ub.badge_id
         WHERE ub.user_id = $1 ORDER BY ub.earned_at DESC`,
        [id]
      ),
    ]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ user: user.rows[0], transactions: tx.rows, activities: activities.rows, badges: badges.rows });
  } catch (e) {
    console.error('admin user detail error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/:id/adjust-cc', async (req, res) => {
  const id = Number(req.params.id);
  const { amount, reason } = req.body || {};
  if (!Number.isFinite(Number(amount))) return res.status(400).json({ error: 'amount gerekli' });
  try {
    await pool.query('UPDATE users SET cc_balance = cc_balance + $1 WHERE id = $2', [Number(amount), id]);
    await pool.query(
      `INSERT INTO cc_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'admin_adjustment', $3)`,
      [id, Number(amount), reason || 'Admin düzenlemesi']
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/:id/ban', async (req, res) => {
  const id = Number(req.params.id);
  const { banned = true } = req.body || {};
  try {
    await pool.query('UPDATE users SET is_banned = $1 WHERE id = $2', [!!banned, id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
