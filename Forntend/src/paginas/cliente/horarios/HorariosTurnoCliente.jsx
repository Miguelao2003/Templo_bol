import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { horarioService } from "../../../services/horarios";
import { getLocalUser } from "../../../services/auth";
import CrearReservaModalCliente from "../reservas/modales/CrearReservaModalCliente";
import HorarioFilters from "./componentes/HorarioFilters"; // 🆕 Importar filtros
import {
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiGroupLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiInformationLine,
  RiRefreshLine,
  RiBookOpenLine,
  RiEyeOffLine,
  RiCheckLine,
  RiBookmarkLine,
  RiToolsLine,
  RiStarLine,
  RiTrophyLine,
  RiSeedlingLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiFilterLine, // 🆕 Agregar icono de filtros
} from "react-icons/ri";
import { MdFitnessCenter } from "react-icons/md";
import { GiMuscleUp } from "react-icons/gi";

const HorariosTurnoCliente = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);
  const [fechasExpandidas, setFechasExpandidas] = useState({}); // Estado para fechas desplegables

  // 🆕 ESTADO PARA FILTROS (siguiendo el patrón del administrador)
  const [filters, setFilters] = useState({
    estado: null,
    dia_semana: null,
    fecha: null,
    nivel: null,
  });

  const navigate = useNavigate();

  // 🔧 SOLUCIÓN DIRECTA: Usar localStorage como fuente de verdad
  const getCurrentUserData = () => {
    const localUser = getLocalUser();
    console.log("🔍 Usuario actual del localStorage:", localUser);
    return localUser;
  };

  const currentUserData = getCurrentUserData();

  // Determinar el tipo de cliente usando SOLO localStorage
  const getClientType = () => {
    const userToUse = currentUserData;

    if (!userToUse) return "calistenia";

    console.log(
      "🔍 getClientType - Usuario usado:",
      userToUse.nombre,
      userToUse.categoria
    );

    if (userToUse.categoria) {
      const categoria = userToUse.categoria.toLowerCase();
      if (categoria === "powerplate" || categoria === "power-plate") {
        console.log("✅ Detectado como POWERPLATE");
        return "powerplate";
      }
    }
    console.log("✅ Detectado como CALISTENIA");
    return "calistenia";
  };

  const clientType = getClientType();

  // Debug: mostrar el tipo detectado
  console.log("🎯 Tipo de cliente actual:", clientType);
  console.log("🎯 Usuario actual:", currentUserData);

  // 🔥 FUNCIÓN PARA OBTENER EL LUNES DE LA SEMANA ACTUAL
  const getMondayOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  };

  // 🔥 FUNCIÓN PARA OBTENER FECHAS VÁLIDAS (LUNES A SÁBADO)
  const getValidDateRange = () => {
    const today = new Date();
    const mondayOfCurrentWeek = getMondayOfWeek(today);

    // Desde el lunes de esta semana hasta miércoles de la próxima semana
    const startDate = new Date(mondayOfCurrentWeek);
    const endDate = new Date(mondayOfCurrentWeek);
    endDate.setDate(endDate.getDate() + 9); // Lunes + 9 días = Miércoles de la siguiente semana

    return { startDate, endDate, today };
  };

  // 🔥 FUNCIÓN PARA VERIFICAR SI UNA FECHA YA PASÓ
  const isDatePast = (dateString) => {
    const date = new Date(dateString + "T23:59:59"); // Final del día
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual
    return date < today;
  };

  // 🔥 FUNCIÓN PARA FILTRAR HORARIOS POR RANGO DE FECHAS
  const filterHorariosByDateRange = (horarios) => {
    const { startDate, endDate } = getValidDateRange();

    return horarios.filter((horario) => {
      const horarioDate = new Date(horario.fecha + "T12:00:00");
      const horarioDay = horarioDate.getDay();

      // Excluir domingos (día 0)
      if (horarioDay === 0) return false;

      // Verificar que esté en el rango de fechas
      return horarioDate >= startDate && horarioDate <= endDate;
    });
  };

  // 🆕 FUNCIÓN PARA MANEJAR EXPANSIÓN/COLAPSO DE FECHAS
  const toggleFechaExpansion = (fecha) => {
    setFechasExpandidas((prev) => ({
      ...prev,
      [fecha]: !prev[fecha],
    }));
  };

  // 🆕 FUNCIÓN PARA OBTENER ICONO Y COLOR DEL NIVEL
  const getNivelInfo = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "principiante":
        return {
          icon: RiSeedlingLine,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "Principiante",
        };
      case "intermedio":
        return {
          icon: RiStarLine,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Intermedio",
        };
      case "avanzado":
        return {
          icon: RiTrophyLine,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          label: "Avanzado",
        };
      default:
        return {
          icon: RiSeedlingLine,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
          label: "Sin nivel",
        };
    }
  };

  // 🆕 FUNCIÓN CORREGIDA PARA GENERAR SLOTS DINÁMICOS
  const generateTimeSlotsForDay = (horarios) => {
    const slots = new Set();

    // Agregar TODOS los slots basados en los horarios reales del día
    horarios.forEach((horario) => {
      const horaInicio = horario.hora_inicio.substring(0, 5); // "10:30", "13:00", etc.
      slots.add(horaInicio);
    });

    // Si no hay horarios, mostrar slots básicos por horas
    if (slots.size === 0) {
      for (let hour = 6; hour <= 22; hour++) {
        slots.add(`${hour.toString().padStart(2, "0")}:00`);
      }
    } else {
      // Agregar slots de contexto (horas completas alrededor)
      const horasUsadas = Array.from(slots).map((slot) =>
        parseInt(slot.split(":")[0])
      );
      const minHora = Math.max(6, Math.min(...horasUsadas) - 1);
      const maxHora = Math.min(22, Math.max(...horasUsadas) + 1);

      // Agregar horas completas para contexto
      for (let hour = minHora; hour <= maxHora; hour++) {
        const hourSlot = `${hour.toString().padStart(2, "0")}:00`;
        slots.add(hourSlot);
      }
    }

    // Convertir a array y ordenar cronológicamente
    return Array.from(slots).sort((a, b) => {
      const [hourA, minA] = a.split(":").map(Number);
      const [hourB, minB] = b.split(":").map(Number);
      const timeA = hourA * 60 + minA;
      const timeB = hourB * 60 + minB;
      return timeA - timeB;
    });
  };

  // 🆕 FUNCIÓN CORREGIDA PARA ENCONTRAR HORARIOS EN UN SLOT ESPECÍFICO
  const getHorariosForTimeSlot = (horariosDia, timeSlot) => {
    return horariosDia.filter((horario) => {
      const horaInicio = horario.hora_inicio.substring(0, 5); // "10:30", "13:00"
      return horaInicio === timeSlot;
    });
  };

  // 🆕 FUNCIÓN PARA FORMATEAR TIEMPO LEGIBLE
  const formatTimeSlot = (timeSlot) => {
    return timeSlot; // Ya viene en formato "HH:MM"
  };

  const loadHorariosSemana = async () => {
    try {
      // 🆕 APLICAR FILTROS usando searchHorarios si hay filtros activos
      const hasActiveFilters = Object.values(filters).some(
        (filter) => filter !== null && filter !== ""
      );

      let data;
      if (hasActiveFilters) {
        // Si hay filtros activos, usar searchHorarios
        const searchParams = {};

        if (filters.estado) searchParams.estado = filters.estado;
        if (filters.dia_semana) searchParams.dia_semana = filters.dia_semana;
        if (filters.fecha) searchParams.fecha = filters.fecha;
        if (filters.nivel) searchParams.nivel = filters.nivel;

        // 🔍 AGREGAR ESTE DEBUG
        console.log("🔍 Filtros aplicados:", searchParams);
        console.log("🔍 URL de búsqueda:", "/horarios/buscar/");
        console.log(
          "🔍 Parámetros enviados:",
          JSON.stringify(searchParams, null, 2)
        );

        // 🚨 SOLUCIÓN TEMPORAL: Si hay fecha Y estado, priorizar fecha
        if (searchParams.fecha && searchParams.estado) {
          console.log(
            "⚠️ Detectados filtros múltiples conflictivos, usando solo fecha"
          );
          const tempParams = { ...searchParams };
          delete tempParams.estado;
          data = await horarioService.searchHorarios(tempParams);

          // Filtrar por estado en el frontend
          if (Array.isArray(data)) {
            data = data.filter(
              (horario) => horario.estado === searchParams.estado
            );
          }
        } else {
          data = await horarioService.searchHorarios(searchParams);
        }
      } else {
        // Si no hay filtros, usar getAllCliente normal
        data = await horarioService.getAllCliente();
      }

      const allHorarios = Array.isArray(data) ? data : [];

      // 🔥 FILTRAR POR RANGO DE FECHAS VÁLIDAS (solo si no hay filtro de fecha específica)
      const filteredHorarios = filters.fecha
        ? allHorarios
        : filterHorariosByDateRange(allHorarios);

      setHorarios(filteredHorarios);
    } catch (error) {
      console.error("Error al cargar horarios semanales:", error);
      // 🔍 AGREGAR MÁS DETALLES DEL ERROR
      if (error.response) {
        console.error("🚨 Status:", error.response.status);
        console.error("🚨 Data:", error.response.data);
        console.error("🚨 Headers:", error.response.headers);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHorariosSemana();
  }, []);

  // 🆕 USEEFFECT PARA FILTROS (siguiendo el patrón del administrador)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHorariosSemana();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters]);

  // 🔥 RECARGAR CUANDO EL USUARIO CAMBIE - Usando localStorage
  useEffect(() => {
    const localUser = getLocalUser();
    if (localUser) {
      console.log("👤 Usuario cambió, recargando horarios...");
      loadHorariosSemana();
    }
  }, [currentUserData?.id_usuario, currentUserData?.categoria]); // Usar datos de localStorage

  const handleRefresh = async () => {
    setRefreshing(true);
    // 🆕 RESETEAR FILTROS AL ACTUALIZAR (siguiendo el patrón del administrador)
    setFilters({
      estado: null,
      dia_semana: null,
      fecha: null,
      nivel: null,
    });
    await loadHorariosSemana();
  };

  // 🎯 FUNCIÓN PARA MANEJAR RESERVAS SEGÚN TIPO DE CLIENTE
  const handleReservar = (horario) => {
    const actualClientType = getClientType(); // Obtener el tipo actual
    console.log("🎯 Reservando con tipo de cliente:", actualClientType);

    if (actualClientType === "calistenia") {
      // Clientes de calistenia: abrir modal
      setSelectedHorario(horario);
      setShowReservaModal(true);
    } else if (actualClientType === "powerplate") {
      // Clientes de powerplate: ir a vista de equipos
      navigate(
        `/cliente/horarioturnocliente/equipopowerplate?horario=${horario.id_horario}`,
        {
          state: { horario },
        }
      );
    }
  };

  // 🎯 FUNCIÓN PARA CERRAR MODAL DE RESERVA
  const handleCloseReservaModal = () => {
    setShowReservaModal(false);
    setSelectedHorario(null);
  };

  // 🎯 FUNCIÓN PARA CONFIRMAR RESERVA (solo calistenia)
  const handleConfirmReserva = async (reservaData) => {
    try {
      console.log("Creando reserva:", reservaData);

      // Guardar datos de la reserva confirmada
      setReservaConfirmada({
        horario: selectedHorario,
        reservaData,
      });

      // Cerrar modal
      handleCloseReservaModal();

      // Mostrar notificación de éxito
      setShowSuccessNotification(true);

      // Recargar horarios
      await loadHorariosSemana();

      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        setShowSuccessNotification(false);
        setReservaConfirmada(null);
      }, 3000);
    } catch (error) {
      console.error("Error al crear reserva:", error);
    }
  };

  // 🔥 FUNCIÓN PARA FORMATEAR FECHA CORRECTAMENTE
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Agrupar horarios por fecha
  const horariosPorDia = horarios.reduce((acc, horario) => {
    const fecha = horario.fecha;
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(horario);
    return acc;
  }, {});

  // 🔥 ORDENAR FECHAS CRONOLÓGICAMENTE
  const fechasOrdenadas = Object.keys(horariosPorDia).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  if (loading) {
    return (
      <div className="relative z-10 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Cargando horarios...</p>
          </div>
        </div>
      </div>
    );
  }

  const { today } = getValidDateRange();
  const totalDiasPasados = fechasOrdenadas.filter((fecha) =>
    isDatePast(fecha)
  ).length;
  const totalDiasActivos = fechasOrdenadas.length - totalDiasPasados;

  return (
    <div className="relative z-10 py-8">
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
                Turnos Semanales
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Consulta y reserva tus entrenamientos disponibles
                <span className="ml-2 text-yellow-400 font-medium">
                  ({clientType === "powerplate" ? "Powerplate" : "Calistenia"})
                </span>
              </p>
            </div>
          </div>

        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Turnos</span>
        </div>
      </div>

      {/* 🆕 PANEL DE FILTROS (siguiendo el patrón del administrador) */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8 relative z-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
            <RiFilterLine className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white">Filtros de Búsqueda</h2>
        </div>

        {/* Componente de filtros */}
        <HorarioFilters filters={filters} setFilters={setFilters} />

        {/* Mostrar filtros activos */}
        {Object.values(filters).some(
          (filter) => filter !== null && filter !== ""
        ) && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>

              {filters.nivel && (
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                  Nivel: {filters.nivel}
                </span>
              )}

              {filters.estado && (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                  Estado: {filters.estado}
                </span>
              )}

              {filters.dia_semana && (
                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm border border-indigo-500/30">
                  Día: {filters.dia_semana}
                </span>
              )}

              {filters.fecha && (
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                  Fecha: {filters.fecha.split("-").reverse().join("/")}
                </span>
              )}

              <button
                onClick={() => {
                  setFilters({
                    estado: null,
                    dia_semana: null,
                    fecha: null,
                    nivel: null,
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

      {/* 🔥 ESTADÍSTICAS DE DÍAS */}
      {fechasOrdenadas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <RiCalendarLine className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Días</p>
                <p className="text-lg font-bold text-white">
                  {fechasOrdenadas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <RiCheckboxCircleLine className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Días Activos</p>
                <p className="text-lg font-bold text-white">
                  {totalDiasActivos}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <RiEyeOffLine className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Días Pasados</p>
                <p className="text-lg font-bold text-white">
                  {totalDiasPasados}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 CONTENIDO PRINCIPAL - CALENDARIO DESPLEGABLE */}
      {fechasOrdenadas.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl w-fit mx-auto mb-6">
            <RiCalendarLine className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            No hay turnos disponibles
          </h3>
          <p className="text-gray-400 mb-6">
            No se encontraron horarios para esta semana.
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold mx-auto"
          >
            <RiRefreshLine className="w-4 h-4" />
            Actualizar horarios
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {fechasOrdenadas.map((fecha) => {
            const isPast = isDatePast(fecha);
            const isExpanded = fechasExpandidas[fecha];

            return (
              <div
                key={fecha}
                className={`bg-gradient-to-br backdrop-blur-xl border rounded-2xl transition-all duration-300 ${
                  isPast
                    ? "from-gray-800/20 to-gray-900/20 border-gray-700/30 opacity-60"
                    : "from-gray-800/40 to-gray-900/40 border-gray-700/50"
                }`}
              >
                {/* 🆕 HEADER DESPLEGABLE DEL DÍA */}
                <button
                  onClick={() => toggleFechaExpansion(fecha)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-700/20 transition-colors rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        isPast
                          ? "bg-gray-500/20"
                          : "bg-gradient-to-br from-yellow-400 to-yellow-500"
                      }`}
                    >
                      <RiCalendarLine
                        className={`w-5 h-5 ${
                          isPast ? "text-gray-400" : "text-black"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <h2
                          className={`text-2xl font-bold ${
                            isPast ? "text-gray-400" : "text-yellow-400"
                          }`}
                        >
                          {formatDate(fecha)}
                        </h2>
                        {isPast && (
                          <span className="bg-gray-600/30 text-gray-400 px-2 py-1 rounded-full text-xs font-medium border border-gray-600/30 flex items-center gap-1">
                            <RiEyeOffLine className="w-3 h-3" />
                            Pasado
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {horariosPorDia[fecha].length} turnos{" "}
                        {isPast ? "finalizados" : "disponibles"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <RiArrowDownSLine className="w-6 h-6 text-gray-400" />
                    ) : (
                      <RiArrowRightSLine className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 🆕 CONTENIDO DESPLEGABLE - CALENDARIO COMPACTO CON SCROLL HORIZONTAL */}
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-700/50 pt-6">
                      {/* Contenedor con scroll vertical para los slots */}
                      <div
                        className="overflow-y-auto max-h-[500px] pr-2 space-y-3"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#374151 #1f2937",
                        }}
                      >
                        {generateTimeSlotsForDay(horariosPorDia[fecha]).map(
                          (timeSlot) => {
                            const horariosEnSlot = getHorariosForTimeSlot(
                              horariosPorDia[fecha],
                              timeSlot
                            );

                            // Buscar un horario del slot para obtener la hora de fin
                            const horarioEjemplo =
                              horariosEnSlot.length > 0
                                ? horariosEnSlot[0]
                                : null;

                            return (
                              <div
                                key={timeSlot}
                                className="grid grid-cols-12 gap-4 min-h-[140px]"
                              >
                                {/* Columna de hora - CON ETIQUETAS DE INICIO Y FIN */}
                                <div className="col-span-2">
                                  <div className="h-full flex flex-col items-center justify-center text-gray-300 border border-gray-700/50 rounded-lg bg-gray-800/50 p-2">
                                    {horarioEjemplo ? (
                                      // Si hay horarios en este slot, mostrar inicio y fin específicos
                                      <>
                                        <div className="text-center">
                                          <div className="text-xs text-gray-400 mb-1">
                                            Inicia
                                          </div>
                                          <div className="font-bold text-lg text-yellow-400">
                                            {horarioEjemplo.hora_inicio.substring(
                                              0,
                                              5
                                            )}
                                          </div>
                                        </div>
                                        <div className="w-8 h-px bg-gray-500 my-1"></div>
                                        <div className="text-center">
                                          <div className="text-xs text-gray-400 mb-1">
                                            Termina
                                          </div>
                                          <div className="font-bold text-lg text-blue-400">
                                            {horarioEjemplo.hora_fin.substring(
                                              0,
                                              5
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      // Si no hay horarios, mostrar solo la hora del slot
                                      <div className="text-center">
                                        <div className="text-xs text-gray-500 mb-1">
                                          Horario
                                        </div>
                                        <div className="font-bold text-lg">
                                          {formatTimeSlot(timeSlot)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Columna de contenido con scroll horizontal */}
                                <div className="col-span-10">
                                  <div className="h-full border border-gray-700/30 rounded-lg bg-gray-800/20 p-3">
                                    {horariosEnSlot.length > 0 ? (
                                      <div
                                        className="flex gap-4 overflow-x-auto pb-2 h-full"
                                        style={{
                                          scrollbarWidth: "thin",
                                          scrollbarColor: "#374151 #1f2937",
                                        }}
                                      >
                                        {horariosEnSlot.map((horario) => {
                                          const nivelInfo = getNivelInfo(
                                            horario.nivel
                                          );
                                          const IconoNivel = nivelInfo.icon;

                                          return (
                                            <div
                                              key={horario.id_horario}
                                              className={`min-w-[320px] max-w-[320px] bg-gradient-to-br border rounded-lg p-3 transition-all duration-300 ${
                                                isPast
                                                  ? "from-gray-800/40 to-gray-900/40 border-gray-700/40"
                                                  : "from-gray-700 to-gray-800 border-gray-600 hover:border-yellow-400/50 group hover:shadow-lg hover:shadow-yellow-400/10"
                                              }`}
                                            >
                                              {/* Header compacto - SIN el bloque de horario ya que está en la columna izquierda */}
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 mr-2">
                                                  <h4
                                                    className={`text-lg font-bold mb-2 transition-colors line-clamp-1 ${
                                                      isPast
                                                        ? "text-gray-400"
                                                        : "text-yellow-400 group-hover:text-yellow-300"
                                                    }`}
                                                  >
                                                    {horario.nombre_horario ||
                                                      "Clase sin nombre"}
                                                  </h4>

                                                  {/* Tags de tipo y nivel */}
                                                  <div className="flex items-center gap-1">
                                                    <span
                                                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                                                        isPast
                                                          ? "bg-gray-600/30 text-gray-400"
                                                          : "bg-yellow-500/20 text-yellow-300"
                                                      }`}
                                                    >
                                                      {horario.tipo}
                                                    </span>
                                                    <span
                                                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                                        isPast
                                                          ? "bg-gray-500/30 text-gray-400"
                                                          : `${nivelInfo.bgColor} ${nivelInfo.color}`
                                                      }`}
                                                    >
                                                      <IconoNivel className="w-3 h-3" />
                                                      {nivelInfo.label}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Estado visual */}
                                                <div className="flex items-center">
                                                  <div
                                                    className={`w-3 h-3 rounded-full ${
                                                      isPast
                                                        ? "bg-gray-500"
                                                        : horario.estado ===
                                                          "activo"
                                                        ? "bg-green-400"
                                                        : "bg-red-400"
                                                    }`}
                                                  ></div>
                                                </div>
                                              </div>

                                              {/* Información básica más compacta */}
                                              <div className="space-y-2 mb-3">
                                                {/* Entrenador */}
                                                <div className="flex items-center gap-2">
                                                  <RiUserLine
                                                    className={`w-4 h-4 ${
                                                      isPast
                                                        ? "text-gray-500"
                                                        : "text-blue-400"
                                                    }`}
                                                  />
                                                  <div className="flex-1 min-w-0">
                                                    <span
                                                      className={`text-sm font-medium block truncate ${
                                                        isPast
                                                          ? "text-gray-400"
                                                          : "text-white"
                                                      }`}
                                                    >
                                                      {horario.entrenador
                                                        ? `${
                                                            horario.entrenador
                                                              .nombre
                                                          } ${
                                                            horario.entrenador
                                                              .apellido_p || ""
                                                          }`
                                                        : "Entrenador por asignar"}
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Capacidad */}
                                                <div className="flex items-center gap-2">
                                                  <RiGroupLine
                                                    className={`w-4 h-4 ${
                                                      isPast
                                                        ? "text-gray-500"
                                                        : "text-green-400"
                                                    }`}
                                                  />
                                                  <span
                                                    className={`text-sm ${
                                                      isPast
                                                        ? "text-gray-400"
                                                        : "text-gray-300"
                                                    }`}
                                                  >
                                                    Máximo {horario.capacidad}{" "}
                                                    personas
                                                  </span>
                                                </div>

                                                {/* Músculos trabajados - compacto */}
                                                {horario.rutina &&
                                                  (() => {
                                                    const getPartesMusculo =
                                                      () => {
                                                        if (
                                                          Array.isArray(
                                                            horario.rutina
                                                              .partes_musculo
                                                          )
                                                        ) {
                                                          return horario.rutina
                                                            .partes_musculo;
                                                        }
                                                        if (
                                                          typeof horario.rutina
                                                            .partes_musculo ===
                                                          "string"
                                                        ) {
                                                          try {
                                                            const parsed =
                                                              JSON.parse(
                                                                horario.rutina
                                                                  .partes_musculo
                                                              );
                                                            return Array.isArray(
                                                              parsed
                                                            )
                                                              ? parsed
                                                              : [
                                                                  horario.rutina
                                                                    .partes_musculo,
                                                                ];
                                                          } catch {
                                                            return [
                                                              horario.rutina
                                                                .partes_musculo,
                                                            ];
                                                          }
                                                        }
                                                        return [];
                                                      };

                                                    const partesMusculo =
                                                      getPartesMusculo();

                                                    if (
                                                      partesMusculo.length > 0
                                                    ) {
                                                      return (
                                                        <div className="flex items-start gap-2">
                                                          <GiMuscleUp
                                                            className={`w-4 h-4 mt-0.5 ${
                                                              isPast
                                                                ? "text-gray-500"
                                                                : "text-purple-400"
                                                            }`}
                                                          />
                                                          <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap gap-1">
                                                              {partesMusculo
                                                                .slice(0, 3)
                                                                .map(
                                                                  (
                                                                    musculo,
                                                                    index
                                                                  ) => (
                                                                    <span
                                                                      key={
                                                                        index
                                                                      }
                                                                      className={`px-2 py-1 rounded text-xs ${
                                                                        isPast
                                                                          ? "bg-gray-600/30 text-gray-400"
                                                                          : "bg-purple-500/20 text-purple-300"
                                                                      }`}
                                                                    >
                                                                      {musculo}
                                                                    </span>
                                                                  )
                                                                )}
                                                              {partesMusculo.length >
                                                                3 && (
                                                                <span
                                                                  className={`px-2 py-1 rounded text-xs ${
                                                                    isPast
                                                                      ? "bg-gray-600/30 text-gray-400"
                                                                      : "bg-purple-500/20 text-purple-300"
                                                                  }`}
                                                                >
                                                                  +
                                                                  {partesMusculo.length -
                                                                    3}
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                              </div>

                                              {/* Botón de acción compacto */}
                                              {!isPast &&
                                                horario.estado === "activo" && (
                                                  <button
                                                    onClick={() =>
                                                      handleReservar(horario)
                                                    }
                                                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all duration-300 text-sm ${
                                                      clientType ===
                                                      "powerplate"
                                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                                                        : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg"
                                                    }`}
                                                  >
                                                    {clientType ===
                                                    "powerplate" ? (
                                                      <>
                                                        <RiToolsLine className="w-4 h-4" />
                                                        Ver Equipos
                                                      </>
                                                    ) : (
                                                      <>
                                                        <RiBookmarkLine className="w-4 h-4" />
                                                        Reservar
                                                      </>
                                                    )}
                                                  </button>
                                                )}

                                              {/* Estados no disponibles compactos */}
                                              {isPast && (
                                                <div className="text-center py-2 bg-gray-800/30 rounded-lg">
                                                  <span className="text-xs text-gray-500 italic">
                                                    Finalizado
                                                  </span>
                                                </div>
                                              )}

                                              {horario.estado !== "activo" &&
                                                !isPast && (
                                                  <div className="text-center py-2 bg-red-900/20 rounded-lg border border-red-500/30">
                                                    <span className="text-xs text-red-400 italic">
                                                      No disponible
                                                    </span>
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="h-full flex items-center justify-center">
                                        <span className="text-gray-500 text-sm italic">
                                          Sin turnos en este horario
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🎯 MODAL DE RESERVA PARA CALISTENIA */}
      {showReservaModal && selectedHorario && clientType === "calistenia" && (
        <CrearReservaModalCliente
          isOpen={showReservaModal}
          onClose={handleCloseReservaModal}
          onConfirm={handleConfirmReserva}
          horario={selectedHorario}
        />
      )}

      {/* 🎉 NOTIFICACIÓN DE ÉXITO PARA CALISTENIA */}
      {showSuccessNotification && reservaConfirmada && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-green-500/50 rounded-xl shadow-2xl shadow-green-500/20 p-8 max-w-md mx-4">
            <div className="text-center">
              {/* Icono de éxito */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <RiCheckLine className="w-8 h-8 text-green-400" />
              </div>

              {/* Título */}
              <h3 className="text-2xl font-bold text-white mb-3">
                ¡Reserva Confirmada!
              </h3>

              {/* Mensaje */}
              <p className="text-gray-300 mb-2">
                Tu reserva de calistenia ha sido creada exitosamente
              </p>

              {/* Detalles */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 mb-4 text-left">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Turno:</span>
                    <span className="text-yellow-400 font-medium">
                      {reservaConfirmada.horario?.nombre_horario ||
                        "Clase sin nombre"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Horario:</span>
                    <span className="text-white">
                      {reservaConfirmada.horario?.hora_inicio} -{" "}
                      {reservaConfirmada.horario?.hora_fin}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha:</span>
                    <span className="text-white">
                      {reservaConfirmada.horario?.fecha}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-green-400">Calistenia</span>
                  </div>
                  {/* Mostrar nivel en la confirmación */}
                  {reservaConfirmada.horario?.nivel && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nivel:</span>
                      <span className="text-blue-400 capitalize">
                        {reservaConfirmada.horario.nivel}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje adicional */}
              <p className="text-gray-400 text-sm">
                Tu reserva aparecerá actualizada en la lista
              </p>

              {/* Indicador de progreso */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full"
                    style={{
                      animation: "progress 3s linear forwards",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agregar estos estilos CSS mejorados: */}
      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Estilos para scrollbar vertical */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }

        /* Estilos para scrollbar horizontal */
        .overflow-x-auto::-webkit-scrollbar {
          height: 6px;
        }

        .overflow-x-auto::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }

        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default HorariosTurnoCliente;
