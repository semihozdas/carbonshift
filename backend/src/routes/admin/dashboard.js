import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/stats', async (_req, res) => {
  try {
    const [users, cc, co2, anomalies, activitiesToday] = await Promise.all([
      pool.query('SELECT COUNT(*) c FROM users WHERE is_banned = FALSE'),
      pool.query('SELECT COALESCE(SUM(cc_balance),0) s FROM users'),
      pool.query('SELECT COALESCE(SUM(total_co2_saved),0) s FROM users'),
      pool.query('SELECT COUNT(*) c FROM activities WHERE is_anomaly = TRUE'),
      pool.query('SELECT COUNT(*) c FROM activities WHERE created_at >= CURRENT_DATE'),
    ]);
    res.json({
      users: Number(users.rows[0].c),
      cc_total: Number(cc.rows[0].s),
      co2_total: Number(co2.rows[0].s),
      anomalies: Number(anomalies.rows[0].c),
      activities_today: Number(activitiesToday.rows[0].c),
    });
  } catch (e) {
    console.error('admin stats error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/chart/activity', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DATE_TRUNC('day', created_at)::date AS day,
              COALESCE(SUM(distance_km),0)::float AS km,
              COALESCE(SUM(co2_saved),0)::float AS co2,
              COUNT(*)::int AS count
       FROM activities
       WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
       GROUP BY day ORDER BY day`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/chart/transport-mode', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT transport_mode, COUNT(*)::int c, COALESCE(SUM(distance_km),0)::float km
       FROM activities WHERE is_anomaly = FALSE
       GROUP BY transport_mode`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/recent-activities', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name, u.email
       FROM activities a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
