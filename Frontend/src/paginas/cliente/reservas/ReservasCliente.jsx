import React, { useState, useEffect } from "react";
import ReservaService from "../../../services/reservas";
import { getLocalUser } from "../../../services/auth";
import {
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiBookOpenLine,
  RiSettings3Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiInformationLine,
  RiAlertLine,
  RiLoader4Line,
  RiEyeOffLine,
  RiAwardLine,
  RiBarChartLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiFilterLine,
  RiTrophyLine,
  RiSeedlingLine,
  RiStarLine,
} from "react-icons/ri";
import { MdFitnessCenter } from "react-icons/md";
import { GiMuscleUp } from "react-icons/gi";
import CancelarReservaModalCliente from "./modales/CancelarReservaModalCliente";

const ReservasCliente = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modal de cancelación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState(null);

  // Estados para notificación
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  // Estados para fechas expandibles
  const [fechasExpandidas, setFechasExpandidas] = useState({});

  // Estados para filtros simples
  const [filters, setFilters] = useState({
    estado: null,
    tipo: null,
    fecha: null,
  });

  const usuario = getLocalUser();

  // Función para alternar expansión de fechas
  const toggleFechaExpansion = (fecha) => {
    setFechasExpandidas((prev) => ({
      ...prev,
      [fecha]: !prev[fecha],
    }));
  };

  // Función para obtener información del nivel
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

  // Cargar reservas del cliente con filtros
  const cargarReservas = async () => {
    try {
      setError("");
      const response = await ReservaService.obtenerMisReservas();

      if (response.success) {
        let reservasData = response.data.reservas || [];
        
        // Aplicar filtros locales
        if (filters.estado) {
          reservasData = reservasData.filter(r => r.estado === filters.estado);
        }
        if (filters.tipo) {
          reservasData = reservasData.filter(r => r.horario_tipo === filters.tipo);
        }
        if (filters.fecha) {
          reservasData = reservasData.filter(r => r.horario_fecha === filters.fecha);
        }

        setReservas(reservasData);
      } else {
        setError(response.message || "Error al cargar las reservas");
      }
    } catch (error) {
      console.error("Error al cargar reservas:", error);
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  // UseEffect para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarReservas();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Refrescar reservas
  const handleRefresh = async () => {
    setRefreshing(true);
    setFilters({
      estado: null,
      tipo: null,
      fecha: null,
    });
    await cargarReservas();
  };

  // Abrir modal de cancelación
  const handleCancelarReserva = (reserva) => {
    setReservaACancelar(reserva);
    setShowCancelModal(true);
  };

  // Confirmar cancelación
  const confirmarCancelacion = async () => {
    try {
      showSuccessNotification("Reserva cancelada exitosamente");
      await cargarReservas();
    } catch (error) {
      console.error("Error:", error);
      showErrorNotification("Error al actualizar la lista de reservas");
    } finally {
      setShowCancelModal(false);
      setReservaACancelar(null);
    }
  };

  // Cerrar modal de cancelación
  const cerrarModalCancelacion = () => {
    setShowCancelModal(false);
    setReservaACancelar(null);
  };

  // Mostrar notificaciones
  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType("success");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const showErrorNotification = (message) => {
    setNotificationMessage(message);
    setNotificationType("error");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split("-");
    const fechaObj = new Date(year, month - 1, day);
    
    return fechaObj.toLocaleDateString("es-BO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formatear hora
  const formatearHora = (hora) => {
    return hora.slice(0, 5);
  };

  // Verificar si una reserva puede ser cancelada
  const puedeSerCancelada = (reserva) => {
    const fechaParts = reserva.horario_fecha.split('-');
    const fechaReserva = new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]);
    
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    return fechaReserva >= fechaHoy && reserva.estado === "confirmada";
  };

  // Verificar si una reserva ya pasó
  const yaHaPasado = (reserva) => {
    const fechaParts = reserva.horario_fecha.split('-');
    const fechaReserva = new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]);
    
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    return fechaReserva < fechaHoy;
  };

  // Obtener color del estado
  const getEstadoColor = (estado) => {
    const colors = {
      confirmada: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelada: "bg-red-500/20 text-red-400 border-red-500/30",
      pendiente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[estado] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado) => {
    const icons = {
      confirmada: <RiCheckboxCircleLine className="w-4 h-4" />,
      cancelada: <RiCloseCircleLine className="w-4 h-4" />,
      pendiente: <RiAlertLine className="w-4 h-4" />,
    };
    return icons[estado] || <RiInformationLine className="w-4 h-4" />;
  };

  // Formatear nombre completo del entrenador
  const formatearNombreEntrenador = (reserva) => {
    const nombre = reserva.entrenador_nombre || "";
    const apellidoP = reserva.entrenador_apellido_p || "";
    const apellidoM = reserva.entrenador_apellido_m || "";
    
    return `${nombre} ${apellidoP} ${apellidoM}`.trim();
  };

  // Mostrar información de asistencia si existe
  const mostrarAsistencia = (reserva) => {
    if (reserva.asistencia !== null && reserva.asistencia !== undefined) {
      const porcentaje = reserva.asistencia;
      let colorClase = "";
      
      if (porcentaje >= 80) colorClase = "text-green-400";
      else if (porcentaje >= 60) colorClase = "text-yellow-400";
      else colorClase = "text-red-400";
      
      return (
        <div className="flex items-center gap-2 text-gray-300">
          <RiBarChartLine className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            Asistencia: <span className={`font-medium ${colorClase}`}>{porcentaje}%</span>
          </span>
        </div>
      );
    }
    return null;
  };

  // Función para generar slots de tiempo para las reservas de un día
  const generateTimeSlotsForDay = (reservasDia) => {
    const slots = new Set();

    // Agregar TODOS los slots basados en las reservas reales del día
    reservasDia.forEach((reserva) => {
      const horaInicio = reserva.horario_hora_inicio.substring(0, 5); // "10:30", "13:00", etc.
      slots.add(horaInicio);
    });

    // Si no hay reservas, no mostrar slots
    if (slots.size === 0) {
      return [];
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

  // Función para encontrar reservas en un slot específico
  const getReservasForTimeSlot = (reservasDia, timeSlot) => {
    return reservasDia.filter((reserva) => {
      const horaInicio = reserva.horario_hora_inicio.substring(0, 5); // "10:30", "13:00"
      return horaInicio === timeSlot;
    });
  };

  // Agrupar reservas por fecha
  const reservasPorFecha = reservas.reduce((acc, reserva) => {
    const fecha = reserva.horario_fecha;
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(reserva);
    return acc;
  }, {});

  // Ordenar fechas cronológicamente (más antigua primero)
  const fechasOrdenadas = Object.keys(reservasPorFecha).sort((a, b) => {
    const fechaPartsA = a.split('-');
    const fechaPartsB = b.split('-');
    const fechaA = new Date(fechaPartsA[0], fechaPartsA[1] - 1, fechaPartsA[2]);
    const fechaB = new Date(fechaPartsB[0], fechaPartsB[1] - 1, fechaPartsB[2]);
    
    return fechaA - fechaB; // Cambié el orden: fechaA - fechaB para orden cronológico ascendente
  });

  if (loading) {
    return (
      <div className="relative z-10 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Cargando tus reservas...</p>
          </div>
        </div>
      </div>
    );
  }

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
                Mis Reservas
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Gestiona tus entrenamientos programados
                <span className="ml-2 text-yellow-400 font-medium">
                  ({usuario?.categoria || "Cliente"})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Mis Reservas</span>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
            <RiFilterLine className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white">Filtros de Búsqueda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filters.estado || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  estado: e.target.value || null,
                }))
              }
              className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
            >
              <option value="">Todos los estados</option>
              <option value="confirmada">Confirmadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Filtro por fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fecha específica
            </label>
            <input
              type="date"
              value={filters.fecha || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  fecha: e.target.value || null,
                }))
              }
              className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20"
            />
          </div>
        </div>

        {/* Mostrar filtros activos */}
        {Object.values(filters).some((filter) => filter !== null && filter !== "") && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>

              {filters.estado && (
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                  Estado: {filters.estado}
                </span>
              )}

              {filters.tipo && (
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                  Tipo: {filters.tipo}
                </span>
              )}

              {filters.fecha && (
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                  Fecha: {filters.fecha.split("-").reverse().join("/")}
                </span>
              )}

              <button
                onClick={() => {
                  setFilters({ estado: null, tipo: null, fecha: null });
                }}
                className="text-gray-400 hover:text-red-400 text-sm ml-2 hover:underline transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-500/10 border-red-500 text-red-400">
          <div className="flex items-center gap-3">
            <RiCloseCircleLine className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Estadísticas de reservas */}
      {reservas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <RiCalendarLine className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Total</p>
                <p className="text-lg font-bold text-white">
                  {reservas.length}
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
                <p className="text-xs text-gray-400 uppercase">Confirmadas</p>
                <p className="text-lg font-bold text-white">
                  {reservas.filter((r) => r.estado === "confirmada").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <RiCloseCircleLine className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Canceladas</p>
                <p className="text-lg font-bold text-white">
                  {reservas.filter((r) => r.estado === "cancelada").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MdFitnessCenter className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Próximas</p>
                <p className="text-lg font-bold text-white">
                  {
                    reservas.filter(
                      (r) => !yaHaPasado(r) && r.estado === "confirmada"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal con diseño expandible */}
      {reservas.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl w-fit mx-auto mb-6">
            <RiCalendarLine className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            No tienes reservas
          </h3>
          <p className="text-gray-400 mb-6">
            No se encontraron reservas en tu cuenta.
          </p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold mx-auto"
          >
            <RiRefreshLine className="w-4 h-4" />
            Actualizar reservas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {fechasOrdenadas.map((fecha) => {
            const reservasDia = reservasPorFecha[fecha];
            const esPasado = yaHaPasado({ horario_fecha: fecha });
            const isExpanded = fechasExpandidas[fecha];

            return (
              <div
                key={fecha}
                className={`bg-gradient-to-br backdrop-blur-xl border rounded-2xl transition-all duration-300 ${
                  esPasado
                    ? "from-gray-800/20 to-gray-900/20 border-gray-700/30 opacity-60"
                    : "from-gray-800/40 to-gray-900/40 border-gray-700/50"
                }`}
              >
                {/* Header desplegable del día */}
                <button
                  onClick={() => toggleFechaExpansion(fecha)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-700/20 transition-colors rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        esPasado
                          ? "bg-gray-500/20"
                          : "bg-gradient-to-br from-yellow-400 to-yellow-500"
                      }`}
                    >
                      <RiCalendarLine
                        className={`w-5 h-5 ${
                          esPasado ? "text-gray-400" : "text-black"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <h2
                          className={`text-2xl font-bold ${
                            esPasado ? "text-gray-400" : "text-yellow-400"
                          }`}
                        >
                          {formatearFecha(fecha)}
                        </h2>
                        {esPasado && (
                          <span className="bg-gray-600/30 text-gray-400 px-2 py-1 rounded-full text-xs font-medium border border-gray-600/30 flex items-center gap-1">
                            <RiEyeOffLine className="w-3 h-3" />
                            Pasado
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        {reservasDia.length} reserva
                        {reservasDia.length !== 1 ? "s" : ""}
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

                {/* Contenido desplegable */}
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
                        {generateTimeSlotsForDay(reservasDia).map((timeSlot) => {
                          const reservasEnSlot = getReservasForTimeSlot(
                            reservasDia,
                            timeSlot
                          );

                          // Buscar una reserva del slot para obtener la hora de fin
                          const reservaEjemplo =
                            reservasEnSlot.length > 0 ? reservasEnSlot[0] : null;

                          return (
                            <div
                              key={timeSlot}
                              className="grid grid-cols-12 gap-4 min-h-[140px]"
                            >
                              {/* Columna de hora */}
                              <div className="col-span-2">
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 border border-gray-700/50 rounded-lg bg-gray-800/50 p-2">
                                  {reservaEjemplo ? (
                                    <>
                                      <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">
                                          Inicia
                                        </div>
                                        <div className="font-bold text-lg text-yellow-400">
                                          {formatearHora(reservaEjemplo.horario_hora_inicio)}
                                        </div>
                                      </div>
                                      <div className="w-8 h-px bg-gray-500 my-1"></div>
                                      <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">
                                          Termina
                                        </div>
                                        <div className="font-bold text-lg text-blue-400">
                                          {formatearHora(reservaEjemplo.horario_hora_fin)}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">
                                        Sin reservas
                                      </div>
                                      <div className="font-bold text-lg text-gray-400">
                                        {timeSlot}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Columna de contenido con scroll horizontal */}
                              <div className="col-span-10">
                                <div className="h-full border border-gray-700/30 rounded-lg bg-gray-800/20 p-3">
                                  {reservasEnSlot.length > 0 ? (
                                    <div
                                      className="flex gap-4 overflow-x-auto pb-2 h-full"
                                      style={{
                                        scrollbarWidth: "thin",
                                        scrollbarColor: "#374151 #1f2937",
                                      }}
                                    >
                                      {reservasEnSlot.map((reserva) => {
                                        const nivelInfo = getNivelInfo(
                                          reserva.horario_nivel
                                        );
                                        const IconoNivel = nivelInfo.icon;

                                        return (
                                          <div
                                            key={reserva.id_reserva}
                                            className={`min-w-[280px] max-w-[280px] rounded-xl p-4 transition-all duration-300 relative ${
                                              esPasado
                                                ? "bg-gray-800/40 border border-gray-700/40"
                                                : "bg-gray-800/60 border border-gray-700/60 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-400/10"
                                            }`}
                                          >
                                            {/* Estado indicator (punto verde) */}
                                            <div className="absolute top-4 right-4">
                                              <div
                                                className={`w-3 h-3 rounded-full ${
                                                  esPasado
                                                    ? "bg-gray-500"
                                                    : reserva.estado === "confirmada"
                                                    ? "bg-green-400"
                                                    : reserva.estado === "cancelada"
                                                    ? "bg-red-400"
                                                    : "bg-yellow-400"
                                                }`}
                                              ></div>
                                            </div>

                                            {/* Título principal */}
                                            <div className="mb-4">
                                              <h3
                                                className={`text-xl font-bold mb-2 pr-6 ${
                                                  esPasado ? "text-gray-400" : "text-yellow-400"
                                                }`}
                                              >
                                                {reserva.horario_nombre || `Reserva #${reserva.id_reserva}`}
                                              </h3>
                                              
                                              {/* Tags de tipo y nivel */}
                                              <div className="flex items-center gap-2 mb-3">
                                                <span
                                                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                                                    esPasado
                                                      ? "bg-gray-600/30 text-gray-400"
                                                      : reserva.horario_tipo === "powerplate"
                                                      ? "bg-blue-500/20 text-blue-400"
                                                      : "bg-green-500/20 text-green-400"
                                                  }`}
                                                >
                                                  {reserva.horario_tipo}
                                                </span>
                                                
                                                {reserva.horario_nivel && (
                                                  <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize flex items-center gap-1 ${
                                                      esPasado 
                                                        ? "bg-gray-600/30 text-gray-400" 
                                                        : nivelInfo.bgColor + " " + nivelInfo.color
                                                    }`}
                                                  >
                                                    <IconoNivel className="w-3 h-3" />
                                                    {nivelInfo.label}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {/* Información del entrenador */}
                                            <div className="mb-3">
                                              <div className="flex items-center gap-2 mb-1">
                                                <RiUserLine className={`w-4 h-4 ${esPasado ? "text-gray-500" : "text-blue-400"}`} />
                                                <span className={`text-xs ${esPasado ? "text-gray-500" : "text-gray-400"}`}>
                                                  Entrenador:
                                                </span>
                                              </div>
                                              <span className={`text-sm font-medium ${esPasado ? "text-gray-400" : "text-white"}`}>
                                                {formatearNombreEntrenador(reserva)}
                                              </span>
                                            </div>

                                            {/* Músculos trabajados - compacto */}
                                            {reserva.rutina_partes_musculo &&
                                              Array.isArray(reserva.rutina_partes_musculo) &&
                                              reserva.rutina_partes_musculo.length > 0 && (
                                                <div className="mb-4">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <GiMuscleUp className={`w-4 h-4 ${esPasado ? "text-gray-500" : "text-yellow-400"}`} />
                                                    <span className={`text-sm font-medium ${esPasado ? "text-gray-500" : "text-yellow-400"}`}>
                                                      Músculos
                                                    </span>
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {reserva.rutina_partes_musculo.slice(0, 4).map((musculo, index) => (
                                                      <span
                                                        key={index}
                                                        className={`px-2 py-1 rounded text-xs ${
                                                          esPasado
                                                            ? "bg-gray-600/30 text-gray-400"
                                                            : "bg-purple-500/20 text-purple-300"
                                                        }`}
                                                      >
                                                        {musculo}
                                                      </span>
                                                    ))}
                                                    {reserva.rutina_partes_musculo.length > 4 && (
                                                      <span className={`px-2 py-1 rounded text-xs ${esPasado ? "bg-gray-600/30 text-gray-400" : "bg-purple-500/20 text-purple-300"}`}>
                                                        +{reserva.rutina_partes_musculo.length - 4}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                            {/* Botón de acción */}
                                            {puedeSerCancelada(reserva) ? (
                                              <button
                                                onClick={() => handleCancelarReserva(reserva)}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all duration-300"
                                              >
                                                <RiDeleteBinLine className="w-4 h-4" />
                                                Cancelar Reserva
                                              </button>
                                            ) : esPasado ? (
                                              <div className="text-center py-3 bg-gray-700/30 rounded-lg">
                                                <span className="text-sm text-gray-500 font-medium">Finalizado</span>
                                              </div>
                                            ) : reserva.estado === "cancelada" ? (
                                              <div className="text-center py-3 bg-red-900/20 rounded-lg border border-red-500/30">
                                                <span className="text-sm text-red-400 font-medium">Cancelada</span>
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <span className="text-gray-500 text-sm italic">
                                        Sin reservas en este horario
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}



      {/* Modal de confirmación de cancelación */}
      {showCancelModal && reservaACancelar && (
        <CancelarReservaModalCliente
          isOpen={showCancelModal}
          onClose={cerrarModalCancelacion}
          onConfirm={confirmarCancelacion}
          reserva={reservaACancelar}
        />
      )}

      {/* Notificación */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div
            className={`border-2 rounded-xl shadow-2xl p-8 max-w-md mx-4 ${
              notificationType === "success"
                ? "bg-gray-900 border-green-500/50 shadow-green-500/20"
                : "bg-gray-900 border-red-500/50 shadow-red-500/20"
            }`}
          >
            <div className="text-center">
              <div
                className={`mx-auto flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  notificationType === "success"
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                }`}
              >
                {notificationType === "success" ? (
                  <RiCheckboxCircleLine className="w-8 h-8 text-green-400" />
                ) : (
                  <RiCloseCircleLine className="w-8 h-8 text-red-400" />
                )}
              </div>

              <h3
                className={`text-xl font-bold mb-3 ${
                  notificationType === "success" ? "text-white" : "text-white"
                }`}
              >
                {notificationType === "success" ? "¡Éxito!" : "Error"}
              </h3>

              <p className="text-gray-300 mb-4">{notificationMessage}</p>

              <div className="mt-4">
                <div
                  className={`w-full rounded-full h-1 ${
                    notificationType === "success"
                      ? "bg-gray-700"
                      : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`h-1 rounded-full ${
                      notificationType === "success"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
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

      {/* Estilos para la animación y scrollbars */}
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

export default ReservasCliente;