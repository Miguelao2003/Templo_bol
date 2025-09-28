import React, { useState } from "react";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiTimeLine,
  RiUserLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiMore2Line,
  RiPlayLine,
  RiPauseLine,
  RiInformationLine,
  RiToggleLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiGroupLine,
  RiTrophyLine,
} from "react-icons/ri";
import { FaDumbbell } from "react-icons/fa6";
import { 
  GiBodyBalance,
  GiMuscleUp 
 } from "react-icons/gi";


const HorarioTable = ({
  horarios,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onChangeStatus,
}) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedHorarios, setSelectedHorarios] = useState([]);
  const [expandedHorario, setExpandedHorario] = useState(null); // Estado para expandir

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedHorarios = React.useMemo(() => {
    if (!sortField) return horarios;

    return [...horarios].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Manejar campos anidados
      if (sortField === "entrenador_nombre") {
        aValue = `${a.entrenador?.nombre} ${a.entrenador?.apellido_p}`;
        bValue = `${b.entrenador?.nombre} ${b.entrenador?.apellido_p}`;
      }

      if (sortField === "rutina_nombre") {
        aValue = Array.isArray(a.rutina?.nombre_ejercicio) 
          ? a.rutina.nombre_ejercicio.join(', ') 
          : a.rutina?.nombre_ejercicio || "";
        bValue = Array.isArray(b.rutina?.nombre_ejercicio) 
          ? b.rutina.nombre_ejercicio.join(', ') 
          : b.rutina?.nombre_ejercicio || "";
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [horarios, sortField, sortDirection]);

  const formatTime = (time) => {
    if (!time) return "-";
    return time.slice(0, 5); // Formato HH:MM
  };

  const formatDate = (date) => {
    if (!date) return "-";

    try {
      const [year, month, day] = date
        .split("-")
        .map((num) => parseInt(num, 10));

      const dateObj = new Date(year, month - 1, day);

      return dateObj.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return date;
    }
  };

  const getStatusBadge = (estado) => {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
        estado === "activo"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          estado === "activo" ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        {estado === "activo" ? "Activo" : "Desactivado"}
      </div>
    );
  };

  const getTipoColor = (tipo) => {
    switch(tipo?.toLowerCase()) {
      case 'powerplate': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'calistenia': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  // Función para obtener el badge del nivel
  const getNivelBadge = (nivel) => {
    const niveles = {
      principiante: { 
        label: "Principiante", 
        color: "text-green-400", 
        bgColor: "bg-green-500/20", 
        borderColor: "border-green-500/30",
        icon: "🟢"
      },
      intermedio: { 
        label: "Intermedio", 
        color: "text-orange-400", 
        bgColor: "bg-orange-500/20", 
        borderColor: "border-orange-500/30",
        icon: "🟡"
      },
      avanzado: { 
        label: "Avanzado", 
        color: "text-red-400", 
        bgColor: "bg-red-500/20", 
        borderColor: "border-red-500/30",
        icon: "🔴"
      }
    };

    const nivelInfo = niveles[nivel] || { 
      label: nivel || "N/A", 
      color: "text-gray-400", 
      bgColor: "bg-gray-500/20", 
      borderColor: "border-gray-500/30",
      icon: "⚪"
    };

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${nivelInfo.bgColor} ${nivelInfo.color} border ${nivelInfo.borderColor}`}>
        <RiTrophyLine className="w-3 h-3" />
        <span>{nivelInfo.label}</span>
      </div>
    );
  };

  const formatEntrenador = (entrenador, id_entrenador) => {
    if (entrenador) {
      return `${entrenador.nombre} ${entrenador.apellido_p}`;
    } else if (id_entrenador) {
      return "Entrenador asignado";
    }
    return "Sin asignar";
  };

  const getEntrenadorIcon = (entrenador, id_entrenador) => {
    if (entrenador?.nombre) {
      return entrenador.nombre.charAt(0).toUpperCase();
    } else if (id_entrenador) {
      return "E";
    }
    return "?";
  };

  const formatMusculo = (musculos) => {
    if (!Array.isArray(musculos)) return "-";
    if (musculos.length <= 2) return musculos.join(", ");
    return `${musculos.slice(0, 2).join(", ")} +${musculos.length - 2}`;
  };

  const formatEjercicios = (ejercicios) => {
    if (!Array.isArray(ejercicios)) return ejercicios || "";
    
    if (ejercicios.length <= 2) {
      return ejercicios.join(" + ");
    } else if (ejercicios.length <= 4) {
      return `${ejercicios.slice(0, 2).join(", ")} +${ejercicios.length - 2} más`;
    } else {
      return `${ejercicios[0]} y ${ejercicios.length - 1} ejercicios más`;
    }
  };

  const getMuscleColor = (muscle) => {
    const colors = {
      pecho: "bg-red-500/20 text-red-400 border-red-500/30",
      espalda: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      pierna: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      bicep: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      tricep: "bg-green-500/20 text-green-400 border-green-500/30",
      hombro: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      abdomen: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    };
    return colors[muscle] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <RiArrowUpLine className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' 
      ? <RiArrowUpLine className="w-4 h-4 text-yellow-400" />
      : <RiArrowDownLine className="w-4 h-4 text-yellow-400" />;
  };

  const headers = [
    { key: 'nombre_horario', label: 'Horario', sortable: true, icon: RiCalendarLine },
    { key: 'tipo', label: 'Tipo', sortable: true, icon: FaDumbbell },
    { key: 'nivel', label: 'Nivel', sortable: true, icon: RiTrophyLine },
    { key: 'fecha', label: 'Fecha', sortable: true, icon: RiCalendarLine },
    { key: 'hora_inicio', label: 'Tiempo', sortable: true, icon: RiTimeLine },
    { key: 'capacidad', label: 'Capacidad', sortable: true, icon: RiGroupLine },
    { key: 'entrenador_nombre', label: 'Entrenador', sortable: true, icon: RiUserLine },
    { key: 'rutina_nombre', label: 'Rutina', sortable: true, icon: FaDumbbell },
    { key: 'estado', label: 'Estado', sortable: true, icon: RiCheckboxCircleLine },
    { key: 'acciones', label: 'Acciones', sortable: false, icon: null }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-700 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-xl font-semibold text-white mb-2">Cargando horarios...</div>
        <div className="text-gray-400">Obteniendo datos del servidor</div>
      </div>
    );
  }

  if (!horarios.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-700">
          <RiCalendarLine className="w-12 h-12 text-gray-500" />
        </div>
        <div className="text-xl font-semibold text-white mb-2">No se encontraron horarios</div>
        <div className="text-gray-400 text-center">
          Intenta ajustar los filtros de búsqueda o crear un nuevo horario
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header con contadores */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Mostrando <span className="text-white font-semibold">{horarios.length}</span> horarios
            </span>
            {selectedHorarios.length > 0 && (
              <span className="text-sm text-yellow-400">
                {selectedHorarios.length} seleccionados
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-400">Activos: {horarios.filter(h => h.estado === "activo").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-sm text-gray-400">Desactivados: {horarios.filter(h => h.estado === "desactivado").length}</span>
              </div>
            </div>
            {/* Estadísticas por nivel */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <RiTrophyLine className="w-3 h-3 text-green-400" />
                <span className="text-gray-400">P: {horarios.filter(h => h.nivel === "principiante").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <RiTrophyLine className="w-3 h-3 text-orange-400" />
                <span className="text-gray-400">I: {horarios.filter(h => h.nivel === "intermedio").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <RiTrophyLine className="w-3 h-3 text-red-400" />
                <span className="text-gray-400">A: {horarios.filter(h => h.nivel === "avanzado").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {headers.map((header) => {
                  const HeaderIcon = header.icon;
                  return (
                    <th
                      key={header.key}
                      className={`px-4 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider ${
                        header.sortable ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''
                      }`}
                      onClick={() => header.sortable && handleSort(header.key)}
                    >
                      <div className="flex items-center gap-2">
                        {HeaderIcon && <HeaderIcon className="w-4 h-4 text-yellow-400" />}
                        <span>{header.label}</span>
                        {header.sortable && <SortIcon field={header.key} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/50">
              {sortedHorarios.map((horario, index) => {
                const isSelected = selectedHorarios.includes(horario.id_horario);
                
                return (
                  <React.Fragment key={horario.id_horario}>
                    <tr
                      className={`hover:bg-gray-800/30 transition-all duration-300 group ${
                        isSelected ? 'bg-yellow-400/5 border-l-4 border-l-yellow-400' : ''
                      } ${index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-800/20'} ${
                        expandedHorario === horario.id_horario ? 'bg-yellow-500/10' : ''
                      }`}
                    >
                      {/* Horario */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center border border-gray-600">
                            <RiCalendarLine className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">
                              {horario.nombre_horario}
                            </div>
                            <div className="text-xs text-gray-400">
                              {horario.dia_semana}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getTipoColor(horario.tipo)}`}>
                          <FaDumbbell className="w-3 h-3" />
                          <span className="capitalize">{horario.tipo}</span>
                        </div>
                      </td>

                      {/* Nivel */}
                      <td className="px-4 py-4">
                        {getNivelBadge(horario.nivel)}
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <RiCalendarLine className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300 text-sm">
                            {formatDate(horario.fecha)}
                          </span>
                        </div>
                      </td>

                      {/* Tiempo */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <RiTimeLine className="w-4 h-4 text-gray-500" />
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-white">
                              {formatTime(horario.hora_inicio)} - {formatTime(horario.hora_fin)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Capacidad */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <RiGroupLine className="w-4 h-4 text-gray-500" />
                          <span className="text-white font-semibold">
                            {horario.capacidad}
                          </span>
                        </div>
                      </td>

                      {/* Entrenador */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            horario.entrenador || horario.id_entrenador
                              ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-black"
                              : "bg-gradient-to-br from-gray-600 to-gray-700 text-gray-400"
                          }`}>
                            {getEntrenadorIcon(horario.entrenador, horario.id_entrenador)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {formatEntrenador(horario.entrenador, horario.id_entrenador)}
                            </div>
                            {horario.entrenador?.categoria && (
                              <div className="text-xs text-gray-400 capitalize">
                                {horario.entrenador.categoria}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rutina */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {horario.rutina ? (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <FaDumbbell className="w-4 h-4 text-green-400" />
                                  <span className="text-white text-sm font-medium">
                                    {formatEjercicios(horario.rutina?.nombre_ejercicio)}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedHorario(
                                      expandedHorario === horario.id_horario ? null : horario.id_horario
                                    );
                                  }}
                                  className="text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 px-2 py-1 rounded transition-colors"
                                  title="Ver detalles de rutina"
                                >
                                  {expandedHorario === horario.id_horario ? "Ocultar" : "Ver más"}
                                </button>
                              </div>
                              <div className="text-xs text-gray-400">
                                {Array.isArray(horario.rutina?.partes_musculo) && horario.rutina.partes_musculo.length > 0 && (
                                  <span className="capitalize">
                                    {formatMusculo(horario.rutina.partes_musculo)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : horario.id_rutina ? (
                            <div className="flex items-center gap-2">
                              <FaDumbbell className="w-4 h-4 text-yellow-400" />
                              <span className="text-yellow-200 text-sm">Rutina asignada</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FaDumbbell className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-400 text-sm">Sin rutina</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4">
                        {getStatusBadge(horario.estado)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEdit(horario)}
                            className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors group/btn"
                            title="Editar horario"
                          >
                            <RiEditLine className="w-4 h-4 text-yellow-400 group-hover/btn:text-yellow-300" />
                          </button>
                          
                          <button
                            onClick={() =>
                              onChangeStatus
                                ? onChangeStatus(horario)
                                : onToggleStatus(horario)
                            }
                            className={`p-2 rounded-lg transition-colors group/btn ${
                              horario.estado === "activo"
                                ? "hover:bg-red-500/10"
                                : "hover:bg-green-500/10"
                            }`}
                            title={horario.estado === "activo" ? "Desactivar" : "Activar"}
                          >
                            <RiToggleLine className={`w-4 h-4 ${
                              horario.estado === "activo"
                                ? "text-red-400 group-hover/btn:text-red-300"
                                : "text-green-400 group-hover/btn:text-green-300"
                            }`} />
                          </button>

                          {onDelete && (
                            <button
                              onClick={() => onDelete(horario)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group/btn"
                              title="Eliminar horario"
                            >
                              <RiDeleteBinLine className="w-4 h-4 text-red-400 group-hover/btn:text-red-300" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con detalles de rutina */}
                    {expandedHorario === horario.id_horario && horario.rutina && (
                      <tr className="bg-gray-800/50">
                        <td colSpan="10" className="px-4 py-4">
                          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <FaDumbbell className="w-4 h-4 mr-2 text-green-400" />
                              Detalles de la Rutina - {horario.nombre_horario}
                            </h4>
                            
                            {Array.isArray(horario.rutina.nombre_ejercicio) && horario.rutina.nombre_ejercicio.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {horario.rutina.nombre_ejercicio.map((ejercicio, idx) => (
                                  <div key={idx} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="text-gray-100 font-medium text-sm">
                                        {idx + 1}. {ejercicio}
                                      </h5>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                                      <span className="flex items-center">
                                        <RiGroupLine className="h-3 w-3 mr-1" />
                                        {Array.isArray(horario.rutina.repeticiones) 
                                          ? horario.rutina.repeticiones[idx] || 'N/A' 
                                          : horario.rutina.repeticiones || 'N/A'} reps
                                      </span>
                                      <span className="flex items-center">
                                        <RiTimeLine className="h-3 w-3 mr-1" />
                                        {Array.isArray(horario.rutina.series) 
                                          ? horario.rutina.series[idx] || 'N/A' 
                                          : horario.rutina.series || 'N/A'} series
                                      </span>
                                    </div>
                                    {Array.isArray(horario.rutina.partes_musculo) && horario.rutina.partes_musculo[idx] && (
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                        getMuscleColor(horario.rutina.partes_musculo[idx])
                                      }`}>
                                        <GiMuscleUp className="w-3 h-3 mr-1" />
                                        {horario.rutina.partes_musculo[idx]}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-gray-400">No hay detalles disponibles para esta rutina</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total: {horarios.length} horarios</span>
          <span>Actualizaciones en tiempo real</span>
        </div>
      </div>
    </div>
  );
};

export default HorarioTable;