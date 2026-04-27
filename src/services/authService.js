import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
};

export const register = async ({ email, password, full_name }) => {
  const { data } = await api.post('/auth/register', { email, password, full_name });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
};

export const logout = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getStoredToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export const fetchMe = async () => {
  const { data } = await api.get('/user/me');
  return data;
};
