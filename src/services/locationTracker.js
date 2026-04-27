import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import {
  haversineMeters,
  detectMode,
  checkBusStopVisit,
  classifyTripMode,
  calcCO2Saved,
  calcCC,
  SPEED,
  BUS_STOP_VISIT_RADIUS_M,
} from '../utils/geo';
import { getBusStops } from './busStops';
import api from './api';

let subscription = null;
let pedometerSub = null;
let state = null;

const MODE_WINDOW_MS = 20_000;
const MIN_MOVE_METERS = 8;
const MIN_ACCURACY_M = 40;

export const startTracking = async ({ onUpdate } = {}) => {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new Error('Konum izni reddedildi');

  const initial = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  state = {
    startedAt: Date.now(),
    coords: [{
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
      ts: Date.now(),
    }],
    distanceKm: 0,
    maxSpeedKmh: 0,
    speedSamples: [],
    modeCounts: { walk: 0, bike: 0, bus: 0, car: 0 },
    dominantMode: 'walk',
    lastSignificant: {
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
    },
    prevSpeedKmh: 0,
    prevSpeedTs: Date.now(),
    // Bus detection
    visitedStops: new Map(),   // stopId → lastVisitTimestamp
    busStopVisits: 0,          // distinct stops visited while slow
    slowdownNearStop: 0,       // times decelerated from vehicle speed to slow near a stop
    wasAtVehicleSpeed: false,  // flag: was going fast recently
    // Steps
    stepCount: 0,
  };

  // Start pedometer (graceful fallback if unavailable)
  try {
    const pedometerPerm = await Pedometer.requestPermissionsAsync();
    if (pedometerPerm.status === 'granted') {
      const available = await Pedometer.isAvailableAsync();
      if (available) {
        pedometerSub = Pedometer.watchStepCount((result) => {
          if (state) state.stepCount = result.steps;
        });
      }
    }
  } catch (_) {}

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    (loc) => {
      if (!state) return;
      const { latitude, longitude, speed, accuracy } = loc.coords;

      // Filter poor GPS fixes
      if (accuracy != null && accuracy > MIN_ACCURACY_M) return;

      const movedMeters = haversineMeters(
        state.lastSignificant.latitude,
        state.lastSignificant.longitude,
        latitude,
        longitude
      );
      if (movedMeters < MIN_MOVE_METERS) return;

      state.distanceKm += movedMeters / 1000;
      state.lastSignificant = { latitude, longitude };

      const coord = { latitude, longitude, ts: Date.now() };
      state.coords.push(coord);

      const rawSpeedKmh = Math.max(0, (speed ?? 0) * 3.6);
      const speedKmh = rawSpeedKmh;

      // Rolling speed window
      state.speedSamples.push({ speedKmh, ts: coord.ts });
      state.speedSamples = state.speedSamples.filter(
        (s) => coord.ts - s.ts <= MODE_WINDOW_MS
      );
      state.maxSpeedKmh = Math.max(state.maxSpeedKmh, speedKmh);

      const busStops = getBusStops();

      // ── Bus stop visit detection ──────────────────────────────────────────
      // A visit = user is slow (< BUS_STOP_SLOW) AND within radius of a stop
      const visitedStopId = checkBusStopVisit(speedKmh, coord, busStops, state.visitedStops);
      if (visitedStopId !== null) {
        state.busStopVisits += 1;
      }

      // ── Slowdown-near-stop detection ──────────────────────────────────────
      // Counts transitions from vehicle speed → slow while near a stop
      if (state.wasAtVehicleSpeed && speedKmh < SPEED.BUS_STOP_SLOW) {
        const nearAnyStop = busStops.some(
          (s) => haversineMeters(latitude, longitude, s.latitude, s.longitude) < BUS_STOP_VISIT_RADIUS_M * 2
        );
        if (nearAnyStop) state.slowdownNearStop += 1;
      }
      state.wasAtVehicleSpeed = speedKmh >= SPEED.VEHICLE_MIN;

      // ── Live mode display (speed + instant proximity) ──────────────────────
      const liveMode = detectMode(speedKmh, coord, busStops);
      if (liveMode !== 'stationary') {
        state.modeCounts[liveMode] = (state.modeCounts[liveMode] || 0) + 1;
        const best = Object.entries(state.modeCounts).sort((a, b) => b[1] - a[1])[0];
        if (best) state.dominantMode = best[0];
      }

      state.prevSpeedKmh = speedKmh;
      state.prevSpeedTs = coord.ts;

      const durationSec = Math.floor((coord.ts - state.startedAt) / 1000);
      const avgSpeedKmh = _avg(state.speedSamples);

      onUpdate?.({
        distanceKm: state.distanceKm,
        coords: state.coords,
        speedKmh,
        avgSpeedKmh,
        mode: liveMode,
        dominantMode: state.dominantMode,
        durationSec,
        co2Saved: calcCO2Saved(state.distanceKm, state.dominantMode),
        ccEarned: calcCC(state.distanceKm, state.dominantMode),
        modeCounts: { ...state.modeCounts },
        busStopVisits: state.busStopVisits,
        stepCount: state.stepCount,
      });
    }
  );
};

