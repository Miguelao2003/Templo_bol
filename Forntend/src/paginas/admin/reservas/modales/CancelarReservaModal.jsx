import React, { useState } from 'react';
import {
  RiCloseLine,
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiSettings3Line,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCheckLine,
  RiAlertLine,
  RiDeleteBin6Line,
  RiShieldCheckLine
} from 'react-icons/ri';
import ReservaService from '../../../../services/reservas';
import { getLocalUser } from '../../../../services/auth';

const CancelarReservaModal = ({ isOpen, reserva, onClose, onSuccess }) => {
  // Estados del formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Usuario actual
  const usuario = getLocalUser();

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear hora
  const formatearHora = (hora) => {
    return hora.slice(0, 5);
  };

  // Función para formatear fecha y hora de reserva
  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' a las ' + fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si la reserva se puede cancelar sin penalización
  const puedesCancelarSinPenalizacion = () => {
    if (!reserva) return false;
    
    const ahora = new Date();
    const fechaHoraReserva = new Date(`${reserva.horario_fecha}T${reserva.horario_hora_inicio}`);
    const horasRestantes = (fechaHoraReserva - ahora) / (1000 * 60 * 60);
    
    return horasRestantes >= 24; // 24 horas de anticipación
  };

  // Calcular tiempo restante hasta la sesión
  const calcularTiempoRestante = () => {
    if (!reserva) return '';
    
    const ahora = new Date();
    const fechaHoraReserva = new Date(`${reserva.horario_fecha}T${reserva.horario_hora_inicio}`);
    const diferencia = fechaHoraReserva - ahora;
    
    if (diferencia < 0) return 'La sesión ya pasó';
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) {
      return `${dias} día${dias !== 1 ? 's' : ''} y ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `${horas} hora${horas !== 1 ? 's' : ''} y ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    } else {
      return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await ReservaService.cancelarReserva(reserva.id_reserva);

      if (response.success) {
        onSuccess();
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      setError('Error al cancelar la reserva');
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario al cerrar
  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !reserva) return null;

  const sinPenalizacion = puedesCancelarSinPenalizacion();
  const tiempoRestante = calcularTiempoRestante();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl shadow-2xl shadow-yellow-500/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <RiDeleteBin6Line className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Cancelar Reserva
              </h2>
              <p className="text-gray-400 text-sm">
                Reserva #{reserva.id_reserva}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg border-l-4 bg-red-500/10 border-red-500 text-red-400">
              <div className="flex items-center gap-3">
                <RiErrorWarningLine className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Información de la reserva */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              <RiCalendarLine className="inline h-5 w-5 mr-2" />
              Detalles de la Reserva
            </h3>
            
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cliente */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <RiUserLine className="w-4 h-4" />
                    Cliente:
                  </span>
                  <span className="text-gray-100 font-medium text-right">
                    {reserva.usuario_nombre} {reserva.usuario_apellido_p} {reserva.usuario_apellido_m}
                  </span>
                </div>

                {/* Fecha de la sesión */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <RiCalendarLine className="w-4 h-4" />
                    Fecha de sesión:
                  </span>
                  <span className="text-gray-100 font-medium text-right">
                    {formatearFecha(reserva.horario_fecha)}
                  </span>
                </div>

                {/* Horario */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <RiTimeLine className="w-4 h-4" />
                    Horario:
                  </span>
                  <span className="text-gray-100 font-medium text-right">
                    {formatearHora(reserva.horario_hora_inicio)} - {formatearHora(reserva.horario_hora_fin)}
                  </span>
                </div>

                {/* Entrenador */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    Entrenador:
                  </span>
                  <span className="text-gray-100 font-medium text-right">
                    {reserva.entrenador_nombre} {reserva.entrenador_apellido_p}
                  </span>
                </div>

                {/* Equipo */}
                {reserva.equipo_nombre && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <RiSettings3Line className="w-4 h-4" />
                      Equipo:
                    </span>
                    <span className="text-gray-100 font-medium text-right">
                      {reserva.equipo_nombre}
                    </span>
                  </div>
                )}
              </div>

              {/* Fecha de reserva */}
              <div className="mt-6 pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <RiTimeLine className="w-4 h-4" />
                    Reservado el:
                  </span>
                  <span className="text-gray-100 font-medium">
                    {formatearFechaHora(reserva.fecha_reserva)}
                  </span>
                </div>
              </div>

              {/* Comentarios originales */}
              {reserva.comentarios && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <span className="text-sm font-medium text-gray-300 block mb-2">Comentarios:</span>
                  <div className="text-gray-100 italic bg-gray-700/50 p-3 rounded-lg">
                    "{reserva.comentarios}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerta de tiempo restante */}
          <div className={`border rounded-lg p-4 ${
            sinPenalizacion 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${
                sinPenalizacion ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {sinPenalizacion ? (
                  <RiCheckLine className="w-5 h-5" />
                ) : (
                  <RiAlertLine className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium mb-2 ${
                  sinPenalizacion ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {sinPenalizacion ? 'Cancelación sin penalización' : 'Cancelación tardía'}
                </h3>
                <div className={`text-sm ${
                  sinPenalizacion ? 'text-green-300' : 'text-yellow-300'
                }`}>
                  <p className="mb-2">
                    <strong>Tiempo restante hasta la sesión:</strong> {tiempoRestante}
                  </p>
                  {sinPenalizacion ? (
                    <p className="flex items-center gap-2">
                      <RiCheckLine className="w-4 h-4" />
                      Puedes cancelar sin penalización (más de 24 horas de anticipación)
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <RiAlertLine className="w-4 h-4" />
                      Cancelación con menos de 24 horas de anticipación. Pueden aplicar políticas de cancelación.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmación de cancelación */}
          <div className="p-4 rounded-lg border-l-4 bg-red-500/10 border-red-500">
            <div className="flex items-start gap-3">
              <RiErrorWarningLine className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-1">
                  Confirmar cancelación
                </h3>
                <div className="text-sm text-red-300">
                  ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
                  {!sinPenalizacion && (
                    <span className="block mt-2 font-medium text-red-400">
                      ⚠ Cancelación con menos de 24 horas de anticipación.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional para admin */}
          {usuario?.rol === 'administrador' && (
            <div className="p-4 rounded-lg border-l-4 bg-yellow-500/10 border-yellow-500">
              <div className="flex items-start gap-3">
                <RiShieldCheckLine className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-400 mb-1">
                    Información para administrador
                  </h4>
                  <p className="text-sm text-yellow-300">
                    Como administrador, puedes cancelar cualquier reserva. El cliente será notificado de la cancelación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
            >
              Mantener Reserva
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <RiDeleteBin6Line className="w-5 h-5" />
                  <span>Confirmar Cancelación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelarReservaModal;