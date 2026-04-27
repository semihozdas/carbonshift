import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const KEY = 'carbonshift_bus_stops';

const DEFAULTS = [
  { id: 'default_1', name: 'Taksim Meydanı', latitude: 41.0369, longitude: 28.9850, addedAt: Date.now() },
  { id: 'default_2', name: 'Kadıköy İskele', latitude: 40.9906, longitude: 29.0234, addedAt: Date.now() },
  { id: 'default_3', name: 'Beşiktaş', latitude: 41.0430, longitude: 29.0046, addedAt: Date.now() },
  { id: 'default_4', name: 'Mecidiyeköy', latitude: 41.0682, longitude: 28.9961, addedAt: Date.now() },
  { id: 'default_5', name: 'Şişli', latitude: 41.0616, longitude: 28.9870, addedAt: Date.now() },
];

let _cache = null;

// Load from backend API and update local cache
export const loadBusStopsFromAPI = async () => {
  try {
    const { data } = await api.get('/bus-stops');
    if (Array.isArray(data) && data.length > 0) {
      _cache = data.map((s) => ({
        id: `server_${s.id}`,
        name: s.name,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        addedAt: Date.now(),
      }));
      await AsyncStorage.setItem(KEY, JSON.stringify(_cache));
      return _cache;
    }
  } catch (_) {}
  // Fall back to local
  return loadBusStops();
};

export const loadBusStops = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      _cache = JSON.parse(raw);
    } else {
      await AsyncStorage.setItem(KEY, JSON.stringify(DEFAULTS));
      _cache = [...DEFAULTS];
    }
  } catch {
    _cache = [...DEFAULTS];
  }
  return _cache;
};

export const getBusStops = () => _cache ?? [];

export const addBusStop = async ({ name, latitude, longitude }) => {
  const stop = {
    id: `stop_${Date.now()}`,
    name: name || 'Otobüs Durağı',
    latitude,
    longitude,
    addedAt: Date.now(),
  };
  const current = await loadBusStops();
  const updated = [...current, stop];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  _cache = updated;
  return stop;
};

export const removeBusStop = async (id) => {
  const current = await loadBusStops();
  const updated = current.filter((s) => s.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  _cache = updated;
};

export const isNearBusStop = (latitude, longitude, radiusMeters = 80) => {
  const stops = getBusStops();
  if (!stops.length) return false;
  const toRad = (d) => (d * Math.PI) / 180;
  return stops.some((stop) => {
    const dLat = toRad(stop.latitude - latitude);
    const dLon = toRad(stop.longitude - longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(latitude)) * Math.cos(toRad(stop.latitude)) * Math.sin(dLon / 2) ** 2;
    const distM = 2 * 6371000 * Math.asin(Math.sqrt(a));
    return distM < radiusMeters;
  });
};