export const stopTracking = async () => {
  if (!state) return null;
  try { await subscription?.remove?.(); } catch (_) {}
  try { pedometerSub?.remove?.(); } catch (_) {}
  subscription = null;
  pedometerSub = null;

  const durationSec = Math.floor((Date.now() - state.startedAt) / 1000);
  const distKm = Number(state.distanceKm.toFixed(3));
  const avgSpeedKmh = Number(_avg(state.speedSamples).toFixed(2));
  const maxSpeedKmh = Number(state.maxSpeedKmh.toFixed(2));
  const coords = state.coords;
  const startCoord = coords[0];
  const endCoord = coords[coords.length - 1];

  // ── Final mode classification ──────────────────────────────────────────────
  const finalMode = classifyTripMode({
    avgSpeedKmh,
    maxSpeedKmh,
    busStopVisits: state.busStopVisits,
    slowdownNearStop: state.slowdownNearStop,
    steps: state.stepCount,
    distanceKm: distKm,
  });

  const stepCount = state.stepCount;
  const busStopVisits = state.busStopVisits;
  state = null;

  const tooShort = distKm <= 0.05;

  const result = {
    mode: finalMode,
    distance_km: distKm,
    duration_sec: durationSec,
    avg_speed_kmh: avgSpeedKmh,
    max_speed_kmh: maxSpeedKmh,
    step_count: stepCount,
    bus_stop_visits: busStopVisits,
    co2_saved_g: calcCO2Saved(distKm, finalMode),
    cc_earned: calcCC(distKm, finalMode),
    coords,
    tooShort,
    submitted: false,
  };

  if (!tooShort) {
    try {
      const { data } = await api.post('/activities', {
        mode: finalMode,
        distance_km: distKm,
        duration_minutes: durationSec / 60,
        avg_speed_kmh: avgSpeedKmh,
        step_count: stepCount || null,
        start_lat: startCoord?.latitude,
        start_lng: startCoord?.longitude,
        end_lat: endCoord?.latitude,
        end_lng: endCoord?.longitude,
      });
      result.cc_earned = Number(data.activity.cc_earned);
      result.co2_saved_g = Math.round(Number(data.activity.co2_saved) * 1000); // kg → g
      result.activity_id = data.activity.id;
      result.newBadges = data.newBadges || [];
      result.newTasksCompleted = data.newTasksCompleted || [];
      result.streak = data.streak;
      result.submitted = true;
      result.activity = data.activity;
    } catch (e) {
      console.warn('[tracker] Activity submission failed:', e.message);
    }
  }

  return result;
};

export const isTracking = () => subscription !== null;

const _avg = (samples) => {
  if (!samples?.length) return 0;
  return samples.reduce((a, s) => a + s.speedKmh, 0) / samples.length;
};
