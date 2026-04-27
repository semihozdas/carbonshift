import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.PROD ? '' : '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin-panel/login';
    }
    return Promise.reject(error);
  }
);

export default api;
