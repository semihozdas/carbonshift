import app from './app.js';
import dotenv from 'dotenv';
import pool from './db/pool.js';
import { runSeeds } from './db/seed.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    await pool.query('SELECT 1');
    console.log('[boot] PostgreSQL connected');
    await runSeeds();
  } catch (e) {
    console.error('[boot] DB connection failed:', e.message);
    console.error('[boot] server will still start; requests will error until DB is reachable.');
  }

  app.listen(PORT, () => {
    console.log(`[boot] CarbonShift backend listening on :${PORT}`);
  });
}

bootstrap();
