import { useEffect, useState } from "react";
import { horarioService } from "../../../services/horarios";
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
  RiEyeOffLine
} from "react-icons/ri";
import { MdFitnessCenter } from "react-icons/md";
import { GiMuscleUp } from 'react-icons/gi';

const HorariosTurno = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const date = new Date(dateString + 'T23:59:59'); // Final del día
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual
    return date < today;
  };

  // 🔥 FUNCIÓN PARA FILTRAR HORARIOS POR RANGO DE FECHAS
  const filterHorariosByDateRange = (horarios) => {
    const { startDate, endDate } = getValidDateRange();
    
    return horarios.filter(horario => {
      const horarioDate = new Date(horario.fecha + 'T12:00:00');
      const horarioDay = horarioDate.getDay();
      
      // Excluir domingos (día 0)
      if (horarioDay === 0) return false;
      
      // Verificar que esté en el rango de fechas
      return horarioDate >= startDate && horarioDate <= endDate;
    });
  };

  const loadHorariosSemana = async () => {
    try {
      const data = await horarioService.getAllCliente(); // GET con vista_semanal=true
      const allHorarios = Array.isArray(data) ? data : [];
      
      // 🔥 FILTRAR POR RANGO DE FECHAS VÁLIDAS
      const filteredHorarios = filterHorariosByDateRange(allHorarios);
      
      setHorarios(filteredHorarios);
    } catch (error) {
      console.error("Error al cargar horarios semanales:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHorariosSemana();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHorariosSemana();
  };

  // 🔥 FUNCIÓN PARA FORMATEAR FECHA CORRECTAMENTE
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
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
  const fechasOrdenadas = Object.keys(horariosPorDia).sort((a, b) => new Date(a) - new Date(b));

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
  const totalDiasPasados = fechasOrdenadas.filter(fecha => isDatePast(fecha)).length;
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
              </p>
            </div>
          </div>

          {/* Botón de actualizar */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
            >
              <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Turnos</span>
        </div>
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
                <p className="text-lg font-bold text-white">{fechasOrdenadas.length}</p>
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
                <p className="text-lg font-bold text-white">{totalDiasActivos}</p>
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
                <p className="text-lg font-bold text-white">{totalDiasPasados}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {fechasOrdenadas.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl w-fit mx-auto mb-6">
            <RiCalendarLine className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No hay turnos disponibles</h3>
          <p className="text-gray-400 mb-6">No se encontraron horarios para esta semana.</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold mx-auto"
          >
            <RiRefreshLine className="w-4 h-4" />
            Actualizar horarios
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {fechasOrdenadas.map((fecha) => {
            const isPast = isDatePast(fecha);
            
            return (
              <div 
                key={fecha} 
                className={`bg-gradient-to-br backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 ${
                  isPast 
                    ? 'from-gray-800/20 to-gray-900/20 border-gray-700/30 opacity-60' // 🔥 MODO SOMBRA
                    : 'from-gray-800/40 to-gray-900/40 border-gray-700/50'
                }`}
              >
                {/* Header del día */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50">
                  <div className={`p-2 rounded-lg ${
                    isPast 
                      ? 'bg-gray-500/20' // 🔥 ICONO EN MODO SOMBRA
                      : 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                  }`}>
                    <RiCalendarLine className={`w-5 h-5 ${
                      isPast ? 'text-gray-400' : 'text-black'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className={`text-2xl font-bold ${
                        isPast ? 'text-gray-400' : 'text-yellow-400'
                      }`}>
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
                      {horariosPorDia[fecha].length} turnos {isPast ? 'finalizados' : 'disponibles'}
                    </p>
                  </div>
                </div>

                {/* Grid de horarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {horariosPorDia[fecha].map((horario) => (
                    <div
                      key={horario.id_horario}
                      className={`bg-gradient-to-br border rounded-xl p-6 transition-all duration-300 ${
                        isPast
                          ? 'from-gray-800/30 to-gray-900/30 border-gray-700/30 hover:border-gray-600/40' // 🔥 TARJETA EN MODO SOMBRA
                          : 'from-gray-800 to-gray-900 border-gray-700 hover:border-yellow-400/50 group hover:shadow-lg hover:shadow-yellow-400/10'
                      }`}
                    >
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`text-xl font-bold mb-1 transition-colors ${
                            isPast 
                              ? 'text-gray-400' 
                              : 'text-yellow-400 group-hover:text-yellow-300'
                          }`}>
                            {horario.nombre_horario}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                              isPast
                                ? 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {horario.tipo}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {horario.estado === "activo" ? (
                            <RiCheckboxCircleLine className={`w-5 h-5 ${
                              isPast ? 'text-gray-500' : 'text-green-400'
                            }`} />
                          ) : (
                            <RiCloseCircleLine className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      </div>

                      {/* Información principal */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <RiTimeLine className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {horario.hora_inicio} - {horario.hora_fin}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <RiGroupLine className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            Capacidad: <span className={`font-medium ${isPast ? 'text-gray-300' : 'text-white'}`}>
                              {horario.capacidad}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-300">
                          <RiUserLine className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            Entrenador: <span className={`font-medium ${isPast ? 'text-gray-300' : 'text-white'}`}>
                              {horario.entrenador
                                ? `${horario.entrenador.nombre} ${horario.entrenador.apellido_p}`
                                : "Sin asignar"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Información de rutina */}
                      {horario.rutina && (
                        <div className={`border rounded-lg p-3 mb-4 ${
                          isPast 
                            ? 'bg-gray-700/20 border-gray-600/30'
                            : 'bg-gray-700/30 border-gray-600/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <MdFitnessCenter className={`w-4 h-4 ${
                              isPast ? 'text-gray-500' : 'text-yellow-400'
                            }`} />
                            <span className={`text-sm font-medium ${
                              isPast ? 'text-gray-500' : 'text-yellow-400'
                            }`}>
                              Rutina
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <RiBookOpenLine className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-300">
                                {horario.rutina.nombre_ejercicio || "Sin especificar"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Series: <span className={isPast ? 'text-gray-300' : 'text-white'}>
                                {horario.rutina.series || "-"}
                              </span></span>
                              <span>Reps: <span className={isPast ? 'text-gray-300' : 'text-white'}>
                                {horario.rutina.repeticiones || "-"}
                              </span></span>
                            </div>
                            
                            {Array.isArray(horario.rutina.partes_musculo) && horario.rutina.partes_musculo.length > 0 && (
                              <div className="flex items-start gap-2">
                                <GiMuscleUp className="w-3 h-3 text-gray-400 mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                  {horario.rutina.partes_musculo.map((musculo, index) => (
                                    <span
                                      key={index}
                                      className={`px-2 py-0.5 rounded text-xs ${
                                        isPast 
                                          ? 'bg-gray-600/30 text-gray-400'
                                          : 'bg-gray-600/50 text-gray-300'
                                      }`}
                                    >
                                      {musculo}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Descripción */}
                      {horario.descripcion && (
                        <div className="flex items-start gap-2 text-sm">
                          <RiInformationLine className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-400 italic leading-relaxed">
                            {horario.descripcion}
                          </p>
                        </div>
                      )}

                      {/* Estado */}
                      <div className="mt-4 pt-3 border-t border-gray-700/50">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          horario.estado === "activo"
                            ? isPast 
                              ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}>
                          {horario.estado === "activo" ? (
                            <>
                              <RiCheckboxCircleLine className="w-3 h-3" />
                              {isPast ? 'Finalizado' : 'Disponible'}
                            </>
                          ) : (
                            <>
                              <RiCloseCircleLine className="w-3 h-3" />
                              No disponible
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HorariosTurno;