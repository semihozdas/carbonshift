import { Router } from 'express';
import pool from '../../db/pool.js';
import { calculateCarbonAndCC, calculateCarbonAndCCFromBreakdown } from '../../services/locationService.js';
import { detectAnomaly } from '../../services/anomalyService.js';
import {
  updateStreak,
  updateTaskProgress,
  evaluateBadges,
  contributeToCommunity,
} from '../../services/gamificationService.js';

const router = Router();

router.get('/', async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 30);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/today', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activities
       WHERE user_id = $1 AND created_at >= CURRENT_DATE
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const totals = await pool.query(
      `SELECT
         COALESCE(SUM(distance_km),0) AS total_km,
         COALESCE(SUM(co2_saved),0) AS total_co2,
         COALESCE(SUM(cc_earned),0) AS total_cc,
         COUNT(*) AS activity_count
       FROM activities
       WHERE user_id = $1 AND is_anomaly = FALSE`,
      [req.user.id]
    );
    const today = await pool.query(
      `SELECT
         COALESCE(SUM(distance_km),0) AS km,
         COALESCE(SUM(co2_saved),0) AS co2,
         COALESCE(SUM(cc_earned),0) AS cc,
         COALESCE(SUM(step_count),0) AS steps
       FROM activities
       WHERE user_id = $1 AND is_anomaly = FALSE AND created_at >= CURRENT_DATE`,
      [req.user.id]
    );
    const week = await pool.query(
      `SELECT DATE_TRUNC('day', created_at)::date AS day,
              COALESCE(SUM(distance_km),0) AS km,
              COALESCE(SUM(co2_saved),0) AS co2
       FROM activities
       WHERE user_id = $1 AND is_anomaly = FALSE
         AND created_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY day
       ORDER BY day`,
      [req.user.id]
    );
    res.json({
      totals: totals.rows[0],
      today: today.rows[0],
      week: week.rows,
    });
  } catch (e) {
    console.error('summary error:', e);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user.id;
  const {
    mode,
    distance_km,
    duration_minutes,
    avg_speed_kmh,
    step_count,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    walk_km,
    bus_km,
    bike_km,
    car_km,
    segments,
  } = req.body || {};

  // Detect mixed-mode payload (any per-mode km > 0 means client sent breakdown).
  const breakdown = {
    walk_km: Number(walk_km) || 0,
    bus_km: Number(bus_km) || 0,
    bike_km: Number(bike_km) || 0,
    car_km: Number(car_km) || 0,
  };
  const hasMixedBreakdown = Object.values(breakdown).some((v) => v > 0);

  // Dominant mode = mode with most km (used for transport_mode, tasks, badges).
  let dominantMode = mode;
  if (hasMixedBreakdown) {
    const modeKm = {
      walk: breakdown.walk_km,
      bus: breakdown.bus_km,
      bike: breakdown.bike_km,
      car: breakdown.car_km,
    };
    dominantMode = Object.entries(modeKm).sort(([, a], [, b]) => b - a)[0][0];
  }

  if (!['walk', 'bus', 'car', 'bike'].includes(dominantMode)) {
    return res.status(400).json({ error: 'Geçersiz ulaşım modu.' });
  }
  if (!distance_km || Number(distance_km) <= 0) {
    return res.status(400).json({ error: 'Mesafe pozitif olmalı.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Active campaign multiplier
    const { rows: camp } = await client.query(
      `SELECT COALESCE(MAX(cc_bonus_multiplier), 1.0) AS mult
       FROM campaigns WHERE is_active = TRUE AND (end_date IS NULL OR end_date > NOW())`
    );
    const multiplier = Number(camp[0].mult) || 1.0;

    const { co2Saved, ccEarned, xp } = hasMixedBreakdown
      ? await calculateCarbonAndCCFromBreakdown(breakdown, multiplier)
      : await calculateCarbonAndCC(dominantMode, distance_km, multiplier);

    const anomaly = await detectAnomaly({
      mode: dominantMode,
      distance_km,
      duration_minutes,
      avg_speed_kmh,
      segments: Array.isArray(segments) ? segments : null,
      distanceBreakdown: hasMixedBreakdown ? breakdown : null,
    });

    const insert = await client.query(
      `INSERT INTO activities
        (user_id, transport_mode, distance_km, co2_saved, cc_earned, duration_minutes,
         avg_speed_kmh, step_count, start_lat, start_lng, end_lat, end_lng,
         is_anomaly, anomaly_reason,
         walk_km, bike_km, bus_km, car_km, segments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        userId, dominantMode, distance_km, co2Saved, ccEarned, duration_minutes,
        avg_speed_kmh, step_count, start_lat, start_lng, end_lat, end_lng,
        anomaly.is_anomaly, anomaly.anomaly_reason,
        hasMixedBreakdown ? breakdown.walk_km : 0,
        hasMixedBreakdown ? breakdown.bike_km : 0,
        hasMixedBreakdown ? breakdown.bus_km : 0,
        hasMixedBreakdown ? breakdown.car_km : 0,
        Array.isArray(segments) ? JSON.stringify(segments) : null,
      ]
    );
    const activity = insert.rows[0];

    if (!anomaly.is_anomaly) {
      await client.query(
        `UPDATE users
         SET cc_balance = cc_balance + $1,
             total_co2_saved = total_co2_saved + GREATEST(0, $2::numeric),
             total_distance_km = total_distance_km + $3,
             xp = xp + $4,
             daily_steps = COALESCE(daily_steps,0) + COALESCE($5, 0)
         WHERE id = $6`,
        [ccEarned, co2Saved, distance_km, xp, step_count, userId]
      );

      if (ccEarned !== 0) {
        await client.query(
          `INSERT INTO cc_transactions (user_id, amount, type, description)
           VALUES ($1, $2, 'activity', $3)`,
          [userId, ccEarned, `${dominantMode} • ${Number(distance_km).toFixed(2)} km`]
        );
      }
    } else {
      await client.query(
        `INSERT INTO security_logs (user_id, event_type, description, severity, metadata)
         VALUES ($1, 'activity_anomaly', $2, 'warning', $3)`,
        [userId, anomaly.anomaly_reason, JSON.stringify({ mode: dominantMode, distance_km, duration_minutes, breakdown: hasMixedBreakdown ? breakdown : null })]
      );
    }

    await client.query('COMMIT');

    // Post-commit side effects (best-effort)
    let streak = null;
    let newTasksCompleted = [];
    let newBadges = [];
    if (!anomaly.is_anomaly) {
      try { streak = await updateStreak(userId); } catch (_) {}
      try { newTasksCompleted = await updateTaskProgress(userId, activity); } catch (_) {}
      try { newBadges = await evaluateBadges(userId); } catch (_) {}
      try { await contributeToCommunity(userId, activity); } catch (_) {}
    }

    res.json({ activity, streak, newTasksCompleted, newBadges });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('activity insert error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    client.release();
  }
});

export default router;
