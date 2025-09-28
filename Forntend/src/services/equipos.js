import { api } from "./api";

export const equipoService = {
  /**
   * Obtener todos los equipos (GET)
   */
  async getAll() {
    const { data } = await api.get("/equipos-powerplate/");
    return data;
  },

  /**
   * Buscar equipos por filtros (GET)
   * @param {Object} filters - Filtros de búsqueda
   */
  async buscarEquipos(filters = {}) {
    const { data } = await api.get("/equipos-powerplate/buscar/", {
      params: {
        nombre: filters.nombre_equipo || undefined,
        estado: filters.estado || undefined,
        especificaciones: filters.especificaciones || undefined,
        // ✅ Cambiar nombres para que coincidan con el backend:
        ultimo_mantenimiento_min: filters.fechaUltimoDesde || undefined,
        ultimo_mantenimiento_max: filters.fechaUltimoHasta || undefined,
        // Por ahora comentamos próximo mantenimiento hasta que lo agregues al backend:
        proximo_mantenimiento_min: filters.fechaProximoDesde || undefined,
        proximo_mantenimiento_max: filters.fechaProximoHasta || undefined,
      },
    });
    return data;
  },

  /**
   * Crear nuevo equipo (POST)
   * @param {Object} equipoData - Datos del equipo
   */
  async createEquipo(equipoData) {
    const { data } = await api.post("/equipos-powerplate/", equipoData);
    return data;
  },

  /**
   * Actualizar equipo por ID (PUT)
   * @param {number} id - ID del equipo
   * @param {Object} equipoData - Datos actualizados
   */
  async updateEquipo(id, equipoData) {
    const { data } = await api.put(`/equipos-powerplate/${id}`, equipoData);
    return data;
  },

  /**
   * Poner un equipo en mantenimiento (POST)
   * @param {number} id - ID del equipo
   */
  async mantenimientoEquipo(id) {
    const { data } = await api.post(`/equipos-powerplate/${id}/mantenimiento`);
    return data;
  },

  /**
   * Activar un equipo (POST)
   * @param {number} id - ID del equipo
   */
  async activarEquipo(id) {
    const { data } = await api.post(`/equipos-powerplate/${id}/activar`);
    return data;
  },
};