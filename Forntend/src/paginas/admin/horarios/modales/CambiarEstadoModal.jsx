import React, { useState } from "react";
import {
  RiCloseLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiShieldCheckLine,
  RiLoader4Line,
  RiGroupLine,
} from "react-icons/ri";

const CambiarEstadoModal = ({ isOpen, onClose, onConfirm, horario }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const estaActivo = horario?.estado === "activo";
  const nuevoEstado = estaActivo ? "desactivado" : "activo";
  const accion = estaActivo ? "desactivar" : "activar";
  const accionCapitalizada = estaActivo ? "Desactivar" : "Activar";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";

    try {
      // 🔥 SOLUCIÓN: Parsear la fecha correctamente
      const [year, month, day] = fecha
        .split("-")
        .map((num) => parseInt(num, 10));
      const dateObj = new Date(year, month - 1, day);

      return dateObj.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return fecha;
    }
  };

  // Formatear hora
  const formatearHora = (hora) => {
    if (!hora) return "N/A";
    try {
      return new Date(`2000-01-01T${hora}`).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return hora;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl shadow-2xl shadow-yellow-500/20 w-full max-w-lg max-h-[80vh] overflow-y-auto">

        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              {estaActivo ? (
                <RiCloseCircleLine className="h-6 w-6 text-gray-900" />
              ) : (
                <RiCheckboxCircleLine className="h-6 w-6 text-gray-900" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                {accionCapitalizada} Horario
              </h2>
              <p className="text-gray-400 text-sm">
                {estaActivo
                  ? "El horario dejará de estar disponible"
                  : "El horario volverá a estar disponible"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Mensaje de confirmación */}
          <div className={`p-4 rounded-lg border-l-4 ${
            estaActivo
              ? "bg-red-500/10 border-red-500 text-red-400"
              : "bg-green-500/10 border-green-500 text-green-400"
          }`}>
            <div className="flex items-center gap-3">
              <RiAlertLine className={`w-5 h-5 ${
                estaActivo ? "text-red-400" : "text-green-400"
              }`} />
              <div>
                <p className="font-medium">
                  ¿Estás seguro que deseas {accion} este horario?
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {estaActivo
                    ? "Los usuarios no podrán inscribirse a este horario"
                    : "Los usuarios podrán inscribirse nuevamente a este horario"}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del horario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              <RiCalendarLine className="inline h-5 w-5 mr-2" />
              Detalles del Horario
            </h3>

            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
              
              {/* Nombre */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Nombre:</span>
                <span className="text-gray-100 font-medium">
                  {horario?.nombre_horario || "N/A"}
                </span>
              </div>

              {/* Tipo */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Tipo:</span>
                <span className="text-gray-100 font-medium capitalize">
                  {horario?.tipo || "N/A"}
                </span>
              </div>

              {/* Fecha */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Fecha:</span>
                <span className="text-gray-100 font-medium">
                  {formatearFecha(horario?.fecha)}
                </span>
              </div>

              {/* Horario */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                  <RiTimeLine className="w-4 h-4" />
                  Horario:
                </span>
                <span className="text-gray-100 font-medium">
                  {formatearHora(horario?.hora_inicio)} - {formatearHora(horario?.hora_fin)}
                </span>
              </div>

              {/* Entrenador */}
              {horario?.entrenador && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                    <RiUserLine className="w-4 h-4" />
                    Entrenador:
                  </span>
                  <span className="text-gray-100 font-medium flex items-center gap-1">
                    {horario.entrenador.nombre} {horario.entrenador.apellido_p}
                    {horario.entrenador.rol === "administrador" && (
                      <RiShieldCheckLine className="w-4 h-4 text-yellow-400" />
                    )}
                  </span>
                </div>
              )}

              {/* Capacidad */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                  <RiGroupLine className="w-4 h-4" />
                  Capacidad:
                </span>
                <span className="text-gray-100 font-medium">
                  {horario?.capacidad || 0} personas
                </span>
              </div>

              {/* Estados */}
              <div className="pt-3 border-t border-gray-600 space-y-3">
                {/* Estado actual */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Estado actual:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    estaActivo
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {horario?.estado || "N/A"}
                  </span>
                </div>

                {/* Nuevo estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Nuevo estado:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    !estaActivo
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {nuevoEstado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`px-6 py-3 font-medium rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                estaActivo
                  ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/25 hover:shadow-red-500/40"
                  : "bg-green-500 hover:bg-green-400 text-white shadow-green-500/25 hover:shadow-green-500/40"
              }`}
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {estaActivo ? (
                    <RiCloseCircleLine className="w-4 h-4" />
                  ) : (
                    <RiCheckboxCircleLine className="w-4 h-4" />
                  )}
                  Confirmar {accionCapitalizada}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CambiarEstadoModal;