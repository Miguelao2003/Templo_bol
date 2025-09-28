import React, { useState } from "react";
import {
  RiCloseLine,
  RiDeleteBin6Line,
  RiAlertLine,
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiGroupLine,
  RiShieldCheckLine,
  RiLoader4Line,
  RiErrorWarningLine,
} from "react-icons/ri";

const EliminarHorarioModal = ({ isOpen, onClose, onConfirm, horario }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (showConfirmInput && confirmText.toLowerCase() !== "eliminar") {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(horario.id_horario);
    } catch (error) {
      console.error("Error al eliminar horario:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setShowConfirmInput(false);
    onClose();
  };

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

  const isValidConfirmText = confirmText.toLowerCase() === "eliminar";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl shadow-2xl shadow-yellow-500/20 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <RiDeleteBin6Line className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Eliminar Horario
              </h2>
              <p className="text-gray-400 text-sm">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Mensaje de advertencia */}
          <div className="p-4 rounded-lg border-l-4 bg-red-500/10 border-red-500">
            <div className="flex items-start gap-3">
              <RiErrorWarningLine className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400 mb-1">
                  ¡Advertencia! Esta acción es irreversible
                </p>
                <p className="text-gray-400 text-sm">
                  El horario será eliminado permanentemente de la base de datos.
                  Los usuarios inscritos perderán acceso a este entrenamiento.
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del horario */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              <RiCalendarLine className="inline h-5 w-5 mr-2" />
              Horario a Eliminar
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

              {/* Estado */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                <span className="text-sm font-medium text-gray-300">Estado:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  horario?.estado === "activo"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {horario?.estado || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmación con texto */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <input
                type="checkbox"
                id="confirmDelete"
                checked={showConfirmInput}
                onChange={(e) => {
                  setShowConfirmInput(e.target.checked);
                  if (!e.target.checked) {
                    setConfirmText("");
                  }
                }}
                className="w-4 h-4 text-yellow-500 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2 mt-0.5"
              />
              <label htmlFor="confirmDelete" className="text-sm text-yellow-400 font-medium">
                Entiendo que esta acción es irreversible y eliminará permanentemente este horario
              </label>
            </div>

            {showConfirmInput && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Escribe{" "}
                  <span className="font-bold text-red-400">"eliminar"</span>{" "}
                  para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="eliminar"
                  className={`w-full bg-gray-800 border text-gray-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400 ${
                    confirmText && !isValidConfirmText
                      ? "border-red-500 focus:border-red-500"
                      : confirmText && isValidConfirmText
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-600 focus:border-yellow-500"
                  }`}
                  disabled={loading}
                />
                {confirmText && !isValidConfirmText && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <RiErrorWarningLine className="w-4 h-4" />
                    Debes escribir exactamente "eliminar"
                  </p>
                )}
                {confirmText && isValidConfirmText && (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <RiAlertLine className="w-4 h-4" />
                    Confirmación válida. Puedes proceder con la eliminación.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || (showConfirmInput && !isValidConfirmText)}
              className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <RiDeleteBin6Line className="w-4 h-4" />
                  Eliminar Horario
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliminarHorarioModal;