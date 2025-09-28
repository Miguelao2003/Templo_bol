import React, { useState } from "react";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiRunLine,
  RiBodyScanLine,
  RiRepeatLine,
  RiFunctionLine,
  RiUserLine,
  RiLoaderLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiListCheck2,
  RiEyeLine,
  RiCloseLine,
} from "react-icons/ri";

const RutinaTable = ({ rutinas, loading, onEdit, onDelete }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedRutina, setExpandedRutina] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-700 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-xl font-semibold text-white mb-2">
          Cargando rutinas...
        </div>
        <div className="text-gray-400">Obteniendo datos del servidor</div>
      </div>
    );
  }

  if (!rutinas.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-700">
          <RiRunLine className="w-12 h-12 text-gray-500" />
        </div>
        <div className="text-xl font-semibold text-white mb-2">
          No se encontraron rutinas
        </div>
        <div className="text-gray-400 text-center max-w-md">
          No se encontraron rutinas que coincidan con los criterios de búsqueda.
          Prueba ajustando los filtros o crear una nueva rutina.
        </div>
      </div>
    );
  }

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Funciones auxiliares para estadísticas de rutinas
  const getTotalEjercicios = (rutina) => {
    return rutina.nombres_ejercicios ? rutina.nombres_ejercicios.length : 0;
  };

  const getTotalSeries = (rutina) => {
    return rutina.series && Array.isArray(rutina.series) 
      ? rutina.series.reduce((total, series) => total + series, 0) 
      : 0;
  };

  const getTotalRepeticiones = (rutina) => {
    return rutina.repeticiones && Array.isArray(rutina.repeticiones)
      ? rutina.repeticiones.reduce((total, reps) => total + reps, 0)
      : 0;
  };

  const getMusculosUnicos = (rutina) => {
    if (!rutina.partes_musculo || !Array.isArray(rutina.partes_musculo)) return [];
    return [...new Set(rutina.partes_musculo)];
  };

  const sortedRutinas = [...rutinas].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    switch (sortField) {
      case 'ejercicios':
        aValue = getTotalEjercicios(a);
        bValue = getTotalEjercicios(b);
        break;
      case 'series_total':
        aValue = getTotalSeries(a);
        bValue = getTotalSeries(b);
        break;
      case 'repeticiones_total':
        aValue = getTotalRepeticiones(a);
        bValue = getTotalRepeticiones(b);
        break;
      default:
        aValue = a[sortField];
        bValue = b[sortField];
    }

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue?.toLowerCase() || '';
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
    {
      key: "id_rutina",
      label: "ID",
      icon: RiListCheck2,
      sortable: true,
    },
    {
      key: "ejercicios",
      label: "Ejercicios",
      icon: RiRunLine,
      sortable: true,
    },
    {
      key: "partes_musculo",
      label: "Músculos",
      icon: RiBodyScanLine,
      sortable: false,
    },
    { 
      key: "series_total", 
      label: "Total Series", 
      icon: RiRepeatLine, 
      sortable: true 
    },
    {
      key: "repeticiones_total",
      label: "Total Reps",
      icon: RiFunctionLine,
      sortable: true,
    },
    {
      key: "entrenador",
      label: "Entrenador",
      icon: RiUserLine,
      sortable: false,
    },
    { key: "acciones", label: "Acciones", icon: null, sortable: false },
  ];

  return (
    <div className="overflow-hidden">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(55, 65, 81, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(251, 191, 36, 0.5);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(251, 191, 36, 0.7);
          }
        `}
      </style>

      {/* Header con contadores */}
      <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Mostrando{" "}
              <span className="text-white font-semibold">{rutinas.length}</span>{" "}
              rutinas
            </span>
            <span className="text-sm text-gray-500">
              Total: {rutinas.reduce((total, rutina) => total + getTotalEjercicios(rutina), 0)} ejercicios
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Click en una rutina para ver detalles
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider ${
                      header.sortable
                        ? "cursor-pointer hover:text-yellow-400 transition-colors"
                        : ""
                    }`}
                    onClick={() => header.sortable && handleSort(header.key)}
                  >
                    <div className="flex items-center gap-2">
                      {header.icon && (
                        <header.icon className="w-4 h-4 text-yellow-400" />
                      )}
                      <span>{header.label}</span>
                      {header.sortable && <SortIcon field={header.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700/50">
              {sortedRutinas.map((rutina, index) => (
                <React.Fragment key={rutina.id_rutina}>
                  <tr
                    className={`hover:bg-gray-800/30 transition-all duration-200 relative group cursor-pointer ${
                      index % 2 === 0 ? "bg-gray-900/20" : "bg-gray-800/20"
                    } ${expandedRutina === rutina.id_rutina ? "bg-yellow-500/10" : ""}`}
                    onClick={() => setExpandedRutina(
                      expandedRutina === rutina.id_rutina ? null : rutina.id_rutina
                    )}
                  >
                    {/* ID de Rutina */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <RiListCheck2 className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-gray-100 font-semibold">
                            #{rutina.id_rutina}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {getTotalEjercicios(rutina)} ejercicios
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Lista de ejercicios (primeros 3) */}
                    <td className="px-6 py-4">
                      <div>
                        {rutina.nombres_ejercicios && rutina.nombres_ejercicios.length > 0 ? (
                          <>
                            <div className="space-y-1">
                              {rutina.nombres_ejercicios.slice(0, 2).map((ejercicio, idx) => (
                                <p key={idx} className="text-gray-100 text-sm capitalize">
                                  {idx + 1}. {ejercicio}
                                </p>
                              ))}
                              {rutina.nombres_ejercicios.length > 2 && (
                                <p className="text-gray-400 text-xs">
                                  +{rutina.nombres_ejercicios.length - 2} más...
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500 italic">Sin ejercicios</span>
                        )}
                      </div>
                    </td>

                    {/* Músculos únicos trabajados */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getMusculosUnicos(rutina).length > 0 ? (
                          getMusculosUnicos(rutina).map((musculo, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMuscleColor(musculo)}`}
                            >
                              {musculo}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">Sin especificar</span>
                        )}
                      </div>
                    </td>

                    {/* Total de series */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-500/20 p-1 rounded">
                          <RiRepeatLine className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-gray-100 font-medium">
                          {getTotalSeries(rutina)}
                        </span>
                        <span className="text-gray-500 text-xs">total</span>
                      </div>
                    </td>

                    {/* Total de repeticiones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-blue-500/20 p-1 rounded">
                          <RiFunctionLine className="w-3 h-3 text-blue-400" />
                        </div>
                        <span className="text-gray-100 font-medium">
                          {getTotalRepeticiones(rutina)}
                        </span>
                        <span className="text-gray-500 text-xs">total</span>
                      </div>
                    </td>

                    {/* Entrenador */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {rutina.entrenador ? (
                          <>
                            <div className="bg-purple-500/20 p-1 rounded">
                              <RiUserLine className="w-3 h-3 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-gray-100 font-medium text-sm">
                                {rutina.entrenador.nombre}{" "}
                                {rutina.entrenador.apellido_p}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {rutina.entrenador.rol}
                              </p>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500 italic">Sin asignar</span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setExpandedRutina(
                              expandedRutina === rutina.id_rutina ? null : rutina.id_rutina
                            );
                          }}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all duration-200 border border-blue-500/30 hover:border-blue-500 hover:scale-110"
                          title="Ver detalles"
                        >
                          {expandedRutina === rutina.id_rutina ? (
                            <RiCloseLine className="w-4 h-4" />
                          ) : (
                            <RiEyeLine className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit(rutina);
                          }}
                          className="p-2 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-gray-900 rounded-lg transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500 hover:scale-110"
                          title="Editar rutina"
                        >
                          <RiEditLine className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(rutina);
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all duration-200 border border-red-500/30 hover:border-red-500 hover:scale-110"
                          title="Eliminar rutina"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Fila expandida con detalles */}
                  {expandedRutina === rutina.id_rutina && (
                    <tr className="bg-gray-800/50">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                          <h4 className="text-white font-semibold mb-3 flex items-center">
                            <RiListCheck2 className="w-4 h-4 mr-2 text-yellow-400" />
                            Detalles de la Rutina #{rutina.id_rutina}
                          </h4>
                          
                          {rutina.nombres_ejercicios && rutina.nombres_ejercicios.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {rutina.nombres_ejercicios.map((ejercicio, idx) => (
                                <div key={idx} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="text-gray-100 font-medium text-sm">
                                      {idx + 1}. {ejercicio}
                                    </h5>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                                    <span className="flex items-center">
                                      <RiFunctionLine className="h-3 w-3 mr-1" />
                                      {rutina.repeticiones ? rutina.repeticiones[idx] : 'N/A'} reps
                                    </span>
                                    <span className="flex items-center">
                                      <RiRepeatLine className="h-3 w-3 mr-1" />
                                      {rutina.series ? rutina.series[idx] : 'N/A'} series
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                    getMuscleColor(rutina.partes_musculo ? rutina.partes_musculo[idx] : '')
                                  } border-opacity-30`}>
                                    {rutina.partes_musculo ? rutina.partes_musculo[idx] : 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-400">No hay ejercicios en esta rutina</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Total: {rutinas.length} rutinas</span>
          <span>
            {rutinas.reduce((total, rutina) => total + getTotalEjercicios(rutina), 0)} ejercicios en total
          </span>
        </div>
      </div>
    </div>
  );
};

export default RutinaTable;