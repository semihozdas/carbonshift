import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.avatar_url, u.cc_balance, u.xp, u.level,
              u.total_co2_saved, u.total_distance_km, u.profile_completion_percentage,
              u.is_email_verified, u.city_id, u.district_id,
              c.name AS city_name, d.name AS district_name,
              ds.current_streak, ds.longest_streak
       FROM users u
       LEFT JOIN cities c ON u.city_id = c.id
       LEFT JOIN districts d ON u.district_id = d.id
       LEFT JOIN daily_streaks ds ON ds.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('me error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.put('/me', async (req, res) => {
  const { full_name, city_id, district_id, avatar_url } = req.body || {};
  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           city_id = COALESCE($2, city_id),
           district_id = COALESCE($3, district_id),
           avatar_url = COALESCE($4, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, full_name, avatar_url, city_id, district_id, cc_balance, xp, level`,
      [full_name, city_id, district_id, avatar_url, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('update me error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM cc_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
