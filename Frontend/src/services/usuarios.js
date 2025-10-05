import { api } from './api';

export const userService = {
  // Crear usuario (solo admin)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Listar usuarios
  getUsers: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Obtener solo entrenadores (para asignar rutinas)
  getEntrenadores: async () => {
    try {
      const response = await api.get('/users/');
      // Filtrar solo entrenadores
      const entrenadores = response.data.filter(user => user.rol === 'entrenador');
      return entrenadores;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // FUNCIÓN CORREGIDA - Buscar usuarios (solo admin)
  searchUsers: async (filters) => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // *** CAMBIO CRÍTICO: Ahora incluye valores booleanos (false) ***
        if (value !== null && value !== undefined && value !== "") {
          params.append(key, String(value)); // Convertir a string explícitamente
        }
      });

      console.log("🌐 Parámetros construidos:", params.toString());
      console.log("🌐 URL completa:", `/users/search/?${params.toString()}`);

      const response = await api.get(`/users/search/?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar usuario
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Desactivar usuario (solo admin)
  deactivateUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Activar usuario (solo admin)
  activateUser: async (id) => {
    try {
      const response = await api.put(`/users/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};