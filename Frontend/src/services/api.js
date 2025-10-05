import axios from 'axios';

// Configuración base de axios con la URL de tu backend
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // ✅ Agregado /api
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Interceptor para añadir token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export { api };