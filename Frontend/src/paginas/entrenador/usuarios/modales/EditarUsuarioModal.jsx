import React from "react";
import {
  X,
  User,
  Mail,
  Weight,
  Ruler,
  Calendar,
  Target,
  Edit3,
  Lock,
  Award,
} from "lucide-react";

const EditarUsuarioModal = ({
  isOpen,
  onClose,
  onSave,
  usuario,
  onChange,
  roles,
  categorias,
  niveles,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-2xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Edit3 className="h-5 w-5 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400">
              Editar Usuario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={usuario.nombre || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="Ingrese el nombre"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="apellido_p"
                  value={usuario.apellido_p || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="Ingrese apellido paterno"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="apellido_m"
                  value={usuario.apellido_m || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="Ingrese apellido materno"
                />
              </div>

              {/* Campo de correo (deshabilitado) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Correo Electrónico
                  <span className="text-xs text-gray-500 ml-2">
                    (No editable)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="correo"
                    value={usuario.correo || ""}
                    className="w-full bg-gray-800/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Configuración del Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Selector de Rol (inhabilitado) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol
                  <span className="text-xs text-gray-500 ml-2">
                    (No editable)
                  </span>
                </label>
                <div className="relative">
                  <select
                    name="rol"
                    value={usuario.rol || ""}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed appearance-none"
                  >
                    {Object.entries(roles).map(([key, value]) => (
                      <option key={value} value={value} className="bg-gray-800">
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría
                  <span className="text-xs text-gray-500 ml-2">
                    (No editable)
                  </span>
                </label>
                <div className="relative">
                  <select
                    name="categoria"
                    value={usuario.categoria || ""}
                    className="w-full bg-gray-800/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed appearance-none"
                    disabled
                  >
                    <option value="" className="bg-gray-800">
                      Seleccione una categoría
                    </option>
                    {Object.entries(categorias).map(([key, value]) => (
                      <option key={value} value={value} className="bg-gray-800">
                        {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>

              {/* Campo Nivel - EDITABLE para clientes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Award className="inline h-4 w-4 mr-2" />
                  Nivel *
                </label>
                <select
                  name="nivel"
                  value={usuario.nivel || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Seleccione un nivel
                  </option>
                  {Object.entries(niveles).map(([key, value]) => (
                    <option key={value} value={value} className="bg-gray-800">
                      {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Información Física y Objetivos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Información Física y Objetivos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Weight className="inline h-4 w-4 mr-2" />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="peso"
                  value={usuario.peso || ""}
                  onChange={onChange}
                  step="0.1"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="70.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Ruler className="inline h-4 w-4 mr-2" />
                  Altura (m)
                </label>
                <input
                  type="number"
                  name="altura"
                  value={usuario.altura || ""}
                  onChange={onChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="1.75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Edad
                </label>
                <input
                  type="number"
                  name="edad"
                  value={usuario.edad || ""}
                  onChange={onChange}
                  min="0"
                  max="120"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Género
                </label>
                <select
                  name="genero"
                  value={usuario.genero || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                >
                  <option value="" className="bg-gray-800">
                    Seleccione género
                  </option>
                  <option value="Masculino" className="bg-gray-800">
                    Masculino
                  </option>
                  <option value="Femenino" className="bg-gray-800">
                    Femenino
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Target className="inline h-4 w-4 mr-2" />
                  Objetivo
                </label>
                <select
                  name="objetivo"
                  value={usuario.objetivo || ""}
                  onChange={onChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                >
                  <option value="" className="bg-gray-800">
                    Seleccione objetivo
                  </option>
                  <option value="perdida de peso" className="bg-gray-800">
                    Pérdida de peso
                  </option>
                  <option value="aumento de peso" className="bg-gray-800">
                    Aumento de peso
                  </option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-700">
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
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarUsuarioModal;