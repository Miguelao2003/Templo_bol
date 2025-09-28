import React, { useState } from 'react';
import {
  RiCloseLine,
  RiUserLine,
  RiCalendarLine,
  RiTimeLine,
  RiSettings3Line,
  RiDeleteBinLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCheckLine,
  RiInformationLine,
  RiBookOpenLine,
  RiAlertLine,
  RiAwardLine,
  RiBarChartLine
} from 'react-icons/ri';
import { MdFitnessCenter } from 'react-icons/md';
import { GiMuscleUp } from 'react-icons/gi';
import ReservaService from '../../../../services/reservas';
import { getLocalUser } from '../../../../services/auth';

const CancelarReservaModalCliente = ({ isOpen, onClose, onConfirm, reserva }) => {
  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usuario = getLocalUser();

  // Manejar cancelación
  const handleCancelar = async () => {
    if (!reserva) return;

    setLoading(true);
    setError('');

    try {
      console.log('Cancelando reserva:', reserva.id_reserva);

      const response = await ReservaService.cancelarReserva(reserva.id_reserva);
      console.log('Respuesta del servicio:', response);

      if (response.success) {
        // Llamar a onConfirm para actualizar la lista
        onConfirm();
      } else {
        console.log('Error del servicio:', response.message);
        setError(response.message || 'Error al cancelar la reserva');
      }
    } catch (error) {
      console.error('Error completo:', error);
      
      let mensajeError = 'Error al cancelar la reserva';
      
      // Intentar obtener el mensaje de error del backend
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // Obtener información del nivel
  const getNivelInfo = (nivel) => {
    const niveles = {
      principiante: {
        color: "text-green-400",
        bg: "bg-green-500/20 border-green-500/30",
        texto: "Principiante"
      },
      intermedio: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/20 border-yellow-500/30",
        texto: "Intermedio"
      },
      avanzado: {
        color: "text-red-400",
        bg: "bg-red-500/20 border-red-500/30",
        texto: "Avanzado"
      }
    };
    return niveles[nivel] || {
      color: "text-gray-400",
      bg: "bg-gray-500/20 border-gray-500/30",
      texto: nivel
    };
  };

  // Formatear nombre completo del entrenador
  const formatearNombreEntrenador = (reserva) => {
    const nombre = reserva.entrenador_nombre || "";
    const apellidoP = reserva.entrenador_apellido_p || "";
    const apellidoM = reserva.entrenador_apellido_m || "";
    return `${nombre} ${apellidoP} ${apellidoM}`.trim();
  };

  // Parsear arrays JSON de manera segura
  const parseJsonArray = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Mostrar información de asistencia si existe
  const mostrarAsistencia = (reserva) => {
    if (reserva.asistencia !== null && reserva.asistencia !== undefined) {
      const porcentaje = reserva.asistencia;
      let colorClase = "";
      
      if (porcentaje >= 80) colorClase = "text-green-400";
      else if (porcentaje >= 60) colorClase = "text-yellow-400";
      else colorClase = "text-red-400";
      
      return (
        <div className="flex justify-between">
          <span className="text-gray-400">Asistencia:</span>
          <span className={`font-medium ${colorClase}`}>{porcentaje}%</span>
        </div>
      );
    }
    return null;
  };

  // Formatear fecha para mostrar - CORREGIDO
  const formatearFecha = (fecha) => {
    // Si la fecha viene como string YYYY-MM-DD, parsearlo correctamente
    let fechaObj;

    if (typeof fecha === "string") {
      // Para fechas en formato YYYY-MM-DD, crear la fecha sin problemas de zona horaria
      const [year, month, day] = fecha.split("-").map(Number);
      fechaObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
    } else {
      fechaObj = new Date(fecha);
    }

    return fechaObj.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formatear hora
  const formatearHora = (hora) => {
    return hora.slice(0, 5);
  };

  // Cerrar modal
  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen || !reserva) return null;

  const isPowerplate = reserva.horario_tipo === 'powerplate';
  const nivelInfo = getNivelInfo(reserva.horario_nivel);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-2">
      <div className="bg-gray-900 border-2 border-red-500/30 rounded-xl shadow-2xl shadow-red-500/20 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header - Compacto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500">
              <RiDeleteBinLine className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">
                Cancelar Reserva
              </h2>
              <p className="text-xs text-gray-400">
                {reserva.horario_nombre || `Sesión de ${isPowerplate ? 'PowerPlate' : 'Calistenia'}`}
                {reserva.horario_nivel && (
                  <span className={`ml-2 ${nivelInfo.color}`}>
                    • {nivelInfo.texto}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-red-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            
            {/* Mensaje de advertencia */}
            <div className="mb-4 p-3 rounded-lg border-l-4 bg-red-500/10 border-red-500">
              <div className="flex items-start gap-2">
                <RiAlertLine className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-400 text-sm mb-1">¿Estás seguro que deseas cancelar esta reserva?</h4>
                  <p className="text-red-300 text-xs">
                    Esta acción no se puede deshacer. Tu cupo en este turno será liberado para otros clientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg border-l-4 bg-red-500/10 border-red-500 text-red-400">
                <div className="flex items-center gap-2">
                  <RiErrorWarningLine className="w-4 h-4" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna 1 - Información básica */}
              <div className="space-y-4">
                
                {/* Tu información - Compacto */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                    <RiUserLine className="inline h-4 w-4 mr-2" />
                    Tu Información
                  </h3>
                  
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="text-white font-medium">
                          {usuario?.nombre} {usuario?.apellido_p}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Categoría:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                            isPowerplate
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}
                        >
                          {usuario?.categoria}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles de la reserva - Compacto */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                    <RiCalendarLine className="inline h-4 w-4 mr-2" />
                    Detalles de la Reserva
                  </h3>
                  
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reserva #:</span>
                      <span className="text-white font-medium">{reserva.id_reserva}</span>
                    </div>
                    {reserva.horario_nombre && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Horario:</span>
                        <span className="text-white font-medium">{reserva.horario_nombre}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-white font-medium">
                        {formatearFecha(reserva.horario_fecha)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hora:</span>
                      <span className="text-white font-medium">
                        {formatearHora(reserva.horario_hora_inicio)} - {formatearHora(reserva.horario_hora_fin)}
                      </span>
                    </div>
                    {reserva.horario_nivel && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Nivel:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${nivelInfo.bg} ${nivelInfo.color}`}
                        >
                          {nivelInfo.texto}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entrenador:</span>
                      <span className="text-white font-medium">
                        {formatearNombreEntrenador(reserva)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estado:</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-500/20 text-green-400 border-green-500/30">
                        {reserva.estado}
                      </span>
                    </div>
                    {reserva.equipo_nombre && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Equipo:</span>
                        <span className="text-blue-400 font-medium">{reserva.equipo_nombre}</span>
                      </div>
                    )}
                    {mostrarAsistencia(reserva)}
                  </div>
                </div>

                {/* Comentarios si existen */}
                {reserva.comentarios && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                      <RiInformationLine className="inline h-4 w-4 mr-2" />
                      Comentarios
                    </h3>
                    
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                      <p className="text-gray-300 text-sm leading-relaxed italic">
                        {reserva.comentarios}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna 2 - Rutina */}
              {reserva.rutina_nombre && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                    <MdFitnessCenter className="inline h-4 w-4 mr-2" />
                    Rutina Planificada
                  </h3>

                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 space-y-3">
                    {/* Ejercicios compactos */}
                    {(() => {
                      let ejercicios = parseJsonArray(reserva.rutina_ejercicios);
                      let series = parseJsonArray(reserva.rutina_series);
                      let repeticiones = parseJsonArray(reserva.rutina_repeticiones);

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MdFitnessCenter className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">
                              {reserva.rutina_nombre}
                            </span>
                          </div>

                          {/* Lista compacta de ejercicios */}
                          {ejercicios.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {ejercicios.slice(0, 8).map((ejercicio, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-gray-700/30 rounded p-2 border border-gray-600/30"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-500/20 text-blue-400 w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-100">{ejercicio}</span>
                                  </div>
                                  {(series[index] || repeticiones[index]) && (
                                    <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                      {series[index] && <span className="text-blue-300">{series[index]}s</span>}
                                      {series[index] && repeticiones[index] && <span className="text-gray-500"> × </span>}
                                      {repeticiones[index] && <span className="text-green-300">{repeticiones[index]}r</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {ejercicios.length > 8 && (
                                <div className="text-xs text-gray-500 text-center py-1">
                                  +{ejercicios.length - 8} ejercicios más
                                </div>
                              )}
                            </div>
                          )}

                          {/* Músculos trabajados - compacto */}
                          {reserva.rutina_partes_musculo && parseJsonArray(reserva.rutina_partes_musculo).length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <GiMuscleUp className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-400">Músculos</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {parseJsonArray(reserva.rutina_partes_musculo).map((musculo, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                  >
                                    {musculo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Columna 3 - Información sobre cancelación */}
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <RiInformationLine className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-300">
                      <p className="font-medium mb-2">Información sobre la cancelación</p>
                      <ul className="text-xs text-red-200 space-y-1">
                        <li>• Tu cupo será liberado inmediatamente</li>
                        <li>• Otros clientes podrán reservar este turno</li>
                        <li>• No se aplicarán penalizaciones</li>
                        <li>• Podrás reservar otros horarios disponibles</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Políticas de cancelación */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <RiAlertLine className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-300">
                      <p className="font-medium mb-1">Política de cancelación:</p>
                      <ul className="text-xs text-yellow-200 space-y-1">
                        <li>• Cancelaciones hasta 1 hora antes del turno</li>
                        <li>• Turnos del mismo día: 2 horas antes</li>
                        <li>• Cancelaciones tardías pueden generar penalizaciones</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Información del equipo (solo powerplate) */}
                {isPowerplate && reserva.equipo_nombre && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <RiSettings3Line className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-300">
                        <p className="font-medium mb-1">Equipo reservado:</p>
                        <p className="text-xs text-blue-200 mb-2">
                          El equipo <strong>{reserva.equipo_nombre}</strong> quedará disponible 
                          para otros clientes.
                        </p>
                        {reserva.equipo_descripcion && (
                          <p className="text-xs text-blue-200 italic">
                            {reserva.equipo_descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Información del nivel si existe */}
                {reserva.horario_nivel && (
                  <div className={`border rounded-lg p-3 ${nivelInfo.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <RiAwardLine className={`w-4 h-4 ${nivelInfo.color}`} />
                      <span className={`text-sm font-medium ${nivelInfo.color}`}>
                        Nivel {nivelInfo.texto}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Al cancelar este turno de nivel {nivelInfo.texto.toLowerCase()}, 
                      puedes buscar otros horarios del mismo nivel.
                    </p>
                  </div>
                )}

               
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción - Fijos en la parte inferior */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
          >
            No, mantener reserva
          </button>
          <button
            onClick={handleCancelar}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <RiLoader4Line className="w-4 h-4 animate-spin" />
                <span>Cancelando...</span>
              </>
            ) : (
              <>
                <RiDeleteBinLine className="w-4 h-4" />
                <span>Sí, cancelar reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelarReservaModalCliente;