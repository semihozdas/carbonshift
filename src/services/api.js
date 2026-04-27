import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For physical Android devices, override via AsyncStorage key 'apiBaseUrl'
// or change ANDROID_HOST below to your computer's LAN IP (e.g. 192.168.1.x).
const ANDROID_HOST = '10.96.241.16'; // Updated to local IP for physical device access

function getBaseURL() {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? `http://${ANDROID_HOST}:3001`
      : 'http://localhost:3001';
  }
  return `http://${ANDROID_HOST}:3001`;
}

export const TOKEN_KEY = 'cs_token';

const api = axios.create({
  baseURL: `${getBaseURL()}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) config.headers.Authorization = `Bearer ${stored}`;
  } catch (_) {}
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    }
    return Promise.reject(error);
  }
);

export default api;
