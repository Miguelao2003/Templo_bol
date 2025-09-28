import { useState, useEffect } from "react";
import { horarioService } from "../../../services/horarios";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../componentes/Notification";
import HorarioTable from "./componentes/HorarioTable";
import HorarioFilters from "./componentes/HorarioFilters";
import HorarioSearch from "./componentes/HorarioSearch";
import CrearHorarioModal from "./modales/CrearHorarioModal";
import EditarHorarioModal from "./modales/EditarHorarioModal";
import CambiarEstadoModal from "./modales/CambiarEstadoModal";
import EliminarHorarioModal from "../../admin/horarios/modales/EliminarHorarioModal";
import {
  RiCalendarLine,
  RiAddLine,
  RiRefreshLine,
  RiBarChart2Line,
  RiFilterLine,
  RiSearchLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiGroupLine,
} from "react-icons/ri";

import { GiMuscleUp } from "react-icons/gi";
import { RiPulseLine } from "react-icons/ri";

const TIPOS = {
  POWERPLATE: "powerplate",
  CALISTENIA: "calistenia",
};

// Agregar niveles disponibles
const NIVELES = {
  PRINCIPIANTE: "principiante",
  INTERMEDIO: "intermedio",
  AVANZADO: "avanzado",
};

const HorariosEntrenador = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tipo: null,
    estado: null,
    dia_semana: null,
    fecha: null,
    nivel: null, // Agregar filtro por nivel
  });
  const [modalState, setModalState] = useState({ crear: false, editar: false });
  const [newHorario, setNewHorario] = useState(initialHorarioState);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [horarioEstadoTarget, setHorarioEstadoTarget] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    desactivados: 0,
    powerplate: 0,
    calistenia: 0,
    principiante: 0, // Agregar stats por nivel
    intermedio: 0,
    avanzado: 0,
  });
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [horarioEliminacionTarget, setHorarioEliminacionTarget] =
    useState(null);

  const { notification, showNotification } = useNotification();

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHorarios();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  useEffect(() => {
    calculateStats();
  }, [horarios]);

  const calculateStats = () => {
    if (!horarios.length) {
      setStats({
        total: 0,
        activos: 0,
        desactivados: 0,
        powerplate: 0,
        calistenia: 0,
        principiante: 0,
        intermedio: 0,
        avanzado: 0,
      });
      return;
    }

    const newStats = {
      total: horarios.length,
      activos: horarios.filter((h) => h.estado === "activo").length,
      desactivados: horarios.filter((h) => h.estado === "desactivado").length,
      powerplate: horarios.filter((h) => h.tipo === "powerplate").length,
      calistenia: horarios.filter((h) => h.tipo === "calistenia").length,
      // Agregar estadísticas por nivel
      principiante: horarios.filter((h) => h.nivel === "principiante").length,
      intermedio: horarios.filter((h) => h.nivel === "intermedio").length,
      avanzado: horarios.filter((h) => h.nivel === "avanzado").length,
    };

    setStats(newStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setFilters({ 
      tipo: null, 
      estado: null, 
      dia_semana: null, 
      fecha: null,
      nivel: null // Incluir nivel en reset
    });
    await loadHorarios();
    setRefreshing(false);
    showNotification("success", "Lista de horarios actualizada");
  };

  const loadHorarios = async () => {
    setLoading(true);
    try {
      const params = {};

      // Agregar todos los filtros que tengan valor
      if (filters.tipo) params.tipo = filters.tipo;
      if (filters.estado) params.estado = filters.estado;
      if (filters.dia_semana) params.dia_semana = filters.dia_semana;
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.nivel) params.nivel = filters.nivel; // Agregar filtro nivel
      if (searchTerm.trim()) params.nombre_horario = searchTerm.trim();

      const data = await horarioService.searchHorarios(params);
      setHorarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
      showNotification("error", "Error al buscar horarios: " + err.message);
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHorario((prev) => ({ ...prev, [name]: value }));
  };

  // Función crear horario actualizada con nivel
  const handleCreateHorario = async (horarioData = null) => {
    try {
      // Preparar datos sin id_entrenador (se asigna automáticamente en backend)
      const dataToSend = horarioData || {
        nombre_horario: newHorario.nombre_horario.trim(),
        tipo: newHorario.tipo,
        fecha: newHorario.fecha,
        hora_inicio: newHorario.hora_inicio,
        hora_fin: newHorario.hora_fin,
        capacidad: parseInt(newHorario.capacidad),
        descripcion: newHorario.descripcion || "",
        nivel: newHorario.nivel || "principiante", // Agregar nivel con default
        // Solo incluir id_rutina si se seleccionó
        ...(newHorario.id_rutina &&
          newHorario.id_rutina !== "" && {
            id_rutina: parseInt(newHorario.id_rutina),
          }),
      };

      console.log("🚀 Enviando al backend (Entrenador) con nivel:", dataToSend);

      const created = await horarioService.createHorario(dataToSend);

      // Recargar la lista completa
      await loadHorarios();

      setModalState((prev) => ({ ...prev, crear: false }));
      resetForm();
      showNotification("success", "Horario creado exitosamente");
    } catch (err) {
      console.error("❌ Error en handleCreateHorario:", err);
      showNotification("error", err.message);
      throw err;
    }
  };

  // Función editar horario actualizada con nivel
  const handleEditHorario = async () => {
    try {
      // Solo enviar campos que un entrenador puede modificar
      const horarioToUpdate = {
        nombre_horario: newHorario.nombre_horario,
        fecha: newHorario.fecha,
        hora_inicio: newHorario.hora_inicio,
        hora_fin: newHorario.hora_fin,
        capacidad: parseInt(newHorario.capacidad) || 0,
        descripcion: newHorario.descripcion || "",
        nivel: newHorario.nivel, // Agregar nivel en actualización
      };

      // Incluir id_rutina si se seleccionó una
      if (newHorario.id_rutina && newHorario.id_rutina !== "") {
        horarioToUpdate.id_rutina = parseInt(newHorario.id_rutina);
      } else {
        // Si no hay rutina seleccionada, enviar null para limpiarla
        horarioToUpdate.id_rutina = null;
      }

      console.log(
        "📝 Actualizando horario (Entrenador - con nivel):",
        horarioToUpdate
      );

      const updated = await horarioService.updateHorario(
        selectedHorario.id_horario,
        horarioToUpdate
      );
      setHorarios((prev) =>
        prev.map((h) =>
          h.id_horario === selectedHorario.id_horario ? updated : h
        )
      );
      setModalState((prev) => ({ ...prev, editar: false }));
      showNotification("success", "Horario actualizado exitosamente");
    } catch (err) {
      console.error("❌ Error editando horario:", err);
      showNotification("error", err.response?.data?.detail || err.message);
    }
  };

  // Cambiar estado - mantener igual
  const handleToggleEstado = async () => {
    if (!horarioEstadoTarget) return;

    try {
      const estaActivo = horarioEstadoTarget.estado === "activo";
      let updated;

      // Usar los endpoints específicos del backend
      if (estaActivo) {
        updated = await horarioService.deactivateHorario(
          horarioEstadoTarget.id_horario
        );
      } else {
        updated = await horarioService.activateHorario(
          horarioEstadoTarget.id_horario
        );
      }

      // Actualizar la lista local
      setHorarios((prev) =>
        prev.map((h) => (h.id_horario === updated.id_horario ? updated : h))
      );

      const nuevoEstado = estaActivo ? "desactivado" : "activo";
      showNotification(
        "success",
        `Horario ${
          nuevoEstado === "activo" ? "activado" : "desactivado"
        } exitosamente`
      );
    } catch (err) {
      showNotification(
        "error",
        "Error al cambiar estado del horario: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setEstadoModalOpen(false);
      setHorarioEstadoTarget(null);
    }
  };

  // Funciones para eliminación - mantener igual
  const handleOpenEliminarModal = (horario) => {
    setHorarioEliminacionTarget(horario);
    setEliminarModalOpen(true);
  };

  const handleEliminarHorario = async (horarioId) => {
    try {
      await horarioService.deleteHorario(horarioId);

      // Actualizar la lista local eliminando el horario
      setHorarios((prev) => prev.filter((h) => h.id_horario !== horarioId));

      showNotification("success", "Horario eliminado exitosamente");

      // Recalcular estadísticas se hace automáticamente por el useEffect
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al eliminar el horario";
      showNotification("error", `Error: ${errorMessage}`);
      throw err; // Re-lanzar para que el modal maneje el loading state
    } finally {
      setEliminarModalOpen(false);
      setHorarioEliminacionTarget(null);
    }
  };

  const resetForm = () => {
    setNewHorario(initialHorarioState);
  };

  const handleOpenCambiarEstadoModal = (horario) => {
    setHorarioEstadoTarget(horario);
    setEstadoModalOpen(true);
  };

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
                <RiCalendarLine className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Mis Horarios
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Gestiona tus horarios de entrenamiento
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setModalState({ ...modalState, crear: true });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
            >
              <RiAddLine className="w-4 h-4" />
              Crear Horario
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Mis Horarios</span>
        </div>
      </div>

      {/* Stats cards actualizadas con nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCalendarLine className="w-5 h-5 text-yellow-400" />
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
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCloseCircleLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Desactivados
              </p>
              <p className="text-lg font-bold text-white">
                {stats.desactivados}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiPulseLine className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Powerplate
              </p>
              <p className="text-lg font-bold text-white">{stats.powerplate}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <GiMuscleUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Calistenia
              </p>
              <p className="text-lg font-bold text-white">{stats.calistenia}</p>
            </div>
          </div>
        </div>

        {/* Nuevas cards para niveles */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-400/20 to-green-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiGroupLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Principiante
              </p>
              <p className="text-lg font-bold text-white">{stats.principiante}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiGroupLine className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Intermedio
              </p>
              <p className="text-lg font-bold text-white">{stats.intermedio}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiGroupLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Avanzado
              </p>
              <p className="text-lg font-bold text-white">{stats.avanzado}</p>
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
            Buscar por nombre de horario, ejercicio o capacidad
          </label>
          <HorarioSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            horarios={horarios}
          />
        </div>

        {/* Filtros */}
        <div>
          <HorarioFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Active Filters Display actualizado con nivel */}
        {(searchTerm ||
          Object.values(filters).some((filter) => filter !== null)) && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>

              {searchTerm && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                  Búsqueda: "{searchTerm}"
                </span>
              )}

              {filters.tipo && (
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                  Tipo: {filters.tipo}
                </span>
              )}

              {filters.estado && (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                  Estado: {filters.estado}
                </span>
              )}

              {filters.dia_semana && (
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                  Día: {filters.dia_semana}
                </span>
              )}

              {filters.fecha && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/30">
                  Fecha: {filters.fecha.split("-").reverse().join("/")}
                </span>
              )}

              {/* Nuevo filtro de nivel */}
              {filters.nivel && (
                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm border border-indigo-500/30">
                  Nivel: {filters.nivel}
                </span>
              )}

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilters({
                    tipo: null,
                    estado: null,
                    dia_semana: null,
                    fecha: null,
                    nivel: null, // Incluir nivel en reset
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

      {/* Tabla de horarios */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
              <RiBarChart2Line className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Mis Horarios</h2>
              <p className="text-gray-400 text-sm">
                {loading
                  ? "Cargando horarios..."
                  : `${horarios.length} horarios encontrados`}
              </p>
            </div>
          </div>
        </div>

        <HorarioTable
          horarios={horarios}
          loading={loading}
          isEntrenadorView={true}
          onEdit={(horario) => {
            setSelectedHorario(horario);
            setNewHorario({ ...horario });
            setModalState({ ...modalState, editar: true });
          }}
          onChangeStatus={handleOpenCambiarEstadoModal}
          onDelete={handleOpenEliminarModal}
        />
      </div>

      {/* Modales */}
      <CrearHorarioModal
        isOpen={modalState.crear}
        onClose={() => setModalState({ ...modalState, crear: false })}
        onCreate={handleCreateHorario}
        horario={newHorario}
        onChange={handleInputChange}
        isEntrenadorView={true}
      />

      <EditarHorarioModal
        isOpen={modalState.editar}
        onClose={() => setModalState({ ...modalState, editar: false })}
        onSave={handleEditHorario}
        horario={newHorario}
        onChange={handleInputChange}
        isEntrenadorView={true}
      />

      <CambiarEstadoModal
        isOpen={estadoModalOpen}
        onClose={() => setEstadoModalOpen(false)}
        onConfirm={handleToggleEstado}
        horario={horarioEstadoTarget}
      />

      <EliminarHorarioModal
        isOpen={eliminarModalOpen}
        onClose={() => {
          setEliminarModalOpen(false);
          setHorarioEliminacionTarget(null);
        }}
        onConfirm={handleEliminarHorario}
        horario={horarioEliminacionTarget}
      />
    </div>
  );
};

// Estado inicial actualizado con nivel
const initialHorarioState = {
  nombre_horario: "",
  id_rutina: "",
  tipo: "powerplate",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
  descripcion: "",
  capacidad: 1,
  nivel: "principiante", // Agregar nivel con valor por defecto
};

export default HorariosEntrenador;