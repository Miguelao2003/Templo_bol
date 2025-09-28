import React, { useState } from "react";
import { 
  RiEditLine, 
  RiToolsLine, 
  RiSettings4Line, 
  RiCheckboxCircleLine, 
  RiCalendarLine, 
  RiFileTextLine,
  RiLoaderLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiPlayCircleLine,
  RiErrorWarningLine,
  RiInformationLine
} from "react-icons/ri";

const EquipoTable = ({ equipos, loading, onEdit, onChangeEstado }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-700 rounded-full animate-spin"></div>
          <div className="w-16 h-16 border-4 border-t-yellow-400 border-r-yellow-400 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-xl font-semibold text-white mb-2">Cargando equipos...</div>
        <div className="text-gray-400">Obteniendo datos del servidor</div>
      </div>
    );
  }

  if (!equipos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-700">
          <RiSettings4Line className="w-12 h-12 text-gray-500" />
        </div>
        <div className="text-xl font-semibold text-white mb-2">No se encontraron equipos</div>
        <div className="text-gray-400 text-center max-w-md">
          No se encontraron equipos que coincidan con los criterios de búsqueda. 
          Prueba ajustando los filtros o crear un nuevo equipo.
        </div>
      </div>
    );
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEquipos = [...equipos].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <RiArrowUpLine className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' 
      ? <RiArrowUpLine className="w-4 h-4 text-yellow-400" />
      : <RiArrowDownLine className="w-4 h-4 text-yellow-400" />;
  };

  const headers = [
    { key: 'nombre_equipo', label: 'Equipo', icon: RiSettings4Line, sortable: true },
    { key: 'estado', label: 'Estado', icon: RiCheckboxCircleLine, sortable: true },
    { key: 'ultimo_mantenimiento', label: 'Últ. Mantenimiento', icon: RiCalendarLine, sortable: true },
    { key: 'proximo_mantenimiento', label: 'Próx. Mantenimiento', icon: RiCalendarLine, sortable: true },
    { key: 'especificaciones_tecnicas', label: 'Especificaciones', icon: RiFileTextLine, sortable: false },
    { key: 'acciones', label: 'Acciones', icon: null, sortable: false }
  ];

  const getEstadoColor = (estado) => {
    switch(estado?.toLowerCase()) {
      case 'activo': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'mantenimiento': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'desactivado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEstadoIcon = (estado) => {
    switch(estado?.toLowerCase()) {
      case 'activo': return RiCheckboxCircleLine;
      case 'mantenimiento': return RiToolsLine;
      case 'desactivado': return RiErrorWarningLine;
      default: return RiInformationLine;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isMaintenanceDue = (fechaProximo) => {
    if (!fechaProximo) return false;
    const today = new Date();
    const fechaMantenimiento = new Date(fechaProximo);
    const diffTime = fechaMantenimiento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

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
              Mostrando <span className="text-white font-semibold">{equipos.length}</span> equipos
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Click en columnas para ordenar</span>
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
                      header.sortable ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''
                    }`}
                    onClick={() => header.sortable && handleSort(header.key)}
                  >
                    <div className="flex items-center gap-2">
                      {header.icon && <header.icon className="w-4 h-4 text-yellow-400" />}
                      <span>{header.label}</span>
                      {header.sortable && <SortIcon field={header.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700/50">
              {sortedEquipos.map((equipo, index) => {
                const EstadoIcon = getEstadoIcon(equipo.estado);
                const isUrgent = isMaintenanceDue(equipo.proximo_mantenimiento);
                
                return (
                  <tr
                    key={equipo.id_equipo}
                    className={`hover:bg-gray-800/30 transition-all duration-200 relative group ${
                      index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-800/20'
                    }`}
                  >
                    {/* Nombre del equipo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                          <RiSettings4Line className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-gray-100 font-semibold leading-tight">
                            {equipo.nombre_equipo}
                          </p>
                          <p className="text-gray-500 text-xs">
                            ID: {equipo.id_equipo}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getEstadoColor(equipo.estado)}`}>
                        <EstadoIcon className="w-3 h-3" />
                        <span className="capitalize">{equipo.estado}</span>
                      </div>
                    </td>

                    {/* Último mantenimiento */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <RiCalendarLine className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {formatDate(equipo.ultimo_mantenimiento)}
                        </span>
                      </div>
                    </td>

                    {/* Próximo mantenimiento */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <RiCalendarLine className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-gray-400'}`} />
                        <div className="flex flex-col">
                          <span className={`text-sm ${isUrgent ? 'text-red-300 font-medium' : 'text-gray-300'}`}>
                            {formatDate(equipo.proximo_mantenimiento)}
                          </span>
                          {isUrgent && (
                            <span className="text-xs text-red-400">¡Próximo!</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Especificaciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <RiFileTextLine className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm max-w-xs truncate" title={equipo.especificaciones_tecnicas}>
                          {equipo.especificaciones_tecnicas || 'Sin especificar'}
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => onEdit(equipo)}
                          className="p-2 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-gray-900 rounded-lg transition-all duration-200 border border-yellow-500/30 hover:border-yellow-500 hover:scale-110"
                          title="Editar equipo"
                        >
                          <RiEditLine className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => onChangeEstado(equipo)}
                          className={`p-2 rounded-lg transition-all duration-200 border hover:scale-110 ${
                            equipo.estado === "activo"
                              ? "bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border-orange-500/30 hover:border-orange-500"
                              : "bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white border-green-500/30 hover:border-green-500"
                          }`}
                          title={equipo.estado === "activo" ? "Enviar a mantenimiento" : "Activar equipo"}
                        >
                          {equipo.estado === "activo" ? (
                            <RiToolsLine className="w-4 h-4" />
                          ) : (
                            <RiPlayCircleLine className="w-4 h-4" />
                          )}
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
          <span>Total: {equipos.length} equipos</span>
        </div>
      </div>
    </div>
  );
};

export default EquipoTable;