import pool from '../db/pool.js';

/**
 * Update daily streak: increment if activity is consecutive, reset if gap > 1 day.
 */
export const updateStreak = async (userId) => {
  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);

  const existing = await pool.query('SELECT * FROM daily_streaks WHERE user_id = $1', [userId]);

  if (existing.rows.length === 0) {
    const { rows } = await pool.query(
      `INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
       VALUES ($1, 1, 1, $2) RETURNING *`,
      [userId, todayDate]
    );
    return rows[0];
  }

  const streak = existing.rows[0];
  if (streak.last_activity_date) {
    const last = new Date(streak.last_activity_date);
    last.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const diffDays = Math.round((t - last) / 86400000);

    if (diffDays === 0) return streak;

    let newCurrent = diffDays === 1 ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newCurrent, streak.longest_streak);

    const { rows } = await pool.query(
      `UPDATE daily_streaks
       SET current_streak = $1, longest_streak = $2, last_activity_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4 RETURNING *`,
      [newCurrent, newLongest, todayDate, userId]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `UPDATE daily_streaks
     SET current_streak = 1, longest_streak = GREATEST(longest_streak, 1),
         last_activity_date = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2 RETURNING *`,
    [todayDate, userId]
  );
  return rows[0];
};

/**
 * Update progress for active tasks based on a new activity.
 * Returns array of tasks that were just completed.
 */
export const updateTaskProgress = async (userId, activity) => {
  const { rows: tasks } = await pool.query(
    `SELECT * FROM tasks WHERE is_active = TRUE`
  );
  const completed = [];

  for (const task of tasks) {
    let delta = 0;
    switch (task.requirement_type) {
      case 'steps':
        delta = activity.step_count || Math.round((activity.distance_km || 0) * 1300);
        break;
      case 'walk_km':
        if (activity.transport_mode === 'walk') delta = activity.distance_km;
        break;
      case 'bus_km':
        if (activity.transport_mode === 'bus') delta = activity.distance_km;
        break;
      case 'bike_km':
        if (activity.transport_mode === 'bike') delta = activity.distance_km;
        break;
      case 'bus_trips':
        if (activity.transport_mode === 'bus') delta = 1;
        break;
      case 'activities':
        delta = 1;
        break;
      case 'co2_saved':
        delta = Math.max(0, activity.co2_saved || 0);
        break;
    }

    if (delta <= 0) continue;

    const periodStart = periodStartFor(task.type);
    const upsert = await pool.query(
      `INSERT INTO user_tasks (user_id, task_id, progress, period_start)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, task_id, period_start) DO UPDATE
         SET progress = user_tasks.progress + EXCLUDED.progress,
             last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, task.id, delta, periodStart]
    );

    const ut = upsert.rows[0];
    if (!ut.is_completed && Number(ut.progress) >= Number(task.requirement_value)) {
      await pool.query(
        `UPDATE user_tasks SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [ut.id]
      );
      completed.push(task);
    }
  }
  return completed;
};

const periodStartFor = (type) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (type === 'daily') return d.toISOString().slice(0, 10);
  if (type === 'weekly') {
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }
  if (type === 'monthly') {
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

/**
 * Evaluate & unlock badges based on current user totals.
 */
export const evaluateBadges = async (userId) => {
  const { rows: user } = await pool.query(
    `SELECT u.*, ds.current_streak, ds.longest_streak
     FROM users u
     LEFT JOIN daily_streaks ds ON ds.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  if (user.length === 0) return [];
  const u = user[0];

  const walkAgg = await pool.query(
    `SELECT COALESCE(SUM(distance_km),0) km FROM activities WHERE user_id = $1 AND transport_mode = 'walk' AND is_anomaly = FALSE`,
    [userId]
  );
  const bikeAgg = await pool.query(
    `SELECT COALESCE(SUM(distance_km),0) km FROM activities WHERE user_id = $1 AND transport_mode = 'bike' AND is_anomaly = FALSE`,
    [userId]
  );
  const busTripsAgg = await pool.query(
    `SELECT COUNT(*) c FROM activities WHERE user_id = $1 AND transport_mode = 'bus' AND is_anomaly = FALSE`,
    [userId]
  );
  const firstAct = await pool.query(
    `SELECT 1 FROM activities WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  const stats = {
    first_activity: firstAct.rows.length > 0 ? 1 : 0,
    walk_km: Number(walkAgg.rows[0].km),
    bike_km: Number(bikeAgg.rows[0].km),
    bus_trips: Number(busTripsAgg.rows[0].c),
    co2_saved: Number(u.total_co2_saved),
    streak: Number(u.current_streak || 0),
  };

  const { rows: badges } = await pool.query(
    `SELECT b.* FROM badges b
     WHERE b.is_active = TRUE
       AND b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = $1)`,
    [userId]
  );

  const unlocked = [];
  for (const b of badges) {
    if (stats[b.requirement_code] !== undefined && stats[b.requirement_code] >= Number(b.requirement_value)) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, b.id]
      );
      if (Number(b.cc_reward) > 0) {
        await pool.query('UPDATE users SET cc_balance = cc_balance + $1 WHERE id = $2', [b.cc_reward, userId]);
        await pool.query(
          `INSERT INTO cc_transactions (user_id, amount, type, description)
           VALUES ($1, $2, 'badge_reward', $3)`,
          [userId, b.cc_reward, `Rozet: ${b.name}`]
        );
      }
      unlocked.push(b);
    }
  }
  return unlocked;
};

/**
 * Increment community task contribution based on activity.
 */
export const contributeToCommunity = async (userId, activity) => {
  const { rows: tasks } = await pool.query(
    `SELECT * FROM community_tasks WHERE is_completed = FALSE AND (end_date IS NULL OR end_date > NOW())`
  );
  for (const ct of tasks) {
    let delta = 0;
    if (ct.unit === 'km') delta = activity.distance_km;
    else if (ct.unit === 'kg CO2') delta = Math.max(0, activity.co2_saved || 0);
    if (delta <= 0) continue;

    await pool.query(
      `UPDATE community_tasks SET current_value = current_value + $1 WHERE id = $2`,
      [delta, ct.id]
    );
    await pool.query(
      `INSERT INTO community_task_participants (community_task_id, user_id, contribution)
       VALUES ($1, $2, $3)
       ON CONFLICT (community_task_id, user_id) DO UPDATE
       SET contribution = community_task_participants.contribution + EXCLUDED.contribution`,
      [ct.id, userId, delta]
    );
  }
};
