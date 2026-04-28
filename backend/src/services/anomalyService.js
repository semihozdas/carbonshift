import { getSettings } from './locationService.js';

export const detectAnomaly = async ({
  mode,
  distance_km,
  duration_minutes,
  avg_speed_kmh,
  segments,
  distanceBreakdown,
}) => {
  const s = await getSettings();
  const reasons = [];

  const durMin = Number(duration_minutes) || 0;
  const dist = Number(distance_km) || 0;
  const speed = Number(avg_speed_kmh) || (durMin > 0 ? (dist / (durMin / 60)) : 0);

  const maxWalk = s.anomaly_max_walk_speed ?? 10;
  const maxBus = s.anomaly_max_bus_speed ?? 90;

  if (durMin > 0 && durMin < (s.anomaly_min_duration_min ?? 1)) {
    reasons.push(`duration_too_short:${durMin}min`);
  }

  if (Array.isArray(segments) && segments.length > 0) {
    // Mixed-mode: check each segment with its own duration.
    for (const seg of segments) {
      const segDist = Number(seg.distanceKm) || 0;
      const segDur = Number(seg.durationSec) || 0;
      if (segDist <= 0 || segDur <= 0) continue;
      const segSpeed = segDist / (segDur / 3600);
      if (seg.mode === 'walk' && segSpeed > maxWalk) {
        reasons.push(`walk_segment_speed_too_high:${segSpeed.toFixed(1)}kmh`);
      }
      if (seg.mode === 'bus' && segSpeed > maxBus) {
        reasons.push(`bus_segment_speed_too_high:${segSpeed.toFixed(1)}kmh`);
      }
    }
  } else if (distanceBreakdown) {
    // Breakdown without segment timings: skip per-mode speed checks (no per-mode duration).
    // We rely on duration_too_short and distance_unrealistic.
  } else {
    // Single-mode legacy path.
    if (mode === 'walk' && speed > maxWalk) {
      reasons.push(`walk_speed_too_high:${speed.toFixed(1)}kmh`);
    }
    if (mode === 'bus' && speed > maxBus) {
      reasons.push(`bus_speed_too_high:${speed.toFixed(1)}kmh`);
    }
  }

  if (dist > 500) {
    reasons.push(`distance_unrealistic:${dist}km`);
  }

  return {
    is_anomaly: reasons.length > 0,
    anomaly_reason: reasons.join(', ') || null,
  };
};
