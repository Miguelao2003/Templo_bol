import axios from 'axios';

// Configuración base de axios con la URL de tu backend
const api = axios.create({
  baseURL: 'http://localhost:8000', // Usamos directamente la URL del backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Importante para las cookies/sesión
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
      // Redirige a login si no está autorizado
      window.location.href = '/login';
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export { api }; // Exportamos como named export