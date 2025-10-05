import React from "react";
import {
  RiCheckboxCircleLine,
  RiCalendarLine,
  RiArrowDownSLine,
  RiFilterLine,
  RiCloseLine,
  RiTrophyLine
} from "react-icons/ri";

import { FaDumbbell } from "react-icons/fa6";


const HorarioFilters = ({ filters, setFilters }) => {
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value || null,
    });
  };

  const clearAllFilters = () => {
    setFilters({
      tipo: null,
      estado: null,
      dia_semana: null,
      fecha: null,
      nivel: null, // NUEVO: Incluir nivel en reset
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== null && filter !== '');

  return (
    <div className="space-y-4">
      {/* Header de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiFilterLine className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
          >
            <RiCloseLine className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid de filtros actualizado a 5 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Filtro por Tipo */}
        <SelectFilter
          icon={FaDumbbell}
          value={filters.tipo}
          onChange={(value) => handleFilterChange("tipo", value)}
          options={[
            { value: "powerplate", label: "Powerplate" },
            { value: "calistenia", label: "Calistenia" },
          ]}
          placeholder="Seleccionar tipo"
          label="Tipo de entrenamiento"
        />

        {/* NUEVO FILTRO: Nivel de dificultad */}
        <SelectFilter
          icon={RiTrophyLine}
          value={filters.nivel}
          onChange={(value) => handleFilterChange("nivel", value)}
          options={[
            { value: "principiante", label: "🟢 Principiante" },
            { value: "intermedio", label: "🟡 Intermedio" },
            { value: "avanzado", label: "🔴 Avanzado" },
          ]}
          placeholder="Seleccionar nivel"
          label="Nivel de dificultad"
        />

        {/* Filtro por Estado */}
        <SelectFilter
          icon={RiCheckboxCircleLine}
          value={filters.estado}
          onChange={(value) => handleFilterChange("estado", value)}
          options={[
            { value: "activo", label: "🟢 Activo" },
            { value: "desactivado", label: "🔴 Desactivado" },
          ]}
          placeholder="Seleccionar estado"
          label="Estado del horario"
        />

        {/* Filtro por Día de Semana */}
        <SelectFilter
          icon={RiCalendarLine}
          value={filters.dia_semana}
          onChange={(value) => handleFilterChange("dia_semana", value)}
          options={[
            "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
          ].map((dia) => ({ value: dia, label: dia }))}
          placeholder="Seleccionar día"
          label="Día de la semana"
        />

        {/* Filtro por Fecha */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <RiCalendarLine className="inline w-4 h-4 mr-2" />
            Fecha específica
          </label>
          <div className="relative">
            <input
              type="date"
              className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
              value={filters.fecha || ""}
              onChange={(e) => handleFilterChange("fecha", e.target.value)}
            />
            {filters.fecha && (
              <button
                onClick={() => handleFilterChange("fecha", null)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                title="Limpiar fecha"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Información de filtros activos mejorada */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Filtros activos:</span>
            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
              {Object.values(filters).filter(filter => filter !== null && filter !== '').length}
            </span>
          </div>
          
          {/* Mostrar filtros activos específicos */}
          <div className="flex flex-wrap gap-2">
            {filters.tipo && (
              <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs border border-blue-500/30">
                <FaDumbbell className="w-3 h-3" />
                {filters.tipo}
                <button
                  onClick={() => handleFilterChange("tipo", null)}
                  className="hover:text-red-400 transition-colors ml-1"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.nivel && (
              <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs border border-purple-500/30">
                <RiTrophyLine className="w-3 h-3" />
                {filters.nivel}
                <button
                  onClick={() => handleFilterChange("nivel", null)}
                  className="hover:text-red-400 transition-colors ml-1"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.estado && (
              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs border border-green-500/30">
                <RiCheckboxCircleLine className="w-3 h-3" />
                {filters.estado}
                <button
                  onClick={() => handleFilterChange("estado", null)}
                  className="hover:text-red-400 transition-colors ml-1"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.dia_semana && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full text-xs border border-indigo-500/30">
                <RiCalendarLine className="w-3 h-3" />
                {filters.dia_semana}
                <button
                  onClick={() => handleFilterChange("dia_semana", null)}
                  className="hover:text-red-400 transition-colors ml-1"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.fecha && (
              <span className="inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs border border-orange-500/30">
                <RiCalendarLine className="w-3 h-3" />
                {filters.fecha.split("-").reverse().join("/")}
                <button
                  onClick={() => handleFilterChange("fecha", null)}
                  className="hover:text-red-400 transition-colors ml-1"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectFilter = ({ icon: Icon, value, onChange, options, placeholder, label }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">
      <Icon className="inline w-4 h-4 mr-2" />
      {label}
    </label>
    <div className="relative">
      <select
        className="w-full appearance-none bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 pr-10 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all cursor-pointer"
        value={value !== null ? value : ""}
        onChange={(e) => onChange(e.target.value !== "" ? e.target.value : null)}
      >
        <option className="bg-gray-800" value="">
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option
            key={`${option.value}-${index}`}
            value={option.value ?? ""}
            className="bg-gray-800 text-gray-100"
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Flecha personalizada */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <RiArrowDownSLine className="w-5 h-5 text-yellow-400" />
      </div>
      
      {/* Botón limpiar individual */}
      {value && (
        <button
          onClick={() => onChange(null)}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors z-10"
          title="Limpiar filtro"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

export default HorarioFilters;