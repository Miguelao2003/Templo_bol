import React, { useState } from "react";
import {
  RiUserLine,
  RiEditLine,
  RiToggleLine,
  RiShieldCheckLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiMoreLine,
  RiMailLine,
  RiScales3Line,
  RiRulerLine,
  RiCalendarLine,
  RiFocus3Line,
  RiAwardLine,
} from "react-icons/ri";

const UsuarioTable = ({ usuarios, loading, onEdit, onChangeStatus }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedUsers, setSelectedUsers] = useState([]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-700 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-xl font-semibold text-white mb-2">
          Cargando usuarios...
        </div>
        <div className="text-gray-400">Obteniendo datos del servidor</div>
      </div>
    );
  }

  if (!usuarios.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-700">
          <RiUserLine className="w-12 h-12 text-gray-500" />
        </div>
        <div className="text-xl font-semibold text-white mb-2">
          No se encontraron usuarios
        </div>
        <div className="text-gray-400 text-center">
          Intenta ajustar los filtros de búsqueda o crear un nuevo usuario
        </div>
      </div>
    );
  }

  const formatObjetivo = (objetivo) => {
    switch (objetivo) {
      case "Perdida de peso":
        return "Pérdida peso";
      case "Aumento de peso":
        return "Aumento peso";
      case "perdida de peso":
        return "Pérdida peso";
      case "aumento de peso":
        return "Aumento peso";
      default:
        return objetivo || "-";
    }
  };

  // NUEVA FUNCIÓN para formatear nivel
  const formatNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "principiante":
        return "Principiante";
      case "intermedio":
        return "Intermedio";
      case "avanzado":
        return "Avanzado";
      default:
        return nivel || "-";
    }
  };

  // NUEVA FUNCIÓN para obtener color del nivel
  const getNivelColor = (nivel) => {
    switch(nivel?.toLowerCase()) {
      case "principiante": return "bg-lime-500/20 text-lime-400 border-lime-500/30";        // Verde lima
      case "intermedio": return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";    // Índigo-violeta
      case "avanzado": return "bg-orange-500/20 text-orange-400 border-orange-500/30";      // Naranja
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // NUEVA FUNCIÓN para obtener color de categoría
  const getCategoriaColor = (categoria) => {
    switch(categoria?.toLowerCase()) {
      case "calistenia": 
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "powerplate": 
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      default: 
        return "bg-gray-800/50 border border-gray-600/50 text-gray-300";
    }
  };

  const getRoleColor = (rol) => {
    switch (rol?.toLowerCase()) {
      case "administrador":
        return "from-yellow-400 to-yellow-500";
      case "entrenador":
        return "from-blue-400 to-blue-500";
      case "cliente":
        return "from-purple-500 to-purple-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol?.toLowerCase()) {
      case "administrador":
        return RiShieldCheckLine;
      case "entrenador":
        return RiFocus3Line;
      case "cliente":
        return RiUserLine;
      default:
        return RiUserLine;
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedUsuarios = [...usuarios].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = a[sortField];
    let bValue = b[sortField];

    // Manejar valores null/undefined
    if (aValue == null) aValue = "";
    if (bValue == null) bValue = "";

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = typeof bValue === "string" ? bValue.toLowerCase() : "";
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <RiArrowUpLine className="w-4 h-4 opacity-30" />;
    return sortDirection === "asc" ? (
      <RiArrowUpLine className="w-4 h-4 text-yellow-400" />
    ) : (
      <RiArrowDownLine className="w-4 h-4 text-yellow-400" />
    );
  };

  const headers = [
    { key: "nombre", label: "Usuario", sortable: true },
    { key: "correo", label: "Email", sortable: true },
    { key: "rol", label: "Rol", sortable: true },
    { key: "genero", label: "Género", sortable: true },
    { key: "objetivo", label: "Objetivo", sortable: true },
    { key: "nivel", label: "Nivel", sortable: true },
    { key: "peso", label: "Peso", sortable: true },
    { key: "altura", label: "Altura", sortable: true },
    { key: "edad", label: "Edad", sortable: true },
    { key: "categoria", label: "Categoría", sortable: true },
    { key: "activo", label: "Estado", sortable: true },
    { key: "acciones", label: "Acciones", sortable: false },
  ];

  return (
    <div className="overflow-hidden">
      {/* Header con contadores */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Mostrando{" "}
              <span className="text-white font-semibold">
                {usuarios.length}
              </span>{" "}
              usuarios
            </span>
            {selectedUsers.length > 0 && (
              <span className="text-sm text-yellow-400">
                {selectedUsers.length} seleccionados
              </span>
            )}
          </div>

          <div className="flex items-center gap-2"></div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className={`px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider ${
                      header.sortable
                        ? "cursor-pointer hover:text-yellow-400 transition-colors"
                        : ""
                    }`}
                    onClick={() => header.sortable && handleSort(header.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{header.label}</span>
                      {header.sortable && <SortIcon field={header.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/50">
              {sortedUsuarios.map((usuario, index) => {
                const RoleIcon = getRoleIcon(usuario.rol);
                const isSelected = selectedUsers.includes(usuario.id_usuario);

                return (
                  <tr
                    key={usuario.id_usuario}
                    className={`hover:bg-gray-800/30 transition-all duration-300 group ${
                      isSelected
                        ? "bg-yellow-400/5 border-l-4 border-l-yellow-400"
                        : ""
                    } ${index % 2 === 0 ? "bg-gray-900/20" : "bg-gray-800/20"}`}
                  >
                    {/* Usuario */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600">
                          <RiUserLine className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">
                            {usuario.nombre} {usuario.apellido_p}{" "}
                            {usuario.apellido_m}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {usuario.id_usuario}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <RiMailLine className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm truncate">
                          {usuario.correo}
                        </span>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getRoleColor(
                          usuario.rol
                        )} text-black text-xs font-semibold`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{usuario.rol}</span>
                      </div>
                    </td>

                    {/* Género */}
                    <td className="px-4 py-4">
                      <span className="text-gray-300 text-sm capitalize">
                        {usuario.genero || "-"}
                      </span>
                    </td>

                    {/* Objetivo */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <RiFocus3Line className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">
                          {formatObjetivo(usuario.objetivo)}
                        </span>
                      </div>
                    </td>

                    {/* COLUMNA NIVEL */}
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${getNivelColor(
                          usuario.nivel
                        )}`}
                      >
                        <RiAwardLine className="w-3 h-3" />
                        <span>{formatNivel(usuario.nivel)}</span>
                      </div>
                    </td>

                    {/* Peso */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <RiScales3Line className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">
                          {usuario.peso ? `${usuario.peso} kg` : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Altura */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <RiRulerLine className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">
                          {usuario.altura ? `${usuario.altura} m` : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Edad */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <RiCalendarLine className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300 text-sm">
                          {usuario.edad || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Categoría - ACTUALIZADA CON COLORES */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getCategoriaColor(usuario.categoria)}`}>
                        {usuario.categoria || "-"}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          usuario.activo
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            usuario.activo ? "bg-green-400" : "bg-red-400"
                          }`}
                        ></div>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(usuario)}
                          className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors group/btn"
                          title="Editar usuario"
                        >
                          <RiEditLine className="w-4 h-4 text-yellow-400 group-hover/btn:text-yellow-300" />
                        </button>

                        <button
                          onClick={() => onChangeStatus(usuario)}
                          className={`p-2 rounded-lg transition-colors group/btn ${
                            usuario.activo
                              ? "hover:bg-red-500/10"
                              : "hover:bg-green-500/10"
                          }`}
                          title={usuario.activo ? "Desactivar" : "Activar"}
                        >
                          <RiToggleLine
                            className={`w-4 h-4 ${
                              usuario.activo
                                ? "text-red-400 group-hover/btn:text-red-300"
                                : "text-green-400 group-hover/btn:text-green-300"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total: {usuarios.length} usuarios</span>
          <span>Actualizaciones en tiempo real</span>
        </div>
      </div>
    </div>
  );
};

export default UsuarioTable;