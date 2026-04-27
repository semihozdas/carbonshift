import { getSettings } from './locationService.js';

export const detectAnomaly = async ({ mode, distance_km, duration_minutes, avg_speed_kmh }) => {
  const s = await getSettings();
  const reasons = [];

  const durMin = Number(duration_minutes) || 0;
  const dist = Number(distance_km) || 0;
  const speed = Number(avg_speed_kmh) || (durMin > 0 ? (dist / (durMin / 60)) : 0);

  if (durMin > 0 && durMin < (s.anomaly_min_duration_min ?? 1)) {
    reasons.push(`duration_too_short:${durMin}min`);
  }

  if (mode === 'walk' && speed > (s.anomaly_max_walk_speed ?? 10)) {
    reasons.push(`walk_speed_too_high:${speed.toFixed(1)}kmh`);
  }

  if (mode === 'bus' && speed > (s.anomaly_max_bus_speed ?? 90)) {
    reasons.push(`bus_speed_too_high:${speed.toFixed(1)}kmh`);
  }

  if (dist > 500) {
    reasons.push(`distance_unrealistic:${dist}km`);
  }

  return {
    is_anomaly: reasons.length > 0,
    anomaly_reason: reasons.join(', ') || null,
  };
};
