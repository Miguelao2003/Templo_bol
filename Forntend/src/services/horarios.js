// services/horarios.js
import { api } from "./api"; // ✅ Usa el axios configurado con interceptores

export const horarioService = {
  // Obtener todos los horarios
  async getAll() {
    const { data } = await api.get("/horarios/");
    return data;
  },

  // Obtener horarios para cliente (vista semanal)
  async getAllCliente(filters = {}) {
    const params = { vista_semanal: true, ...filters };
    const { data } = await api.get("/horarios/", { params });
    return data;
  },

  // Buscar horarios con filtros
  async searchHorarios(filters = {}) {
    const { data } = await api.post("/horarios/buscar/", filters);
    return data;
  },

  // Crear nuevo horario
  async createHorario(horarioData) {
    const { data } = await api.post("/horarios/", horarioData);
    return data;
  },

  // Actualizar horario
  async updateHorario(id, horarioData) {
    const { data } = await api.put(`/horarios/${id}`, horarioData);
    return data;
  },

  // Eliminar horario
  async deleteHorario(id) {
    const { data } = await api.delete(`/horarios/${id}`);
    return data;
  },

  // Desactivar horario
  async deactivateHorario(id) {
    const { data } = await api.patch(`/horarios/${id}/desactivar`);
    return data;
  },

  // Activar horario (PATCH) - Corregido el método HTTP
  async activateHorario(id) {
    const { data } = await api.patch(`/horarios/${id}/activar`);
    return data;
  }
};