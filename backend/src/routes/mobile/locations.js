import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/cities', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cities ORDER BY name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/cities/:id/districts', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM districts WHERE city_id = $1 ORDER BY name',
      [Number(req.params.id)]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
