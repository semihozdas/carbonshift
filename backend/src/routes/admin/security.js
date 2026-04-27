import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/logs', async (req, res) => {
  const limit = Math.min(500, Number(req.query.limit) || 100);
  const severity = req.query.severity;
  try {
    const params = [];
    let where = '';
    if (severity) {
      params.push(severity);
      where = `WHERE severity = $${params.length}`;
    }
    params.push(limit);
    const sql = `
      SELECT sl.*, u.email, u.full_name
      FROM security_logs sl
      LEFT JOIN users u ON u.id = sl.user_id
      ${where}
      ORDER BY sl.created_at DESC
      LIMIT $${params.length}
    `;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
