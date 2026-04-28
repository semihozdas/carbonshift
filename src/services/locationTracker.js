import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import {
  haversineMeters,
  detectMode,
  checkBusStopVisit,
  calcMixedCO2,
  calcMixedCC,
  SPEED,
  BUS_STOP_VISIT_RADIUS_M,
  SEGMENT_BUFFER_MS,
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

  const now = Date.now();

  state = {
    startedAt: now,
    coords: [{
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
      ts: now,
    }],
    distanceKm: 0,
    maxSpeedKmh: 0,
    speedSamples: [],
    lastSignificant: {
      latitude: initial.coords.latitude,
      longitude: initial.coords.longitude,
    },
    prevSpeedKmh: 0,
    prevSpeedTs: now,
    // Bus detection
    visitedStops: new Map(),
    busStopVisits: 0,
    slowdownNearStop: 0,
    wasAtVehicleSpeed: false,
    // Steps
    stepCount: 0,
    // ── Segment state machine ──────────────────────────────────────────────
    // currentSeg: the open (uncommitted) segment being accumulated right now
    currentSeg: { mode: 'walk', startTs: now, distanceKm: 0 },
    // pendingMode: a candidate mode change that hasn't yet passed SEGMENT_BUFFER_MS
    pendingMode: null,   // { mode: string, since: timestamp }
    // segments: committed (finalised) segments
    segments: [],        // [{ mode, distanceKm, durationSec }]
    // per-mode cumulative km for the whole trip
    distanceByMode: { walk: 0, bike: 0, bus: 0, car: 0 },
  };

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

      if (accuracy != null && accuracy > MIN_ACCURACY_M) return;

      const movedMeters = haversineMeters(
        state.lastSignificant.latitude,
        state.lastSignificant.longitude,
        latitude,
        longitude
      );
      if (movedMeters < MIN_MOVE_METERS) return;

      const movedKm = movedMeters / 1000;
      state.distanceKm += movedKm;
      state.lastSignificant = { latitude, longitude };

      const ts = Date.now();
      const coord = { latitude, longitude, ts };
      state.coords.push(coord);

      const speedKmh = Math.max(0, (speed ?? 0) * 3.6);

      state.speedSamples.push({ speedKmh, ts });
      state.speedSamples = state.speedSamples.filter(
        (s) => ts - s.ts <= MODE_WINDOW_MS
      );
      state.maxSpeedKmh = Math.max(state.maxSpeedKmh, speedKmh);

      const busStops = getBusStops();

      // Bus stop visit detection
      const visitedStopId = checkBusStopVisit(speedKmh, coord, busStops, state.visitedStops);
      if (visitedStopId !== null) state.busStopVisits += 1;

      // Slowdown-near-stop detection
      if (state.wasAtVehicleSpeed && speedKmh < SPEED.BUS_STOP_SLOW) {
        const nearAnyStop = busStops.some(
          (s) => haversineMeters(latitude, longitude, s.latitude, s.longitude) < BUS_STOP_VISIT_RADIUS_M * 2
        );
        if (nearAnyStop) state.slowdownNearStop += 1;
      }
      state.wasAtVehicleSpeed = speedKmh >= SPEED.VEHICLE_MIN;

      // ── Segment state machine ──────────────────────────────────────────────
      const liveMode = detectMode(speedKmh, coord, busStops);

      if (liveMode === 'stationary') {
        // Brief stop — keep current segment, don't disturb pending timer.
        state.currentSeg.distanceKm += movedKm;
        state.distanceByMode[state.currentSeg.mode] =
          (state.distanceByMode[state.currentSeg.mode] || 0) + movedKm;
      } else if (liveMode === state.currentSeg.mode) {
        // Same mode continuing — accumulate and cancel any pending switch.
        state.currentSeg.distanceKm += movedKm;
        state.distanceByMode[liveMode] =
          (state.distanceByMode[liveMode] || 0) + movedKm;
        state.pendingMode = null;
      } else {
        // Different mode detected — start or continue buffering.
        if (state.pendingMode?.mode !== liveMode) {
          // New candidate: reset buffer timer.
          state.pendingMode = { mode: liveMode, since: ts };
        } else if (ts - state.pendingMode.since >= SEGMENT_BUFFER_MS) {
          // Candidate has been stable long enough → commit current segment.
          state.segments.push({
            mode: state.currentSeg.mode,
            distanceKm: Number(state.currentSeg.distanceKm.toFixed(3)),
            durationSec: Math.floor((ts - state.currentSeg.startTs) / 1000),
          });
          state.currentSeg = { mode: liveMode, startTs: ts, distanceKm: 0 };
          state.pendingMode = null;
        }
        // While buffering, distance is charged to the current (confirmed) segment.
        state.currentSeg.distanceKm += movedKm;
        state.distanceByMode[state.currentSeg.mode] =
          (state.distanceByMode[state.currentSeg.mode] || 0) + movedKm;
      }
      // ── End segment state machine ──────────────────────────────────────────

      state.prevSpeedKmh = speedKmh;
      state.prevSpeedTs = ts;

      const durationSec = Math.floor((ts - state.startedAt) / 1000);
      const avgSpeedKmh = _avg(state.speedSamples);

      // Live view: committed segments + open segment snapshot
      const openSeg = {
        mode: state.currentSeg.mode,
        distanceKm: Number(state.currentSeg.distanceKm.toFixed(3)),
        durationSec: Math.floor((ts - state.currentSeg.startTs) / 1000),
      };

      onUpdate?.({
        distanceKm: state.distanceKm,
        coords: state.coords,
        speedKmh,
        avgSpeedKmh,
        currentMode: state.currentSeg.mode,
        pendingMode: state.pendingMode?.mode ?? null,
        segments: [...state.segments, openSeg],
        distanceByMode: { ...state.distanceByMode },
        durationSec,
        co2Saved: calcMixedCO2(state.distanceByMode),
        ccEarned: calcMixedCC(state.distanceByMode),
        busStopVisits: state.busStopVisits,
        stepCount: state.stepCount,
        // Legacy compat fields (some UI components may read these)
        mode: state.currentSeg.mode,
        dominantMode: _dominantMode(state.distanceByMode),
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

  const now = Date.now();
  const durationSec = Math.floor((now - state.startedAt) / 1000);
  const distKm = Number(state.distanceKm.toFixed(3));
  const avgSpeedKmh = Number(_avg(state.speedSamples).toFixed(2));
  const maxSpeedKmh = Number(state.maxSpeedKmh.toFixed(2));
  const coords = state.coords;
  const startCoord = coords[0];
  const endCoord = coords[coords.length - 1];

  // Finalise the open segment (if it has meaningful distance).
  if (state.currentSeg.distanceKm > 0.01) {
    state.segments.push({
      mode: state.currentSeg.mode,
      distanceKm: Number(state.currentSeg.distanceKm.toFixed(3)),
      durationSec: Math.floor((now - state.currentSeg.startTs) / 1000),
    });
  }

  const segments = state.segments;
  const distanceByMode = state.distanceByMode;
  const stepCount = state.stepCount;
  const busStopVisits = state.busStopVisits;
  const dominantMode = _dominantMode(distanceByMode);

  state = null;

  const co2Saved = calcMixedCO2(distanceByMode);
  const ccEarned = calcMixedCC(distanceByMode);
  const tooShort = distKm <= 0.05;

  const result = {
    mode: dominantMode,
    distance_km: distKm,
    duration_sec: durationSec,
    avg_speed_kmh: avgSpeedKmh,
    max_speed_kmh: maxSpeedKmh,
    step_count: stepCount,
    bus_stop_visits: busStopVisits,
    segments,
    distanceByMode,
    co2_saved_g: co2Saved,
    cc_earned: ccEarned,
    coords,
    tooShort,
    submitted: false,
  };

  if (!tooShort) {
    try {
      const { data } = await api.post('/activities', {
        mode: dominantMode,
        distance_km: distKm,
        duration_minutes: durationSec / 60,
        avg_speed_kmh: avgSpeedKmh,
        step_count: stepCount || null,
        start_lat: startCoord?.latitude,
        start_lng: startCoord?.longitude,
        end_lat: endCoord?.latitude,
        end_lng: endCoord?.longitude,
        // Mixed-mode breakdown
        walk_km: Number((distanceByMode.walk || 0).toFixed(3)),
        bike_km: Number((distanceByMode.bike || 0).toFixed(3)),
        bus_km: Number((distanceByMode.bus || 0).toFixed(3)),
        car_km: Number((distanceByMode.car || 0).toFixed(3)),
        segments,
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

const _dominantMode = (distanceByMode) => {
  const entries = Object.entries(distanceByMode).filter(([, km]) => km > 0);
  if (!entries.length) return 'walk';
  return entries.sort(([, a], [, b]) => b - a)[0][0];
};
