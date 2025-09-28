import { api } from './api';

const ReservaService = {
  // POST - Crear Reserva (solo administrador puede reservar para otros clientes)
  crearReserva: async (reservaData) => {
    try {
      console.log('Servicio: enviando datos al backend:', reservaData);
      const response = await api.post('/reservas/', reservaData);
      console.log('Servicio: respuesta exitosa del backend:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Reserva creada exitosamente'
      };
    } catch (error) {
      console.error('Servicio: error completo:', error);
      console.error('Servicio: error response:', error.response);
      
      let errorMessage = 'Error al crear la reserva';
      
      // Extraer el mensaje de error del backend
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Servicio: mensaje de error extraído:', errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error.message
      };
    }
  },

  // GET - Listar Reservas a detalle (solo administrador puede ver todas las reservas)
  obtenerTodasLasReservas: async () => {
    try {
      const response = await api.get('/reservas/admin/todas');
      return {
        success: true,
        data: response.data,
        message: 'Reservas obtenidas exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener las reservas',
        error: error.response?.data || error.message
      };
    }
  },

  // GET - Listar Reserva a detalle (solo cliente puede ver sus reservas)
  obtenerMisReservas: async () => {
    try {
      const response = await api.get('/reservas/mis-reservas/');
      return {
        success: true,
        data: response.data,
        message: 'Reservas obtenidas exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener las reservas',
        error: error.response?.data || error.message
      };
    }
  },



  // PUT - Cancelar Reserva (solo administrador puede cancelar cualquier reserva y cliente solo puede cancelar sus reservas)
  cancelarReserva: async (reservaId) => {
    try {
      const response = await api.put(`/reservas/${reservaId}/cancelar`);
      return {
        success: true,
        data: response.data,
        message: 'Reserva cancelada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.response?.data?.message || 'Error al cancelar la reserva',
        error: error.response?.data || error.message
      };
    }
  },

  // PUT - Marcar Asistencia (solo administrador puede marcar la asistencia de todos los clientes y entrenador solo puede marca asistencia de sus clientes)
  marcarAsistencia: async (reservaId, numeroAsistencia, comentarios = null) => {
    try {
      console.log('🎯 === INICIANDO MARCAR ASISTENCIA ===');
      console.log('📋 Parámetros recibidos:', {
        reservaId,
        numeroAsistencia,
        comentarios,
        tipos: {
          reservaId: typeof reservaId,
          numeroAsistencia: typeof numeroAsistencia,
          comentarios: typeof comentarios
        }
      });

      // Validar que reservaId sea un número válido
      const reservaIdNumber = parseInt(reservaId);
      if (isNaN(reservaIdNumber) || reservaIdNumber <= 0) {
        throw new Error(`ID de reserva inválido: ${reservaId}`);
      }

      // Validar que numeroAsistencia sea un número válido
      const numeroAsistenciaNumber = parseInt(numeroAsistencia);
      if (isNaN(numeroAsistenciaNumber) || numeroAsistenciaNumber <= 0) {
        throw new Error(`Número de asistencia inválido: ${numeroAsistencia}`);
      }

      // Preparar el payload
      const payload = { 
        asistencia: numeroAsistenciaNumber
      };

      // Solo agregar comentarios si existe y no está vacío
      if (comentarios && typeof comentarios === 'string' && comentarios.trim() !== '') {
        payload.comentarios = comentarios.trim();
      }

      console.log('📦 Payload preparado:', payload);
      console.log('🌐 URL del endpoint:', `/reservas/${reservaIdNumber}/asistencia`);

      // Realizar la petición
      const response = await api.put(`/reservas/${reservaIdNumber}/asistencia`, payload);
      
      console.log('✅ Respuesta exitosa del servidor:', response.data);
      console.log('📊 Status de respuesta:', response.status);

      return {
        success: true,
        data: response.data,
        message: `Asistencia #${numeroAsistenciaNumber} marcada exitosamente`
      };
    } catch (error) {
      console.error('❌ === ERROR AL MARCAR ASISTENCIA ===');
      console.error('💥 Error completo:', error);
      console.error('📄 Error response:', error.response);
      console.error('📋 Error data:', error.response?.data);
      console.error('🔢 Status code:', error.response?.status);
      console.error('📝 Error config:', error.config);

      // Extraer mensaje de error más específico
      let errorMessage = 'Error al marcar la asistencia';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.errors) {
          // Si hay errores de validación
          const errors = error.response.data.errors;
          if (Array.isArray(errors)) {
            errorMessage = errors.join(', ');
          } else if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join(', ');
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('📝 Mensaje de error extraído:', errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || error.message
      };
    }
  },

  // Método auxiliar para obtener reservas según el rol del usuario
  obtenerReservas: async (userRole) => {
    if (userRole === 'administrador') {
      return await ReservaService.obtenerTodasLasReservas();
    } else {
      return await ReservaService.obtenerMisReservas();
    }
  },



  // Método auxiliar para verificar permisos de cancelación
  puedesCancelarReserva: (userRole, reserva, userId) => {
    if (userRole === 'administrador') {
      return true;
    }
    if (userRole === 'cliente' && reserva.cliente_id === userId) {
      return true;
    }
    return false;
  },
  

  // Método auxiliar para verificar permisos de asistencia
  puedesMarcarAsistencia: (userRole, reserva, userId) => {
    // Removemos los logs excesivos para limpiar la consola
    if (userRole === 'administrador') {
      return true;
    }
    if (userRole === 'entrenador' && reserva.entrenador_id === userId) {
      return true;
    }
    
    return false;
  }
};

export default ReservaService;
