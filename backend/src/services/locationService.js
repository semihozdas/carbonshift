import pool from '../db/pool.js';

const settingsCache = { data: null, ts: 0 };
const SETTINGS_TTL_MS = 60_000;

export const getSettings = async () => {
  if (settingsCache.data && Date.now() - settingsCache.ts < SETTINGS_TTL_MS) {
    return settingsCache.data;
  }
  const { rows } = await pool.query('SELECT key, value FROM system_settings');
  const data = {};
  for (const r of rows) data[r.key] = parseFloat(r.value);
  settingsCache.data = data;
  settingsCache.ts = Date.now();
  return data;
};

export const invalidateSettingsCache = () => {
  settingsCache.data = null;
};

export const calculateCarbonAndCC = async (mode, distanceKm, multiplier = 1) => {
  const s = await getSettings();
  let co2Saved = 0;
  let ccEarned = 0;
  let xp = 0;

  const d = Math.max(0, Number(distanceKm) || 0);

  switch (mode) {
    case 'walk':
      co2Saved = (s.walk_co2_saved_per_km ?? 0.192) * d;
      ccEarned = (s.walk_cc_per_km ?? 10) * d;
      xp = (s.xp_per_km_walk ?? 15) * d;
      break;
    case 'bus':
      co2Saved = (s.bus_co2_saved_per_km ?? 0.103) * d;
      ccEarned = (s.bus_cc_per_km ?? 5) * d;
      xp = (s.xp_per_km_bus ?? 5) * d;
      break;
    case 'bike':
      co2Saved = (s.bike_co2_saved_per_km ?? 0.192) * d;
      ccEarned = (s.bike_cc_per_km ?? 8) * d;
      xp = (s.xp_per_km_bike ?? 12) * d;
      break;
    case 'car':
      co2Saved = -(s.car_co2_emitted_per_km ?? 0.192) * d;
      ccEarned = (s.car_cc_penalty_per_km ?? -2) * d;
      xp = 0;
      break;
  }

  ccEarned *= multiplier;

  return {
    co2Saved: Math.round(co2Saved * 1000) / 1000,
    ccEarned: Math.round(ccEarned * 100) / 100,
    xp: Math.round(xp),
  };
};

export const calculateCarbonAndCCFromBreakdown = async (
  { walk_km = 0, bus_km = 0, bike_km = 0, car_km = 0 },
  multiplier = 1,
) => {
  const s = await getSettings();
  let co2Saved = 0;
  let ccEarned = 0;
  let xp = 0;

  const w = Math.max(0, Number(walk_km) || 0);
  co2Saved += (s.walk_co2_saved_per_km ?? 0.192) * w;
  ccEarned += (s.walk_cc_per_km ?? 10) * w;
  xp += (s.xp_per_km_walk ?? 15) * w;

  const bu = Math.max(0, Number(bus_km) || 0);
  co2Saved += (s.bus_co2_saved_per_km ?? 0.103) * bu;
  ccEarned += (s.bus_cc_per_km ?? 5) * bu;
  xp += (s.xp_per_km_bus ?? 5) * bu;

  const bi = Math.max(0, Number(bike_km) || 0);
  co2Saved += (s.bike_co2_saved_per_km ?? 0.192) * bi;
  ccEarned += (s.bike_cc_per_km ?? 8) * bi;
  xp += (s.xp_per_km_bike ?? 12) * bi;

  const c = Math.max(0, Number(car_km) || 0);
  co2Saved -= (s.car_co2_emitted_per_km ?? 0.192) * c;
  ccEarned += (s.car_cc_penalty_per_km ?? -2) * c;

  ccEarned *= multiplier;

  return {
    co2Saved: Math.round(co2Saved * 1000) / 1000,
    ccEarned: Math.round(ccEarned * 100) / 100,
    xp: Math.round(xp),
  };
};

export const detectTransportMode = (speedKmh, isNearBusStop) => {
  if (speedKmh < 0.5) return 'stationary';
  if (speedKmh < 7) return 'walk';
  if (speedKmh < 25 && isNearBusStop) return 'bus';
  if (speedKmh < 25) return 'bike';
  if (speedKmh < 150) return 'car';
  return 'invalid';
};

const EARTH_R_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(a));
};
