import React from "react";
import { RiCloseLine, RiSaveLine, RiEditLine, RiFlashlightLine } from "react-icons/ri";

const EditarEquipoModal = ({
  isOpen,
  onClose,
  onSave,
  equipo,
  onChange,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl w-full max-w-2xl shadow-2xl shadow-yellow-500/20 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiEditLine className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Editar Equipo
              </h2>
              <p className="text-gray-400 text-sm">
                Modifica la información del equipo seleccionado
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiFlashlightLine className="inline h-4 w-4 mr-2" />
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  name="nombre_equipo"
                  value={equipo.nombre_equipo || ""}
                  onChange={onChange}
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="Ej: Powerplate My5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado *
                </label>
                <select
                  name="estado"
                  value={equipo.estado || ""}
                  onChange={onChange}
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                >
                  <option value="" className="bg-gray-800">Seleccione estado</option>
                  <option value="activo" className="bg-gray-800">🟢 Activo</option>
                  <option value="mantenimiento" className="bg-gray-800">🔧 Mantenimiento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Mantenimiento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Programación de Mantenimiento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de último mantenimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Último Mantenimiento
                </label>
                <input
                  type="date"
                  name="ultimo_mantenimiento"
                  value={equipo.ultimo_mantenimiento || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
              </div>

              {/* Fecha de próximo mantenimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Próximo Mantenimiento
                </label>
                <input
                  type="date"
                  name="proximo_mantenimiento"
                  value={equipo.proximo_mantenimiento || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Especificaciones Técnicas
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción Técnica
              </label>
              <textarea
                name="especificaciones_tecnicas"
                value={equipo.especificaciones_tecnicas || ""}
                onChange={onChange}
                rows={4}
                placeholder="Describe las características técnicas del equipo, capacidades, dimensiones, etc..."
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 resize-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
              />
            </div>
          </div>
        </form>

        {/* Nota informativa */}
        <div className="px-6 pb-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-xs leading-relaxed">
              <span className="font-semibold">Nota:</span> Los cambios se aplicarán inmediatamente al guardar. 
              Asegúrate de verificar las fechas de mantenimiento antes de confirmar.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 p-6 pt-0 border-t border-gray-700 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
          >
            <RiSaveLine className="w-5 h-5" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarEquipoModal;