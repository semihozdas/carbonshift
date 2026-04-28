const EARTH_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  if ([lat1, lon1, lat2, lon2].some((v) => !Number.isFinite(v))) return 0;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
};

export const haversineMeters = (lat1, lon1, lat2, lon2) =>
  haversineKm(lat1, lon1, lat2, lon2) * 1000;

// ─── Thresholds ───────────────────────────────────────────────────────────────
export const SPEED = {
  STATIONARY:      1.5,   // km/h — below this = not moving
  WALK_MAX:        8,     // km/h
  BIKE_MAX:        25,    // km/h
  BUS_MAX:         90,    // km/h
  VEHICLE_MIN:     20,    // km/h — "vehicle speed" threshold
  BUS_STOP_SLOW:   18,    // km/h — must be below this when near a stop to count as "stopped there"
};

export const BUS_STOP_VISIT_RADIUS_M = 150; // metres — within this radius counts as near a stop
export const BUS_STOP_VISIT_COOLDOWN_MS = 90_000; // 90 s — don't re-count same stop within this window

// ─── Real-time mode (per GPS update, for live badge) ──────────────────────────
// Uses speed + instant proximity to any stop. NOT used for final classification.
export const detectMode = (speedKmh, coord, busStops = []) => {
  if (!Number.isFinite(speedKmh) || speedKmh < SPEED.STATIONARY) return 'stationary';
  if (speedKmh < SPEED.WALK_MAX) return 'walk';
  if (speedKmh < SPEED.BIKE_MAX) return 'bike';

  // Vehicle speed — use stop proximity as a live bus hint
  if (coord && busStops.length > 0) {
    const nearStop = busStops.some(
      (s) => haversineMeters(coord.latitude, coord.longitude, s.latitude, s.longitude) < BUS_STOP_VISIT_RADIUS_M
    );
    if (nearStop) return 'bus';
  }
  return 'car';
};

// ─── Bus-stop visit checker ───────────────────────────────────────────────────
// Returns the matched stop id if user is near a stop AND slowing/slow, else null.
// visitedMap: Map<stopId, lastVisitTimestamp>
export const checkBusStopVisit = (speedKmh, coord, busStops, visitedMap) => {
  if (speedKmh > SPEED.BUS_STOP_SLOW) return null; // not slow enough to "stop"
  if (!coord || !busStops.length) return null;

  const now = Date.now();
  for (const stop of busStops) {
    const dist = haversineMeters(coord.latitude, coord.longitude, stop.latitude, stop.longitude);
    if (dist > BUS_STOP_VISIT_RADIUS_M) continue;

    const lastVisit = visitedMap.get(stop.id);
    if (lastVisit && now - lastVisit < BUS_STOP_VISIT_COOLDOWN_MS) continue; // cooldown

    visitedMap.set(stop.id, now);
    return stop.id;
  }
  return null;
};

// ─── Final trip classification ────────────────────────────────────────────────
// Called once at trip end with accumulated statistics.
// busStopVisits: number of distinct stops visited while slow (≥2 → bus)
// slowdownNearStop: number of times user decelerated from vehicle speed to slow near a stop
export const classifyTripMode = ({
  avgSpeedKmh,
  maxSpeedKmh,
  busStopVisits,
  slowdownNearStop,
  steps,
  distanceKm,
}) => {
  // Strong walk: low average speed or high step density
  const stepsPerKm = distanceKm > 0 ? (steps || 0) / distanceKm : 0;
  if (avgSpeedKmh < SPEED.WALK_MAX) return 'walk';
  if (avgSpeedKmh < 12 && stepsPerKm > 600) return 'walk'; // slightly faster but lots of steps

  // Bus: vehicle speed AND visited ≥2 stops while slow, OR decelerated near stops ≥2 times
  const hasBusPattern = busStopVisits >= 2 || (busStopVisits >= 1 && slowdownNearStop >= 2);
  if (avgSpeedKmh >= 10 && hasBusPattern) return 'bus';

  // Bike: moderate speed, no bus pattern, not car speed
  if (avgSpeedKmh < SPEED.BIKE_MAX && maxSpeedKmh < 40) return 'bike';

  // Car: vehicle speed, no bus pattern
  if (avgSpeedKmh >= SPEED.VEHICLE_MIN) return 'car';

  // Fallback: if significant steps → walk, else bike
  return stepsPerKm > 400 ? 'walk' : 'bike';
};

// ─── Segment buffer ───────────────────────────────────────────────────────────
// A candidate mode must hold for this long before it becomes a committed segment.
export const SEGMENT_BUFFER_MS = 35_000;

// Compute per-mode km totals from a finished segments array.
export const calcDistanceByMode = (segments) => {
  const result = { walk: 0, bike: 0, bus: 0, car: 0 };
  for (const seg of segments) {
    if (result[seg.mode] !== undefined) {
      result[seg.mode] = Number((result[seg.mode] + seg.distanceKm).toFixed(3));
    }
  }
  return result;
};

// CO2 and CC from a distanceByMode map (local estimates, backend is authoritative).
export const calcMixedCO2 = (distanceByMode) => {
  let total = 0;
  for (const [mode, km] of Object.entries(distanceByMode)) {
    total += (CO2_SAVED_G_PER_KM[mode] ?? 0) * (km || 0);
  }
  return Number(total.toFixed(1));
};

export const calcMixedCC = (distanceByMode) => {
  let total = 0;
  for (const [mode, km] of Object.entries(distanceByMode)) {
    total += (CC_PER_KM[mode] ?? 0) * (km || 0);
  }
  return Number(total.toFixed(1));
};

// ─── CO2 & CC (local estimates, backend is authoritative) ─────────────────────
export const CO2_SAVED_G_PER_KM = {
  walk: 120,
  bike: 130,
  bus: 60,
  car: 0,
  stationary: 0,
};

export const CC_PER_KM = {
  walk: 1.5,
  bike: 1.5,
  bus: 2.0,
  car: -2.0, // penalty — matches backend
  stationary: 0,
};

export const calcCO2Saved = (distanceKm, mode) =>
  Number(((CO2_SAVED_G_PER_KM[mode] ?? 0) * distanceKm).toFixed(1));

export const calcCC = (distanceKm, mode) =>
  Number(((CC_PER_KM[mode] ?? 0) * distanceKm).toFixed(1));
