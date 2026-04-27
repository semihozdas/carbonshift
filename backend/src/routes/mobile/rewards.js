import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rewards WHERE is_active = TRUE ORDER BY cc_cost ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/redemptions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, rw.title, rw.icon
       FROM reward_redemptions r
       JOIN rewards rw ON rw.id = r.reward_id
       WHERE r.user_id = $1
       ORDER BY r.redeemed_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/:id/redeem', async (req, res) => {
  const rewardId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: rws } = await client.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = TRUE FOR UPDATE',
      [rewardId]
    );
    if (rws.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ödül bulunamadı' });
    }
    const reward = rws[0];
    if (reward.stock_count === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Stok tükendi' });
    }

    const { rows: urows } = await client.query(
      'SELECT cc_balance FROM users WHERE id = $1 FOR UPDATE',
      [req.user.id]
    );
    const balance = Number(urows[0].cc_balance);
    if (balance < Number(reward.cc_cost)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Yetersiz bakiye' });
    }

    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    await client.query(
      `INSERT INTO reward_redemptions (user_id, reward_id, redemption_code) VALUES ($1, $2, $3)`,
      [req.user.id, rewardId, code]
    );
    await client.query(
      `UPDATE users SET cc_balance = cc_balance - $1 WHERE id = $2`,
      [reward.cc_cost, req.user.id]
    );
    await client.query(
      `INSERT INTO cc_transactions (user_id, amount, type, description)
       VALUES ($1, $2, 'reward_redemption', $3)`,
      [req.user.id, -Number(reward.cc_cost), `Ödül: ${reward.title}`]
    );
    if (reward.stock_count > 0) {
      await client.query(
        `UPDATE rewards SET stock_count = stock_count - 1 WHERE id = $1`,
        [rewardId]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, redemption_code: code, title: reward.title });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('redeem error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    client.release();
  }
});

export default router;
