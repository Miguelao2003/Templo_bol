import { useState, useEffect } from "react";
import { equipoService } from "../../../services/equipos";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../componentes/Notification";
import {
  RiFlashlightLine,
  RiAddLine,
  RiRefreshLine,
  RiBarChart2Line,
  RiFilterLine,
  RiSearchLine,
  RiToolsLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiCalendarLine,
  RiShieldCheckLine,
} from "react-icons/ri";

// Componentes
import EquipoTable from "./componentes/EquipoTable";
import EquipoFilters from "./componentes/EquipoFilters";
import EquipoSearch from "./componentes/EquipoSearch";
import CrearEquipoModal from "./modales/CrearEquipoModal";
import EditarEquipoModal from "./modales/EditarEquipoModal";
import CambiarEstadoModal from "./modales/CambiarEstadoModal";

const Equipos = () => {
  // Estados
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    estado: null,
    fechaUltimoDesde: null,
    fechaUltimoHasta: null,
    fechaProximoDesde: null,
    fechaProximoHasta: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    mantenimiento: 0,
    proximosMantenimiento: 0,
    antiguos: 0,
    nuevos: 0,
  });

  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    estado: false,
  });

  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [newEquipo, setNewEquipo] = useState(initialEquipoState);
  const { notification, showNotification } = useNotification();

  // Efectos
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEquipos();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  useEffect(() => {
    calculateStats();
  }, [equipos]);

  // Funciones
  const calculateStats = () => {
    if (!equipos.length) {
      setStats({
        total: 0,
        activos: 0,
        mantenimiento: 0,
        proximosMantenimiento: 0,
        antiguos: 0,
        nuevos: 0,
      });
      return;
    }

    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    const newStats = {
      total: equipos.length,
      activos: equipos.filter((e) => e.estado === "activo").length,
      mantenimiento: equipos.filter((e) => e.estado === "mantenimiento").length,
      proximosMantenimiento: equipos.filter((e) => {
        if (!e.proximo_mantenimiento) return false;
        const fechaMantenimiento = new Date(e.proximo_mantenimiento);
        return fechaMantenimiento <= oneWeekFromNow;
      }).length,
      antiguos: equipos.filter((e) => {
        if (!e.ultimo_mantenimiento) return false;
        const fechaUltimo = new Date(e.ultimo_mantenimiento);
        return fechaUltimo <= oneYearAgo;
      }).length,
      nuevos: equipos.filter((e) => {
        if (!e.ultimo_mantenimiento) return true;
        const fechaUltimo = new Date(e.ultimo_mantenimiento);
        return fechaUltimo > oneYearAgo;
      }).length,
    };

    setStats(newStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setFilters({
      estado: null,
      fechaUltimoDesde: null,
      fechaUltimoHasta: null,
      fechaProximoDesde: null,
      fechaProximoHasta: null,
    });
    await loadEquipos();
    setRefreshing(false);
    showNotification("success", "Lista de equipos actualizada");
  };

  const loadEquipos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.nombre_equipo = searchTerm;
      if (filters.estado) params.estado = filters.estado;
      // Filtros de rango de fechas - último mantenimiento
      if (filters.fechaUltimoDesde)
        params.ultimo_mantenimiento_desde = filters.fechaUltimoDesde;
      if (filters.fechaUltimoHasta)
        params.ultimo_mantenimiento_hasta = filters.fechaUltimoHasta;

      // ✅ Filtros de rango de fechas (usando los nombres que coinciden con el servicio)
      if (filters.fechaUltimoDesde)
        params.fechaUltimoDesde = filters.fechaUltimoDesde;
      if (filters.fechaUltimoHasta)
        params.fechaUltimoHasta = filters.fechaUltimoHasta;
      if (filters.fechaProximoDesde)
        params.fechaProximoDesde = filters.fechaProximoDesde;
      if (filters.fechaProximoHasta)
        params.fechaProximoHasta = filters.fechaProximoHasta;

      const data = await equipoService.buscarEquipos(params);
      setEquipos(Array.isArray(data) ? data : []);
    } catch (err) {
      showNotification("error", "Error al cargar equipos: " + err.message);
      setEquipos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipoInputChange = (e) => {
    const { name, value } = e.target;
    setNewEquipo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEquipo = async () => {
    try {
      const data = await equipoService.createEquipo(newEquipo);
      setEquipos((prev) => [data, ...prev]);
      showNotification("success", "Equipo creado exitosamente");
      setModalState((prev) => ({ ...prev, crear: false }));
      resetForm();
    } catch (err) {
      showNotification("error", "Error al crear equipo: " + err.message);
    }
  };

  const handleEditEquipo = async () => {
    try {
      const data = await equipoService.updateEquipo(
        selectedEquipo.id_equipo,
        newEquipo
      );
      setEquipos((prev) =>
        prev.map((e) => (e.id_equipo === selectedEquipo.id_equipo ? data : e))
      );
      showNotification("success", "Equipo actualizado exitosamente");
      setModalState((prev) => ({ ...prev, editar: false }));
    } catch (err) {
      showNotification("error", "Error al editar equipo: " + err.message);
    }
  };

  const handleChangeEstado = async () => {
    try {
      const id = selectedEquipo.id_equipo;
      let updatedEquipo = null;

      if (selectedEquipo.estado === "activo") {
        updatedEquipo = await equipoService.mantenimientoEquipo(id);
      } else {
        updatedEquipo = await equipoService.activarEquipo(id);
      }

      setEquipos((prev) =>
        prev.map((e) =>
          e.id_equipo === selectedEquipo.id_equipo ? updatedEquipo : e
        )
      );
      setModalState((prev) => ({ ...prev, estado: false }));
      showNotification(
        "success",
        `Equipo ${
          selectedEquipo.estado === "activo" ? "en mantenimiento" : "activado"
        } exitosamente`
      );
    } catch (err) {
      showNotification("error", "Error al cambiar estado: " + err.message);
    }
  };

  const formatDateRange = (startDate, endDate) => {
  const formatDate = (date) => {
    if (!date) return '';
    
    // Si es una cadena, convertir a Date
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) return '';
    
    // Formatear la fecha (ejemplo: "15/03/2024")
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start && end) {
    return `${start} - ${end}`;
  } else if (start) {
    return `Desde ${start}`;
  } else if (end) {
    return `Hasta ${end}`;
  }
  
  return '';
};

  const resetForm = () => setNewEquipo(initialEquipoState);

  return (
    <div className="relative z-10 py-8">
      <Notification
        notification={notification}
        onClose={() => showNotification(null, null)}
      />

      {/* Header principal */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                <RiFlashlightLine className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Gestión de Equipos
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Administra y supervisa el estado de los equipos del gimnasio
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setModalState((prev) => ({ ...prev, crear: true }));
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
            >
              <RiAddLine className="w-4 h-4" />
              Crear Equipo
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Equipos</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiFlashlightLine className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total
              </p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCheckboxCircleLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Activos
              </p>
              <p className="text-lg font-bold text-white">{stats.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiToolsLine className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Mantenimiento
              </p>
              <p className="text-lg font-bold text-white">
                {stats.mantenimiento}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiErrorWarningLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Próx. Mant.
              </p>
              <p className="text-lg font-bold text-white">
                {stats.proximosMantenimiento}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCalendarLine className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Antiguos
              </p>
              <p className="text-lg font-bold text-white">{stats.antiguos}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiShieldCheckLine className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Nuevos
              </p>
              <p className="text-lg font-bold text-white">{stats.nuevos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de búsqueda y filtros */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8 relative z-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
            <RiSearchLine className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white">Búsqueda y Filtros</h2>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Buscar por nombre de equipo
          </label>
          <EquipoSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        {/* Filtros */}
        <div>
          <EquipoFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Active Filters Display */}
        {(searchTerm ||
          filters.estado ||
          filters.fechaUltimoDesde ||
          filters.fechaUltimoHasta ||
          filters.fechaProximoDesde ||
          filters.fechaProximoHasta) && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>

              {searchTerm && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                  Búsqueda: "{searchTerm}"
                </span>
              )}

              {filters.estado && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                  Estado: {filters.estado}
                </span>
              )}

              {/* Filtro de Último Mantenimiento */}
              {(filters.fechaUltimoDesde || filters.fechaUltimoHasta) && (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                  Último:{" "}
                  {formatDateRange(
                    filters.fechaUltimoDesde,
                    filters.fechaUltimoHasta
                  )}
                </span>
              )}

              {/* Filtro de Próximo Mantenimiento */}
              {(filters.fechaProximoDesde || filters.fechaProximoHasta) && (
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                  Próximo:{" "}
                  {formatDateRange(
                    filters.fechaProximoDesde,
                    filters.fechaProximoHasta
                  )}
                </span>
              )}

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilters({
                    estado: null,
                    fechaUltimoDesde: null,
                    fechaUltimoHasta: null,
                    fechaProximoDesde: null,
                    fechaProximoHasta: null,
                  });
                }}
                className="text-gray-400 hover:text-red-400 text-sm ml-2 hover:underline transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de equipos */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
              <RiBarChart2Line className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lista de Equipos</h2>
              <p className="text-gray-400 text-sm">
                {loading
                  ? "Cargando equipos..."
                  : `${equipos.length} equipos encontrados`}
              </p>
            </div>
          </div>
        </div>

        <EquipoTable
          equipos={equipos}
          loading={loading}
          onEdit={(equipo) => {
            setSelectedEquipo(equipo);
            setNewEquipo(mapEquipoToForm(equipo));
            setModalState((prev) => ({ ...prev, editar: true }));
          }}
          onChangeEstado={(equipo) => {
            setSelectedEquipo(equipo);
            setModalState((prev) => ({ ...prev, estado: true }));
          }}
        />
      </div>

      {/* Modales */}
      <CrearEquipoModal
        isOpen={modalState.crear}
        onClose={() => setModalState((prev) => ({ ...prev, crear: false }))}
        onCreate={handleCreateEquipo}
        equipo={newEquipo}
        onChange={handleEquipoInputChange}
      />

      <EditarEquipoModal
        isOpen={modalState.editar}
        onClose={() => setModalState((prev) => ({ ...prev, editar: false }))}
        onSave={handleEditEquipo}
        equipo={newEquipo}
        onChange={handleEquipoInputChange}
      />

      <CambiarEstadoModal
        isOpen={modalState.estado}
        onClose={() => setModalState((prev) => ({ ...prev, estado: false }))}
        onConfirm={handleChangeEstado}
        equipo={selectedEquipo}
      />
    </div>
  );
};

// Estado inicial
const initialEquipoState = {
  nombre_equipo: "",
  estado: "activo",
  ultimo_mantenimiento: "",
  proximo_mantenimiento: "",
  especificaciones_tecnicas: "",
};

// Mapeo de backend a formulario
const mapEquipoToForm = (equipo) => ({
  nombre_equipo: equipo.nombre_equipo || "",
  estado: equipo.estado || "activo",
  especificaciones_tecnicas: equipo.especificaciones_tecnicas || "",
  ultimo_mantenimiento: equipo.ultimo_mantenimiento || "",
  proximo_mantenimiento: equipo.proximo_mantenimiento || "",
});

export default Equipos;
