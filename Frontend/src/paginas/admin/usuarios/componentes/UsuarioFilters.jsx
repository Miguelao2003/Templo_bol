import React, { useState } from "react";
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiFilterLine,
  RiRefreshLine,
  RiUserLine,
  RiShieldCheckLine,
  RiFocus3Line,
  RiVipCrownLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiAwardLine,
} from "react-icons/ri";

const UsuarioFilters = ({ filters, setFilters, roles, categories, niveles }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (name, value) => {
    console.log(`🔧 === handleFilterChange ===`);
    console.log(`🔧 Cambiando filtro ${name} de:`, filters[name], "a:", value);
    console.log(`🔧 Tipo del nuevo valor:`, typeof value);

    const newFilters = {
      ...filters,
      [name]: value === undefined || value === "" ? null : value,
    };

    console.log(`🔧 Nuevos filtros:`, newFilters);
    console.log(`🔧 newFilters[${name}]:`, newFilters[name]);
    setFilters(newFilters);
  };

  // Función clearAllFilters actualizada con nivel
  const clearAllFilters = () => {
    setFilters({
      role: null,
      category: null,
      active: null,
      genero: null,
      objetivo: null,
      nivel: null, // AGREGADO
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (filter) => filter !== null
  );
  const activeFilterCount = Object.values(filters).filter(
    (filter) => filter !== null
  ).length;

  const getRoleIcon = (value) => {
    switch (value) {
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

  const getFilterColor = (filterName, value) => {
    if (filterName === "role") {
      switch (value) {
        case "administrador":
          return "from-yellow-400 to-yellow-500";
        case "entrenador":
          return "from-blue-400 to-blue-500";
        case "cliente":
          return "from-gray-500 to-gray-600";
        default:
          return "from-gray-600 to-gray-700";
      }
    }
    // NUEVO: Colores para filtro de nivel
    if (filterName === "nivel") {
      switch (value) {
        case "principiante":
          return "from-green-400 to-green-500";
        case "intermedio":
          return "from-yellow-400 to-yellow-500";
        case "avanzado":
          return "from-red-400 to-red-500";
        default:
          return "from-gray-600 to-gray-700";
      }
    }
    return "from-yellow-400 to-yellow-500";
  };

  return (
    <div className="space-y-4">
      {/* Header de filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <RiFilterLine className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-semibold text-white">Filtros</span>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs font-medium">
                {activeFilterCount} activo{activeFilterCount !== 1 ? "s" : ""}
              </span>

              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-300"
              >
                <RiRefreshLine className="w-3 h-3" />
                Limpiar
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-lg transition-all duration-300"
        >
          <RiFilterLine className="w-4 h-4" />
          <span className="text-sm">Filtros</span>
          <RiArrowDownSLine
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Filtros activos como tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (value === null) return null;

            let displayValue = value;
            let IconComponent = null;

            if (key === "role") {
              displayValue =
                Object.keys(roles)
                  .find((k) => roles[k] === value)
                  ?.charAt(0)
                  .toUpperCase() +
                Object.keys(roles)
                  .find((k) => roles[k] === value)
                  ?.slice(1)
                  .toLowerCase();
              IconComponent = getRoleIcon(value);
            } else if (key === "active") {
              displayValue = value ? "Activos" : "Inactivos";
              IconComponent = value ? RiCheckboxCircleLine : RiCloseCircleLine;
            } else if (key === "objetivo") {
              displayValue =
                value === "perdida de peso"
                  ? "Pérdida de peso"
                  : "Aumento de peso";
              IconComponent = RiFocus3Line;
            } else if (key === "category") {
              displayValue =
                Object.keys(categories)
                  .find((k) => categories[k] === value)
                  ?.charAt(0)
                  .toUpperCase() +
                Object.keys(categories)
                  .find((k) => categories[k] === value)
                  ?.slice(1)
                  .toLowerCase();
              IconComponent = RiVipCrownLine;
            } else if (key === "nivel") { // NUEVO CASO PARA NIVEL
              displayValue =
                Object.keys(niveles)
                  .find((k) => niveles[k] === value)
                  ?.charAt(0)
                  .toUpperCase() +
                Object.keys(niveles)
                  .find((k) => niveles[k] === value)
                  ?.slice(1)
                  .toLowerCase();
              IconComponent = RiAwardLine;
            }

            return (
              <div
                key={key}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getFilterColor(
                  key,
                  value
                )} text-black text-sm font-medium shadow-lg`}
              >
                {IconComponent && <IconComponent className="w-3 h-3" />}
                <span>{displayValue}</span>
                <button
                  onClick={() => handleFilterChange(key, null)}
                  className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
                >
                  <RiCloseLine className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid de filtros - ACTUALIZADO A 6 COLUMNAS */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 transition-all duration-300 ${
          isExpanded ||
          (typeof window !== "undefined" && window.innerWidth >= 768)
            ? "block"
            : "hidden md:grid"
        }`}
      >
        {/* Filtro por Rol */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Rol</label>
          <SelectFilter
            value={filters.role}
            onChange={(value) => handleFilterChange("role", value)}
            options={Object.entries(roles).map(([key, value]) => ({
              value,
              label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
              icon: getRoleIcon(value),
            }))}
            placeholder="Seleccionar rol"
            hasIcon={true}
          />
        </div>

        {/* Filtro por Categoría */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Categoría
          </label>
          <SelectFilter
            value={filters.category}
            onChange={(value) => handleFilterChange("category", value)}
            options={Object.entries(categories).map(([key, value]) => ({
              value,
              label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
              icon: RiVipCrownLine,
            }))}
            placeholder="Seleccionar categoría"
            hasIcon={true}
          />
        </div>

        {/* NUEVO FILTRO POR NIVEL */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Nivel
          </label>
          <SelectFilter
            value={filters.nivel}
            onChange={(value) => handleFilterChange("nivel", value)}
            options={Object.entries(niveles).map(([key, value]) => ({
              value,
              label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
              icon: RiAwardLine,
            }))}
            placeholder="Seleccionar nivel"
            hasIcon={true}
          />
        </div>

        {/* Filtro por Género */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Género
          </label>
          <SelectFilter
            value={filters.genero}
            onChange={(value) => handleFilterChange("genero", value)}
            options={[
              { value: "Masculino", label: "Masculino", icon: RiUserLine },
              { value: "Femenino", label: "Femenino", icon: RiUserLine },
            ]}
            placeholder="Seleccionar género"
            hasIcon={true}
          />
        </div>

        {/* Filtro por Objetivo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Objetivo
          </label>
          <SelectFilter
            value={filters.objetivo}
            onChange={(value) => handleFilterChange("objetivo", value)}
            options={[
              {
                value: "perdida de peso",
                label: "Pérdida de peso",
                icon: RiFocus3Line,
              },
              {
                value: "aumento de peso",
                label: "Aumento de peso",
                icon: RiFocus3Line,
              },
            ]}
            placeholder="Seleccionar objetivo"
            hasIcon={true}
          />
        </div>

        {/* Filtro por Estado */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Estado
          </label>
          <SelectFilter
            value={filters.active}
            onChange={(value) => handleFilterChange("active", value)}
            options={[
              { value: true, label: "Activos", icon: RiCheckboxCircleLine },
              { value: false, label: "Inactivos", icon: RiCloseCircleLine },
            ]}
            placeholder="Seleccionar estado"
            hasIcon={true}
          />
        </div>
      </div>
    </div>
  );
};

// COMPONENTE SELECTFILTER CORREGIDO - SIN BOTONES ANIDADOS
const SelectFilter = ({
  value,
  onChange,
  options,
  placeholder,
  hasIcon = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  const handleClearClick = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleToggleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* BOTÓN PRINCIPAL - SIN BOTONES ANIDADOS */}
      <div
        onClick={handleToggleClick}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-600/50 hover:border-yellow-400/50 rounded-xl cursor-pointer transition-all duration-300 backdrop-blur-sm ${
          value !== null ? "border-yellow-400/50 bg-yellow-400/5" : ""
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedOption && hasIcon && selectedOption.icon && (
            <selectedOption.icon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
          <span
            className={`text-sm truncate ${
              selectedOption ? "text-white font-medium" : "text-gray-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* BOTÓN X COMO DIV CLICKEABLE - NO COMO BUTTON */}
          {value !== null && (
            <div
              onClick={handleClearClick}
              className="p-1 hover:bg-gray-700/50 rounded-full transition-colors cursor-pointer"
            >
              <RiCloseLine className="w-3 h-3 text-gray-400 hover:text-white" />
            </div>
          )}
          <RiArrowDownSLine
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
              {options.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={`${option.value}-${index}`}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/50 transition-colors ${
                      option.value === value
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {hasIcon && IconComponent && (
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-sm">{option.label}</span>
                    {option.value === value && (
                      <RiCheckboxCircleLine className="w-4 h-4 text-yellow-400 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsuarioFilters;