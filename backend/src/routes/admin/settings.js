import { Router } from 'express';
import pool from '../../db/pool.js';
import { invalidateSettingsCache } from '../../services/locationService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM system_settings ORDER BY key');
    // Return as key->value object for easier frontend consumption
    const obj = {};
    for (const r of rows) obj[r.key] = Number(r.value);
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Bulk update: PUT /settings with body { key1: val1, key2: val2, ... }
router.put('/', async (req, res) => {
  const body = req.body || {};
  const entries = Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return res.status(400).json({ error: 'Boş istek' });
  try {
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }
    invalidateSettingsCache();
    res.json({ ok: true, updated: entries.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:key', async (req, res) => {
  const { value, description } = req.body || {};
  try {
    const { rows } = await pool.query(
      `INSERT INTO system_settings (key, value, description, updated_at)
       VALUES ($1, $2, COALESCE($3, ''), CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             description = COALESCE(EXCLUDED.description, system_settings.description),
             updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.params.key, String(value), description ?? null]
    );
    invalidateSettingsCache();
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
