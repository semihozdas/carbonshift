import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  const { anomaly, mode, limit = 100, offset = 0 } = req.query;
  const conditions = [];
  const params = [];
  if (anomaly === 'true') conditions.push('a.is_anomaly = TRUE');
  if (mode) {
    params.push(mode);
    conditions.push(`a.transport_mode = $${params.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(Number(limit), Number(offset));

  try {
    const sql = `
      SELECT a.*, u.full_name, u.email
      FROM activities a
      JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('admin activities error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM activities WHERE id = $1', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/:id/mark-clean', async (req, res) => {
  try {
    await pool.query(
      `UPDATE activities SET is_anomaly = FALSE, anomaly_reason = NULL WHERE id = $1`,
      [Number(req.params.id)]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
