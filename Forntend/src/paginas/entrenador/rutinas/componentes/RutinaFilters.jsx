import React from "react";
import { 
  RiBodyScanLine, 
  RiArrowDownSLine, 
  RiFilterLine,
  RiCloseLine,
  RiCheckLine
} from "react-icons/ri";

const RutinaFilters = ({ filters, setFilters, musculos }) => {
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value || null,
    });
  };

  const clearFilters = () => {
    setFilters({ musculo: null });
  };

  const hasActiveFilters = filters.musculo !== null;

  return (
    <div className="space-y-4">
      {/* Header del filtro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <RiFilterLine className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">Filtros de rutinas</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            <RiCloseLine className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro por Músculo */}
        <SelectFilter
          value={filters.musculo}
          onChange={(value) => handleFilterChange("musculo", value)}
          options={(musculos || []).map((musculo) => ({
            value: musculo,
            label: musculo.charAt(0).toUpperCase() + musculo.slice(1).replace("_", "/"),
          }))}
          placeholder="Seleccionar grupo muscular"
          icon={<RiBodyScanLine className="w-4 h-4" />}
          label="Grupo Muscular"
        />
        

      </div>


    </div>
  );
};

const SelectFilter = ({ value, onChange, options, placeholder, icon, label }) => (
  <div className="space-y-2">
    {/* Label del filtro */}
    <div className="flex items-center space-x-2">
      <div className="text-yellow-400">
        {icon}
      </div>
      <label className="text-sm font-medium text-gray-300">
        {label}
      </label>
    </div>

    {/* Select personalizado */}
    <div className="relative group">
      <select
        className="
          w-full
          appearance-none
          bg-gray-800
          border
          border-gray-600
          text-gray-100
          py-3
          px-4
          pr-10
          rounded-lg
          focus:outline-none
          focus:ring-2
          focus:ring-yellow-500/50
          focus:border-yellow-500
          transition-all
          duration-200
          ease-in-out
          hover:border-gray-500
          placeholder-gray-400
        "
        value={value !== null ? value : ""}
        onChange={(e) => onChange(e.target.value !== "" ? e.target.value : null)}
      >
        <option 
          className="bg-gray-800 text-gray-300" 
          value=""
        >
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
      
      {/* Icono de dropdown */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <RiArrowDownSLine className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
      </div>

      {/* Indicador de valor seleccionado */}
      {value && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-yellow-500 text-gray-900 rounded-full w-4 h-4 flex items-center justify-center">
            <RiCheckLine className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>


  </div>
);

const FilterChip = ({ label, onRemove }) => (
  <div className="inline-flex items-center space-x-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-3 py-1 text-xs font-medium">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="hover:text-yellow-300 transition-colors ml-1"
      title="Remover filtro"
    >
      <RiCloseLine className="w-3 h-3" />
    </button>
  </div>
);

export default RutinaFilters;