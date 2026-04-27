import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*,
              ub.earned_at,
              (ub.id IS NOT NULL) AS is_earned
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1
       WHERE b.is_active = TRUE
       ORDER BY is_earned DESC, b.id`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
