import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

const periodStartSQL = (type) => {
  if (type === 'daily') return "CURRENT_DATE";
  if (type === 'weekly') return "DATE_TRUNC('week', CURRENT_DATE)::date";
  if (type === 'monthly') return "DATE_TRUNC('month', CURRENT_DATE)::date";
  return "CURRENT_DATE";
};

router.get('/', async (req, res) => {
  const type = ['daily', 'weekly', 'monthly'].includes(req.query.type) ? req.query.type : null;
  try {
    const q = `
      SELECT t.*,
             COALESCE(ut.progress, 0) AS progress,
             COALESCE(ut.is_completed, FALSE) AS is_completed,
             COALESCE(ut.is_claimed, FALSE) AS is_claimed
      FROM tasks t
      LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
        AND ut.period_start = (
          CASE t.type
            WHEN 'daily' THEN CURRENT_DATE
            WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE)::date
            WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::date
          END
        )
      WHERE t.is_active = TRUE
        ${type ? 'AND t.type = $2' : ''}
      ORDER BY t.type, t.id
    `;
    const params = type ? [req.user.id, type] : [req.user.id];
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) {
    console.error('tasks list error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/:id/claim', async (req, res) => {
  const taskId = Number(req.params.id);
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: trows } = await client.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (trows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }
    const task = trows[0];

    const { rows: utRows } = await client.query(
      `SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2
       AND period_start = (
         CASE $3::text
           WHEN 'daily' THEN CURRENT_DATE
           WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE)::date
           WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::date
         END
       )`,
      [userId, taskId, task.type]
    );
    if (utRows.length === 0 || !utRows[0].is_completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Görev henüz tamamlanmadı.' });
    }
    if (utRows[0].is_claimed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ödül zaten alındı.' });
    }

    await client.query('UPDATE user_tasks SET is_claimed = TRUE WHERE id = $1', [utRows[0].id]);
    await client.query(
      `UPDATE users SET cc_balance = cc_balance + $1, xp = xp + $2 WHERE id = $3`,
      [task.cc_reward, task.xp_reward, userId]
    );
    await client.query(
      `INSERT INTO cc_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'task_completion', $3)`,
      [userId, task.cc_reward, `Görev: ${task.title}`]
    );

    await client.query('COMMIT');
    res.json({ ok: true, cc_earned: task.cc_reward, xp_earned: task.xp_reward });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('claim task error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    client.release();
  }
});

export default router;
