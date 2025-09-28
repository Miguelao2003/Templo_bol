import { useState, useEffect } from "react";
import { rutinaService } from "../../../services/rutinas";
import { useNotification } from "../../../hooks/useNotification";
import Notification from "../../../componentes/Notification";
import RutinaTable from "./componentes/RutinaTable";
import RutinaFilters from "./componentes/RutinaFilters";
import RutinaSearch from "./componentes/RutinaSearch";
import CrearRutinaModal from "./modales/CrearRutinaModal";
import EditarRutinaModal from "./modales/EditarRutinaModal";
import CambiarEstadoModal from "./modales/CambiarEstadoModal";
import {
  RiAddLine,
  RiRefreshLine,
  RiBarChart2Line,
  RiFilterLine,
  RiSearchLine,
  RiHeartPulseLine,
  RiFunctionLine,
  RiRepeatLine,
  RiTimeLine,
  RiFocus3Line,
  RiBodyScanLine,
  RiFlashlightLine,
  RiShieldLine,
} from "react-icons/ri";
import { GiBodyBalance } from "react-icons/gi";

const Rutinas = () => {
  // Estados
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ musculo: null });
  const [modalState, setModalState] = useState({
    crear: false,
    editar: false,
    estado: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    totalEjercicios: 0,
    promedioEjercicios: 0,
    pecho: 0,
    espalda: 0,
    pierna: 0,
    bicep: 0,
    tricep: 0,
    hombro: 0,
    abdomen: 0,
  });
  const [selectedRutina, setSelectedRutina] = useState(null);

  const { notification, showNotification } = useNotification();
  const [deleteError, setDeleteError] = useState(null);

  // Efectos
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRutinas();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  useEffect(() => {
    calculateStats();
  }, [rutinas]);

  // Funciones
  const calculateStats = () => {
    if (!rutinas.length) {
      setStats({
        total: 0,
        totalEjercicios: 0,
        promedioEjercicios: 0,
        pecho: 0,
        espalda: 0,
        pierna: 0,
        bicep: 0,
        tricep: 0,
        hombro: 0,
        abdomen: 0,
      });
      return;
    }

    // Contar total de ejercicios y músculos en todas las rutinas
    let totalEjercicios = 0;
    const musculosCount = {
      pecho: 0,
      espalda: 0,
      pierna: 0,
      bicep: 0,
      tricep: 0,
      hombro: 0,
      abdomen: 0,
    };

    rutinas.forEach((rutina) => {
      // Contar ejercicios en esta rutina
      if (
        rutina.nombres_ejercicios &&
        Array.isArray(rutina.nombres_ejercicios)
      ) {
        totalEjercicios += rutina.nombres_ejercicios.length;
      }

      // Contar músculos en esta rutina
      if (rutina.partes_musculo && Array.isArray(rutina.partes_musculo)) {
        rutina.partes_musculo.forEach((musculo) => {
          if (musculosCount.hasOwnProperty(musculo)) {
            musculosCount[musculo]++;
          }
        });
      }
    });

    const newStats = {
      total: rutinas.length,
      totalEjercicios,
      promedioEjercicios: rutinas.length
        ? Math.round((totalEjercicios / rutinas.length) * 10) / 10
        : 0,
      ...musculosCount,
    };

    setStats(newStats);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchTerm("");
    setFilters({ musculo: null });
    await loadRutinas();
    setRefreshing(false);
    showNotification("success", "Lista de rutinas actualizada");
  };

  const loadRutinas = async () => {
    setLoading(true);
    try {
      let data = [];

      // Si hay búsqueda por nombre, usar el endpoint de búsqueda
      if (searchTerm.trim()) {
        console.log("🔍 Buscando rutinas por término:", searchTerm);
        data = await rutinaService.searchRutinas(searchTerm.trim());
      } else {
        // Cargar todas las rutinas
        console.log("📋 Cargando todas las rutinas");
        data = await rutinaService.getAll();

        // Aplicar filtro de músculo en el frontend si es necesario
        if (filters.musculo) {
          console.log("🎯 Filtrando por músculo en frontend:", filters.musculo);
          data = data.filter((rutina) => {
            return (
              rutina.partes_musculo &&
              Array.isArray(rutina.partes_musculo) &&
              rutina.partes_musculo.some(
                (musculo) =>
                  musculo.toLowerCase() === filters.musculo.toLowerCase()
              )
            );
          });
        }
      }

      setRutinas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando rutinas:", err);
      showNotification(
        "error",
        "Error al cargar rutinas: " +
          (err.response?.data?.detail || err.message)
      );
      setRutinas([]);
    } finally {
      setLoading(false);
    }
  };

  // ACTUALIZADO: Nueva función para crear rutina con arrays JSON
  const handleCreateRutina = async (rutinaData) => {
    try {
      console.log("📤 Creando rutina con datos:", rutinaData);

      const creada = await rutinaService.createRutina(rutinaData);
      console.log("✅ Rutina creada:", creada);

      setRutinas((prev) => [creada, ...prev]);
      setModalState((prev) => ({ ...prev, crear: false }));
      showNotification("success", "Rutina creada exitosamente");
    } catch (err) {
      console.error("❌ Error creando rutina:", err);
      showNotification("error", err.response?.data?.detail || err.message);
      throw err; // Propagar error para que el modal lo maneje
    }
  };

  // ACTUALIZADO: Manejo moderno de edición con arrays
  const handleEditRutina = async (rutinaData) => {
    try {
      console.log("📤 Actualizando rutina con datos:", rutinaData);

      const actualizada = await rutinaService.updateRutina(
        selectedRutina.id_rutina,
        rutinaData
      );

      setRutinas((prev) =>
        prev.map((r) =>
          r.id_rutina === selectedRutina.id_rutina ? actualizada : r
        )
      );
      setModalState((prev) => ({ ...prev, editar: false }));
      showNotification("success", "Rutina actualizada correctamente");
    } catch (err) {
      console.error("❌ Error editando rutina:", err);
      showNotification("error", err.response?.data?.detail || err.message);
      throw err;
    }
  };

  const handleDeleteRutina = async () => {
    try {
      setDeleteError(null);
      console.log("🗑️ Eliminando rutina ID:", selectedRutina.id_rutina);

      await rutinaService.deleteRutina(selectedRutina.id_rutina);
      console.log("✅ Rutina eliminada exitosamente");

      setRutinas((prev) =>
        prev.filter((r) => r.id_rutina !== selectedRutina.id_rutina)
      );

      setModalState((prev) => ({ ...prev, estado: false }));
      setSelectedRutina(null);
      showNotification("success", "Rutina eliminada correctamente");
    } catch (err) {
      console.error("❌ Error eliminando rutina:", err);

      let errorMessage = "Error al eliminar rutina";

      if (
        err.response?.data?.detail?.includes("horario") ||
        err.response?.data?.detail?.includes("restricción")
      ) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else {
        errorMessage = err.message;
      }

      setDeleteError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, estado: false }));
    setDeleteError(null);
    setSelectedRutina(null);
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
                <GiBodyBalance className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Administración de Rutinas
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Gestiona rutinas con múltiples ejercicios del sistema completo
              </p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setModalState({ ...modalState, crear: true });
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
            >
              <RiAddLine className="w-4 h-4" />
              Crear Rutina
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Administración</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">Rutinas</span>
        </div>
      </div>

      {/* Stats cards - ACTUALIZADAS para rutinas con arrays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-10 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <GiBodyBalance className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Rutinas
              </p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiFunctionLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Ejercicios
              </p>
              <p className="text-lg font-bold text-white">
                {stats.totalEjercicios}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiRepeatLine className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Promedio
              </p>
              <p className="text-lg font-bold text-white">
                {stats.promedioEjercicios}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiHeartPulseLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Pecho
              </p>
              <p className="text-lg font-bold text-white">{stats.pecho}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiBodyScanLine className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Espalda
              </p>
              <p className="text-lg font-bold text-white">{stats.espalda}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiFocus3Line className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Piernas
              </p>
              <p className="text-lg font-bold text-white">{stats.pierna}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiFlashlightLine className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Bícep
              </p>
              <p className="text-lg font-bold text-white">{stats.bicep}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiShieldLine className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Trícep
              </p>
              <p className="text-lg font-bold text-white">{stats.tricep}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiTimeLine className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Hombros
              </p>
              <p className="text-lg font-bold text-white">{stats.hombro}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiBodyScanLine className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Abdomen
              </p>
              <p className="text-lg font-bold text-white">{stats.abdomen}</p>
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
            Buscar rutinas (por nombre de ejercicio, músculo o entrenador)
          </label>
          <RutinaSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        {/* Filtros */}
        <div>
          <RutinaFilters
            filters={filters}
            setFilters={setFilters}
            musculos={[
              "pecho",
              "espalda",
              "pierna",
              "bicep",
              "tricep",
              "hombro",
              "abdomen",
            ]}
          />
        </div>

        {/* Active Filters Display */}
        {(searchTerm || filters.musculo) && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>
              {searchTerm && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                  Búsqueda: "{searchTerm}"
                </span>
              )}
              {filters.musculo && (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                  Músculo: {filters.musculo}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ musculo: null });
                }}
                className="text-gray-400 hover:text-red-400 text-sm ml-2 hover:underline transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de rutinas */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
              <RiBarChart2Line className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lista de Rutinas</h2>
              <p className="text-gray-400 text-sm">
                {loading
                  ? "Cargando rutinas..."
                  : `${rutinas.length} rutinas encontradas`}
              </p>
            </div>
          </div>
        </div>

        <RutinaTable
          rutinas={rutinas}
          loading={loading}
          onEdit={(rutina) => {
            console.log("🔄 Editando rutina:", rutina);
            setSelectedRutina(rutina);
            setModalState((prev) => ({ ...prev, editar: true }));
          }}
          onDelete={(rutina) => {
            console.log("🗑️ Eliminando rutina:", rutina);
            setSelectedRutina(rutina);
            setModalState((prev) => ({ ...prev, estado: true }));
          }}
        />
      </div>

      {/* Modales */}
      <CrearRutinaModal
        isOpen={modalState.crear}
        onClose={() => setModalState((prev) => ({ ...prev, crear: false }))}
        onCreate={handleCreateRutina}
      />

      <EditarRutinaModal
        isOpen={modalState.editar}
        onClose={() => setModalState((prev) => ({ ...prev, editar: false }))}
        onSave={handleEditRutina}
        rutina={selectedRutina}
      />

      <CambiarEstadoModal
        isOpen={modalState.estado}
        onClose={handleCloseModal}
        onConfirm={handleDeleteRutina}
        rutina={selectedRutina}
        error={deleteError}
      />
    </div>
  );
};

export default Rutinas;