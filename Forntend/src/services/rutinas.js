// src/services/rutinas.js
import { api } from "./api"; // Usa el axios configurado

export const rutinaService = {
  // Obtener todas las rutinas
  async getAll() {
    const { data } = await api.get("/rutinas/");
    return data;
  },
  async getRutinaById(id) {
    try {
      const { data } = await api.get(`/rutinas/${id}`);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener rutina por ID');
    }
  },

  // Buscar rutinas con filtros - CORREGIDO
  async searchRutinas(searchTerm) {
    try {
      const { data } = await api.get("/rutinas/buscar/", {
        params: {
          termino: searchTerm
        }
      });
      return data;
    } catch (error) {
      console.error("Error en búsqueda:", error);
      throw new Error(error.response?.data?.detail || 'Error en la búsqueda');
    }
  },
  // Obtener rutinas por entrenador (filtra por id_usuario)
  async getRutinasByEntrenador(entrenadorId) {
    try {
      const { data } = await api.get("/rutinas/");
      // Filtrar rutinas por el id_usuario que corresponde al entrenador
      const rutinasFiltradas = data.filter(rutina => rutina.id_usuario === parseInt(entrenadorId));
      return rutinasFiltradas;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error al obtener rutinas del entrenador');
    }
  },


  // Crear nueva rutina
  async createRutina(rutinaData) {
    const { data } = await api.post("/rutinas/", rutinaData);
    return data;
  },

  // Actualizar rutina por ID
  async updateRutina(id, rutinaData) {
    const { data } = await api.put(`/rutinas/${id}`, rutinaData);
    return data;
  },

  // Eliminar rutina por ID
  async deleteRutina(id) {
    const { data } = await api.delete(`/rutinas/${id}`);
    return data;
  },
};
