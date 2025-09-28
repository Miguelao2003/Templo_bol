import React from 'react';
import { RiCloseLine, RiToolsLine, RiCheckboxCircleLine, RiAlertLine, RiFlashlightLine, RiCalendarLine } from "react-icons/ri";

const CambiarEstadoModal = ({ isOpen, onClose, onConfirm, equipo }) => {
  if (!isOpen) return null;

  const estadoActivo = equipo?.estado === "activo";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl w-full max-w-lg shadow-2xl shadow-yellow-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${estadoActivo ? 'bg-orange-500' : 'bg-green-500'}`}>
              {estadoActivo ? (
                <RiToolsLine className="h-5 w-5 text-white" />
              ) : (
                <RiCheckboxCircleLine className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                {estadoActivo ? "Cambiar a Mantenimiento" : "Activar Equipo"}
              </h2>
              <p className="text-gray-400 text-sm">
                Confirma el cambio de estado del equipo
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Mensaje de confirmación */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg mt-1">
              <RiAlertLine className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-300 font-medium mb-2">
                ¿Estás seguro que deseas cambiar el estado del equipo?
              </p>
              <p className="text-gray-400 text-sm">
                {estadoActivo 
                  ? "El equipo quedará fuera de servicio hasta que sea reactivado."
                  : "El equipo volverá a estar disponible para su uso."
                }
              </p>
            </div>
          </div>

          {/* Información del equipo */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Detalles del Equipo
            </h3>
            
            <div className="space-y-3">
              {/* Nombre del equipo */}
              <div className="flex items-center gap-3">
                <RiFlashlightLine className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Nombre:</span>
                <span className="text-white font-medium">{equipo?.nombre_equipo}</span>
              </div>

              {/* Estado actual */}
              <div className="flex items-center gap-3">
                <div className={`h-4 w-4 rounded-full ${estadoActivo ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-gray-400">Estado actual:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  estadoActivo
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                }`}>
                  {estadoActivo ? "🟢 Activo" : "🔧 Mantenimiento"}
                </span>
              </div>

              {/* Fechas de mantenimiento */}
              {(equipo?.ultimo_mantenimiento || equipo?.proximo_mantenimiento) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-700/50">
                  {equipo?.ultimo_mantenimiento && (
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Último mantenimiento</p>
                        <p className="text-sm text-white">{new Date(equipo.ultimo_mantenimiento).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                  {equipo?.proximo_mantenimiento && (
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Próximo mantenimiento</p>
                        <p className="text-sm text-white">{new Date(equipo.proximo_mantenimiento).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nota informativa */}
          <div className={`border rounded-lg p-3 ${
            estadoActivo 
              ? 'bg-orange-500/10 border-orange-500/20' 
              : 'bg-green-500/10 border-green-500/20'
          }`}>
            <p className={`text-xs leading-relaxed ${
              estadoActivo ? 'text-orange-400' : 'text-green-400'
            }`}>
              <span className="font-semibold">
                {estadoActivo ? "⚠️ Advertencia:" : "✅ Confirmación:"}
              </span> {estadoActivo 
                ? "Al poner el equipo en mantenimiento, no estará disponible para los usuarios hasta que sea reactivado. Se podrá visualizar pero no podrán reservar."
                : "Al activar el equipo, estará inmediatamente disponible para su uso en el gimnasio."
              }
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 p-6 pt-0 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg ${
              estadoActivo
                ? "bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/25 hover:shadow-orange-500/40"
                : "bg-green-500 hover:bg-green-400 text-white shadow-green-500/25 hover:shadow-green-500/40"
            }`}
          >
            {estadoActivo ? (
              <>
                <RiToolsLine className="w-5 h-5" />
                Poner en Mantenimiento
              </>
            ) : (
              <>
                <RiCheckboxCircleLine className="w-5 h-5" />
                Activar Equipo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CambiarEstadoModal;