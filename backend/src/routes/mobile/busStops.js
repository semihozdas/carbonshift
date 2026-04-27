import { Router } from 'express';
import pool from '../../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  const cityId = Number(req.query.city_id) || null;
  try {
    const q = cityId
      ? 'SELECT * FROM bus_stops WHERE city_id = $1 ORDER BY id'
      : 'SELECT * FROM bus_stops ORDER BY id';
    const params = cityId ? [cityId] : [];
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/nearby', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radius_km) || 2;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'lat/lng gerekli' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT *,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance_km
       FROM bus_stops
       ORDER BY distance_km
       LIMIT 50`,
      [lat, lng]
    );
    res.json(rows.filter((r) => Number(r.distance_km) <= radiusKm));
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
