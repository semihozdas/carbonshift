import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM daily_streaks WHERE user_id = $1',
      [req.user.id]
    );
    res.json(rows[0] || { current_streak: 0, longest_streak: 0, last_activity_date: null });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
