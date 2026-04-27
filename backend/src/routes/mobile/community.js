import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/leaderboard', async (req, res) => {
  const period = req.query.period === 'month' ? 'month' : req.query.period === 'all' ? 'all' : 'week';
  try {
    const dateFilter =
      period === 'all'
        ? ''
        : period === 'month'
        ? "AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)"
        : "AND a.created_at >= DATE_TRUNC('week', CURRENT_DATE)";

    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.level, u.xp, u.avatar_url,
              COALESCE(SUM(a.cc_earned), 0)::numeric AS cc_period,
              COALESCE(SUM(a.co2_saved), 0)::numeric AS co2_period,
              COALESCE(SUM(a.distance_km), 0)::numeric AS km_period
       FROM users u
       LEFT JOIN activities a ON a.user_id = u.id AND a.is_anomaly = FALSE ${dateFilter}
       WHERE u.is_banned = FALSE
       GROUP BY u.id
       ORDER BY cc_period DESC, u.xp DESC
       LIMIT 50`
    );

    const myRank = rows.findIndex((r) => r.id === req.user.id) + 1;
    res.json({ leaderboard: rows, my_rank: myRank || null, period });
  } catch (e) {
    console.error('leaderboard error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/tasks', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM community_tasks
       WHERE is_completed = FALSE
         AND (end_date IS NULL OR end_date > NOW())
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/campaigns', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM campaigns
       WHERE is_active = TRUE AND (end_date IS NULL OR end_date > NOW())
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
