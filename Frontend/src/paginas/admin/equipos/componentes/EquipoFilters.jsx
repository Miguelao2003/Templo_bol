import React from "react";
import { 
  RiCheckboxCircleLine, 
  RiArrowDownSLine, 
  RiFilterLine,
  RiCloseLine,
  RiCheckLine,
  RiCalendarLine,
  RiSettings4Line,
  RiToolsLine
} from "react-icons/ri";

const EquipoFilters = ({ filters, setFilters }) => {
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value || null,
    });
  };

  const clearFilters = () => {
    setFilters({ 
      estado: null,
      fechaUltimoDesde: null,
      fechaUltimoHasta: null,
      fechaProximoDesde: null,
      fechaProximoHasta: null
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== null);

  return (
    <div className="space-y-4">
      {/* Header del filtro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <RiFilterLine className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">Filtros de equipos</span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Filtro por Estado */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="text-yellow-400">
              <RiCheckboxCircleLine className="w-4 h-4" />
            </div>
            <label className="text-sm font-medium text-gray-300">
              Estado del Equipo
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Seleccionar</label>
            <SelectFilter
              value={filters.estado}
              onChange={(value) => handleFilterChange("estado", value)}
              options={[
                { value: "activo", label: "Activo" },
                { value: "mantenimiento", label: "Mantenimiento" },
              ]}
              placeholder="Seleccionar estado"
            />
          </div>
        </div>

        {/* Rango de Último Mantenimiento */}
        <DateRangeFilter
          fromValue={filters.fechaUltimoDesde}
          toValue={filters.fechaUltimoHasta}
          onFromChange={(value) => handleFilterChange("fechaUltimoDesde", value)}
          onToChange={(value) => handleFilterChange("fechaUltimoHasta", value)}
          label="Último Mantenimiento"
          icon={<RiCalendarLine className="w-4 h-4" />}
        />

        {/* Rango de Próximo Mantenimiento */}
        <DateRangeFilter
          fromValue={filters.fechaProximoDesde}
          toValue={filters.fechaProximoHasta}
          onFromChange={(value) => handleFilterChange("fechaProximoDesde", value)}
          onToChange={(value) => handleFilterChange("fechaProximoHasta", value)}
          label="Próximo Mantenimiento"
          icon={<RiToolsLine className="w-4 h-4" />}
        />
      </div>

      
    </div>
  );
};

const SelectFilter = ({ value, onChange, options, placeholder }) => (
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
);

const DateRangeFilter = ({ fromValue, toValue, onFromChange, onToChange, label, icon }) => (
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

    {/* Inputs de rango de fechas */}
    <div className="space-y-2">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Desde</label>
        <input
          type="date"
          value={fromValue || ""}
          onChange={(e) => onFromChange(e.target.value || null)}
          onClick={(e) => e.target.showPicker && e.target.showPicker()}
          className="
            w-full
            bg-gray-800
            border
            border-gray-600
            text-gray-100
            py-2.5
            px-4
            pr-10
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-yellow-500/50
            focus:border-yellow-500
            transition-all
            duration-200
            text-sm
            hover:border-gray-500
            cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-100
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:w-4
            [&::-webkit-calendar-picker-indicator]:h-4
            [&::-webkit-calendar-picker-indicator]:filter-invert
          "
          style={{
            colorScheme: 'dark'
          }}
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-400 mb-1">Hasta</label>
        <input
          type="date"
          value={toValue || ""}
          onChange={(e) => onToChange(e.target.value || null)}
          onClick={(e) => e.target.showPicker && e.target.showPicker()}
          className="
            w-full
            bg-gray-800
            border
            border-gray-600
            text-gray-100
            py-2.5
            px-4
            pr-10
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-yellow-500/50
            focus:border-yellow-500
            transition-all
            duration-200
            text-sm
            hover:border-gray-500
            cursor-pointer
            [&::-webkit-calendar-picker-indicator]:opacity-100
            [&::-webkit-calendar-picker-indicator]:cursor-pointer
            [&::-webkit-calendar-picker-indicator]:w-4
            [&::-webkit-calendar-picker-indicator]:h-4
            [&::-webkit-calendar-picker-indicator]:filter-invert
          "
          style={{
            colorScheme: 'dark'
          }}
        />
      </div>
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

// Función auxiliar para formatear rango de fechas
const formatDateRange = (desde, hasta) => {
  if (desde && hasta) {
    return `${formatDate(desde)} - ${formatDate(hasta)}`;
  } else if (desde) {
    return `Desde ${formatDate(desde)}`;
  } else if (hasta) {
    return `Hasta ${formatDate(hasta)}`;
  }
  return '';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export default EquipoFilters;