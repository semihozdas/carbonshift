import { Router } from 'express';
import pool from '../../db/pool.js';

/**
 * Generic CRUD router factory for simple tables.
 * @param {{ table: string, allowed: string[], orderBy?: string }} cfg
 */
export const crudRouter = ({ table, allowed, orderBy = 'id DESC' }) => {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
      res.json(rows);
    } catch (e) {
      console.error(`[${table}] list error:`, e.message);
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  });

  router.post('/', async (req, res) => {
    const body = req.body || {};
    const cols = Object.keys(body).filter((k) => allowed.includes(k));
    if (cols.length === 0) return res.status(400).json({ error: 'Geçersiz alanlar' });
    const vals = cols.map((k) => body[k]);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    try {
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      console.error(`[${table}] create error:`, e.message);
      res.status(400).json({ error: e.message });
    }
  });

  router.put('/:id', async (req, res) => {
    const body = req.body || {};
    const cols = Object.keys(body).filter((k) => allowed.includes(k));
    if (cols.length === 0) return res.status(400).json({ error: 'Geçersiz alanlar' });
    const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const vals = cols.map((k) => body[k]);
    vals.push(Number(req.params.id));
    try {
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${setSql} WHERE id = $${vals.length} RETURNING *`,
        vals
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Bulunamadı' });
      res.json(rows[0]);
    } catch (e) {
      console.error(`[${table}] update error:`, e.message);
      res.status(400).json({ error: e.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [Number(req.params.id)]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
