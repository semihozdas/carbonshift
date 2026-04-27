import bcrypt from 'bcryptjs';
import pool from './pool.js';

export const seedAdmin = async () => {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@carbonshift.local';
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123';

  const existing = await pool.query('SELECT id, password_hash FROM admin_users WHERE email = $1', [email]);
  const hash = await bcrypt.hash(password, 10);

  if (existing.rows.length === 0) {
    await pool.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'admin')`,
      [email, hash, 'CarbonShift Admin']
    );
    console.log(`[seed] admin user created: ${email}`);
  } else {
    // Re-hash in case env password changed OR prior hash was a placeholder
    const needsRehash = !existing.rows[0].password_hash?.startsWith('$2');
    if (needsRehash) {
      await pool.query('UPDATE admin_users SET password_hash = $1 WHERE email = $2', [hash, email]);
      console.log(`[seed] admin password re-hashed: ${email}`);
    }
  }
};

export const seedDemoUser = async () => {
  const email = 'demo@carbonshift.local';
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return;

  const hash = await bcrypt.hash('demo123', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, city_id, district_id, xp, cc_balance, total_co2_saved)
     VALUES ($1, $2, 'Demo Kullanıcı', 1, 1, 450, 320, 8.4)`,
    [email, hash]
  );
  console.log(`[seed] demo user created: ${email} / demo123`);
};

export const runSeeds = async () => {
  try {
    await seedAdmin();
    await seedDemoUser();
  } catch (error) {
    console.error('[seed] error:', error.message);
  }
};
