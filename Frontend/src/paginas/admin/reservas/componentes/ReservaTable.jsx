import React, { useState } from "react";
import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiRefreshLine,
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiSettings3Line,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiAlertLine,
} from "react-icons/ri";

const ReservaTable = ({
  reservas,
  permisos,
  usuario,
  onCancelar,
  onRefresh,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Función para formatear hora
  const formatearHora = (hora) => {
    return hora.slice(0, 5); // Quita los segundos (HH:MM)
  };

  // Función para formatear fecha y hora de reserva
  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return (
      fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      " " +
      fecha.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Función para obtener el color del badge de estado
  const getEstadoColor = (estado) => {
    const colors = {
      confirmada: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelada: "bg-red-500/20 text-red-400 border-red-500/30",
      completada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pendiente: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return colors[estado] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Función para obtener el color del tipo de horario
  const getTipoColor = (tipo) => {
    const colors = {
      powerplate: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      calistenia: "bg-green-500/20 text-green-400 border-green-500/30",
      personal: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      grupal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    };
    return colors[tipo] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  // Función para manejar ordenamiento
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Ordenar reservas
  const reservasOrdenadas = React.useMemo(() => {
    if (!sortConfig.key) return reservas;

    return [...reservas].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejar fechas
      if (
        sortConfig.key === "horario_fecha" ||
        sortConfig.key === "fecha_reserva"
      ) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Manejar strings
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [reservas, sortConfig]);

  // Función para verificar si un horario ya pasó (se puede marcar asistencia)
  const puedeMarcarAsistenciaPorFecha = (horarioFecha, horaFin) => {
    const ahora = new Date();
    const fechaHoraFin = new Date(`${horarioFecha}T${horaFin}`);

    // Solo se puede marcar asistencia después de que termine el horario
    return fechaHoraFin <= ahora;
  };

  // Función para verificar si una reserva está próxima (dentro de 2 horas)
  const esReservaProxima = (horarioFecha, horaInicio) => {
    const ahora = new Date();
    const fechaHoraReserva = new Date(`${horarioFecha}T${horaInicio}`);
    const diferencia = fechaHoraReserva - ahora;
    const dosHorasEnMs = 2 * 60 * 60 * 1000;

    return diferencia > 0 && diferencia <= dosHorasEnMs;
  };

  // Función para verificar si un horario es futuro
  const esHorarioFuturo = (horarioFecha, horaInicio) => {
    const ahora = new Date();
    const fechaHoraReserva = new Date(`${horarioFecha}T${horaInicio}`);

    return fechaHoraReserva > ahora;
  };

  // Componente de header de tabla con ordenamiento
  const TableHeader = ({ label, sortKey, className = "", icon: Icon }) => (
    <th
      className={`px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-all duration-200 ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="w-4 h-4 text-yellow-400" />}
        <span>{label}</span>
        {sortConfig.key === sortKey &&
          (sortConfig.direction === "asc" ? (
            <RiArrowUpLine className="w-4 h-4 text-yellow-400" />
          ) : (
            <RiArrowDownLine className="w-4 h-4 text-yellow-400" />
          ))}
      </div>
    </th>
  );

  if (reservas.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
        <div className="text-gray-500 mb-6">
          <RiCalendarLine className="mx-auto h-16 w-16 text-gray-600" />
        </div>
        <h3 className="text-xl font-medium text-white mb-3">No hay reservas</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {usuario.rol === "administrador"
            ? "No se han encontrado reservas en el sistema con los filtros aplicados."
            : "No tienes reservas registradas. Crea tu primera reserva para comenzar."}
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-yellow-500/25"
        >
          <RiRefreshLine className="w-4 h-4" />
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-800/50 border-b border-gray-700">
            <tr>
              <TableHeader label="ID" sortKey="id_reserva" />
              <TableHeader
                label="Cliente"
                sortKey="usuario_nombre"
                icon={RiUserLine}
              />
              <TableHeader
                label="Fecha Sesión"
                sortKey="horario_fecha"
                icon={RiCalendarLine}
              />
              <TableHeader
                label="Horario"
                sortKey="horario_hora_inicio"
                icon={RiTimeLine}
              />
              <TableHeader
                label="Entrenador"
                sortKey="entrenador_nombre"
                icon={RiUserLine}
              />
              <TableHeader label="Rutina" sortKey="rutina_nombre" />
              <TableHeader
                label="Equipo"
                sortKey="equipo_nombre"
                icon={RiSettings3Line}
              />
              <TableHeader label="Estado" sortKey="estado" />
              <TableHeader
                label="Fecha Reserva"
                sortKey="fecha_reserva"
                icon={RiTimeLine}
              />
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {reservasOrdenadas.map((reserva) => {
              const proximaReserva = esReservaProxima(
                reserva.horario_fecha,
                reserva.horario_hora_inicio
              );
              const puedeMarcarAsistencia = puedeMarcarAsistenciaPorFecha(
                reserva.horario_fecha,
                reserva.horario_hora_fin
              );
              const esFuturo = esHorarioFuturo(
                reserva.horario_fecha,
                reserva.horario_hora_inicio
              );

              return (
                <tr
                  key={reserva.id_reserva}
                  className={`hover:bg-gray-700/30 transition-all duration-200 ${
                    proximaReserva
                      ? "bg-yellow-500/10 border-l-4 border-yellow-400"
                      : ""
                  }`}
                >
                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        #{reserva.id_reserva}
                      </span>
                      {proximaReserva && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          <RiAlertLine className="w-3 h-3 mr-1" />
                          Próxima
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {reserva.usuario_nombre} {reserva.usuario_apellido_p}
                    </div>
                    {reserva.usuario_apellido_m && (
                      <div className="text-sm text-gray-400">
                        {reserva.usuario_apellido_m}
                      </div>
                    )}
                    {/* Debug: Mostrar usuario_id */}
                    <div className="text-xs text-gray-500">
                      ID: {reserva.usuario_id}
                    </div>
                  </td>

                  {/* Fecha de Sesión */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <RiCalendarLine className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-100">
                        {formatearFecha(reserva.horario_fecha)}
                      </span>
                    </div>
                  </td>

                  {/* Horario */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RiTimeLine className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-100">
                          {formatearHora(reserva.horario_hora_inicio)} -{" "}
                          {formatearHora(reserva.horario_hora_fin)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTipoColor(
                          reserva.horario_tipo
                        )}`}
                      >
                        {reserva.horario_tipo}
                      </span>
                    </div>
                  </td>

                  {/* Entrenador */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {reserva.entrenador_nombre}{" "}
                      {reserva.entrenador_apellido_p}
                    </div>
                    {reserva.entrenador_apellido_m && (
                      <div className="text-sm text-gray-400">
                        {reserva.entrenador_apellido_m}
                      </div>
                    )}
                  </td>

                  {/* Rutina */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-white truncate">
                      </div>
                      {reserva.rutina_partes_musculo &&
                        reserva.rutina_partes_musculo.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reserva.rutina_partes_musculo
                              .slice(0, 2)
                              .map((parte, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600"
                                >
                                  {parte.replace("_", " ")}
                                </span>
                              ))}
                            {reserva.rutina_partes_musculo.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{reserva.rutina_partes_musculo.length - 2} más
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  </td>

                  {/* Equipo */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 max-w-xs">
                      {reserva.equipo_nombre && (
                        <RiSettings3Line className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-100 truncate">
                        {reserva.equipo_nombre || "Sin equipo"}
                      </span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(
                        reserva.estado
                      )}`}
                    >
                      {reserva.estado === "confirmada" && (
                        <RiCheckLine className="w-3 h-3 mr-1" />
                      )}
                      {reserva.estado === "cancelada" && (
                        <RiCloseLine className="w-3 h-3 mr-1" />
                      )}
                      {reserva.estado.charAt(0).toUpperCase() +
                        reserva.estado.slice(1)}
                    </span>
                    {/* Debug: Mostrar valor de asistencia */}
                    {reserva.asistencia && (
                      <div className="text-xs text-gray-500 mt-1">
                        Asist: {reserva.asistencia}%
                      </div>
                    )}
                  </td>

                  {/* Fecha de Reserva */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <RiTimeLine className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {formatearFechaHora(reserva.fecha_reserva)}
                      </span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end items-center space-x-2">
                      {/* Marcar Asistencia */}
                      {permisos.puedeMarcarAsistencia(reserva) &&
                        reserva.estado === "confirmada" && (
                          <div>
                            {reserva.asistencia && reserva.asistencia > 0 ? (
                              // Ya tiene asistencia marcada
                              <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-medium border border-green-500/30">
                                <RiCheckLine className="w-3 h-3" />
                                Asistencia {reserva.asistencia}%
                              </span>
                            ) : puedeMarcarAsistencia ? (
                              // Botón para marcar asistencia (horario ya pasó)
                              <button
                                onClick={() =>
                                  handleMarcarAsistenciaDirecta(reserva)
                                }
                                className="inline-flex items-center gap-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-xs transition-all duration-200 font-medium border border-blue-500/30 hover:border-blue-400"
                                title="Marcar asistencia"
                              >
                                <RiCheckLine className="w-3 h-3" />
                                Marcar Asistencia
                              </button>
                            ) : esFuturo ? (
                              // Horario futuro - no se puede marcar aún
                              <span
                                className="inline-flex items-center gap-1 bg-gray-500/20 text-gray-400 px-3 py-1 rounded-lg text-xs font-medium border border-gray-500/30"
                                title="No se puede marcar asistencia en horarios futuros"
                              >
                                <RiTimeLine className="w-3 h-3" />
                                Horario Futuro
                              </span>
                            ) : (
                              // Horario en curso - esperar a que termine
                              <span
                                className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-xs font-medium border border-yellow-500/30"
                                title="Esperar a que termine el horario para marcar asistencia"
                              >
                                <RiTimeLine className="w-3 h-3" />
                                En Curso
                              </span>
                            )}
                          </div>
                        )}

                      {/* Cancelar Reserva */}
                      {permisos.puedeCancelar(reserva) &&
                        reserva.estado === "confirmada" && (
                          <button
                            onClick={() => onCancelar(reserva)}
                            className="inline-flex items-center gap-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-xs transition-all duration-200 border border-red-500/30 hover:border-red-400"
                            title="Cancelar reserva"
                          >
                            <RiCloseLine className="w-3 h-3" />
                            Cancelar
                          </button>
                        )}

                      {/* Ver Comentarios */}
                      {reserva.comentarios && (
                        <button
                          className="inline-flex items-center gap-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-2 py-1 rounded-lg text-xs transition-all duration-200 border border-gray-500/30 hover:border-gray-400"
                          title={reserva.comentarios}
                        >
                          <RiEyeLine className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con información adicional */}
      <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-sm text-gray-400">
          Mostrando{" "}
          <span className="text-yellow-400 font-medium">
            {reservasOrdenadas.length}
          </span>{" "}
          reserva{reservasOrdenadas.length !== 1 ? "s" : ""}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-400">Próximas (2h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Confirmadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <span className="text-gray-400">Canceladas</span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium"
          >
            <RiRefreshLine className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservaTable;
