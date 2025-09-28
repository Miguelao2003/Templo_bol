import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiUserLine,
  RiCalendarLine,
  RiTimeLine,
  RiSettings3Line,
  RiAddCircleLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCheckLine,
  RiRefreshLine,
  RiInformationLine,
  RiBookOpenLine,
  RiAwardLine,
  RiBarChartLine,
} from "react-icons/ri";
import { MdFitnessCenter } from "react-icons/md";
import { GiMuscleUp } from "react-icons/gi";
import ReservaService from "../../../../services/reservas";
import { equipoService } from "../../../../services/equipos";
import { getLocalUser } from "../../../../services/auth";

const CrearReservaModalCliente = ({ isOpen, onClose, onConfirm, horario }) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    id_usuario: "",
    id_horario: "",
    id_equipo: "", // Para powerplate
    comentarios: "",
  });

  // Estados para equipos (solo powerplate)
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Usuario actual
  const [usuario, setUsuario] = useState(null);

  // Obtener usuario actual y configurar formulario
  useEffect(() => {
    if (isOpen && horario) {
      const currentUser = getLocalUser();
      setUsuario(currentUser);

      // Configurar datos iniciales del formulario
      setFormData({
        id_usuario: currentUser?.id_usuario || "",
        id_horario: horario.id_horario || "",
        id_equipo: horario.equipoSeleccionado?.id_equipo || "", // Pre-seleccionar equipo si viene
        comentarios: "",
      });

      // Si es powerplate y no hay equipo pre-seleccionado, cargar equipos disponibles
      if (horario.tipo === "powerplate" && !horario.equipoSeleccionado) {
        cargarEquiposDisponibles();
      } else if (horario.equipoSeleccionado) {
        // Si hay equipo pre-seleccionado, configurarlo en la lista
        setEquiposDisponibles([horario.equipoSeleccionado]);
      }

      // Limpiar errores
      setError("");
    }
  }, [isOpen, horario]);

  // Cargar equipos disponibles para powerplate
  const cargarEquiposDisponibles = async () => {
    if (!horario) return;

    setLoadingEquipos(true);
    setError("");

    try {
      console.log("Cargando equipos para horario:", horario);

      // Obtener todos los equipos disponibles
      const equiposData = await equipoService.getAll();
      console.log("Equipos obtenidos:", equiposData);

      // Filtrar equipos activos (no en mantenimiento)
      const equiposActivos = equiposData.filter(
        (equipo) => equipo.estado === "activo"
      );
      console.log("Equipos activos:", equiposActivos);
      setEquiposDisponibles(equiposActivos);
    } catch (error) {
      console.error("Error al cargar equipos:", error);
      setError("Error al cargar los equipos disponibles");
      setEquiposDisponibles([]);
    } finally {
      setLoadingEquipos(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_usuario: usuario?.id_usuario || "",
      id_horario: horario?.id_horario || "",
      id_equipo: "",
      comentarios: "",
    });
    setEquiposDisponibles([]);
    setError("");
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.id_usuario) {
      setError("Error: Usuario no identificado");
      return false;
    }
    if (!formData.id_horario) {
      setError("Error: Horario no seleccionado");
      return false;
    }
    if (horario?.tipo === "powerplate" && !formData.id_equipo) {
      setError("Debe seleccionar un equipo para sesiones de powerplate");
      return false;
    }
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setLoading(true);
    setError("");

    try {
      const reservaData = {
        id_usuario: parseInt(formData.id_usuario),
        id_horario: parseInt(formData.id_horario),
        ...(formData.id_equipo && { id_equipo: parseInt(formData.id_equipo) }),
        ...(formData.comentarios && { comentarios: formData.comentarios }),
      };

      console.log("Enviando datos de reserva:", reservaData);

      const response = await ReservaService.crearReserva(reservaData);
      console.log("Respuesta del servicio:", response);

      if (response.success) {
        // Llamar a onConfirm con los datos de la reserva
        onConfirm(reservaData);
      } else {
        console.log("Error del servicio:", response.message);
        const mensajeError = obtenerMensajeError(response.message);
        console.log("Mensaje de error personalizado:", mensajeError);
        setError(mensajeError);
      }
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Error response:", error.response);

      let mensajeError = "Error al crear la reserva";

      // Intentar obtener el mensaje de error del backend
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      const mensajePersonalizado = obtenerMensajeError(mensajeError);
      setError(mensajePersonalizado);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener mensaje de error personalizado
  const obtenerMensajeError = (errorMessage) => {
    const mensajesError = {
      "El horario no existe": "❌ El horario seleccionado no existe",
      "No se puede reservar en un horario inactivo":
        "❌ Este horario no está disponible para reservas",
      "Las reservas de powerplate requieren un equipo":
        "❌ Debes seleccionar un equipo para sesiones de powerplate",
      "El equipo especificado no existe o no está activo":
        "❌ El equipo seleccionado no está disponible",
      "El equipo ya está reservado en este horario":
        "❌ El equipo ya está reservado en este horario. Por favor, selecciona otro equipo.",
      "Las reservas de calistenia no deben incluir equipo":
        "❌ Las sesiones de calistenia no requieren equipo",
      "El horario ha alcanzado su capacidad máxima":
        "⚠️ Este horario ya está completo. No hay cupos disponibles.",
      "Ya tienes una reserva confirmada para este horario":
        "⚠️ Ya tienes una reserva confirmada para este horario.",
      "Tu categoría es powerplate pero intentas reservar un horario de calistenia":
        "❌ Tu categoría no coincide con el tipo de horario seleccionado",
      "Tu categoría es calistenia pero intentas reservar un horario de powerplate":
        "❌ Tu categoría no coincide con el tipo de horario seleccionado",
    };

    for (const [errorKey, mensajePersonalizado] of Object.entries(
      mensajesError
    )) {
      if (errorMessage.includes(errorKey)) {
        return mensajePersonalizado;
      }
    }

    return errorMessage;
  };

  // Obtener información del nivel
  const getNivelInfo = (nivel) => {
    const niveles = {
      principiante: {
        color: "text-green-400",
        bg: "bg-green-500/20 border-green-500/30",
        texto: "Principiante",
        descripcion: "Ideal para quienes se inician en el entrenamiento",
      },
      intermedio: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/20 border-yellow-500/30",
        texto: "Intermedio",
        descripcion: "Para personas con experiencia previa en entrenamiento",
      },
      avanzado: {
        color: "text-red-400",
        bg: "bg-red-500/20 border-red-500/30",
        texto: "Avanzado",
        descripcion: "Dirigido a atletas y personas muy experimentadas",
      },
    };
    return (
      niveles[nivel] || {
        color: "text-gray-400",
        bg: "bg-gray-500/20 border-gray-500/30",
        texto: nivel,
        descripcion: "Nivel no especificado",
      }
    );
  };

  // Formatear nombre completo del entrenador
  const formatearNombreEntrenador = (entrenador) => {
    if (!entrenador) return "Sin asignar";
    const nombre = entrenador.nombre || "";
    const apellidoP = entrenador.apellido_p || "";
    const apellidoM = entrenador.apellido_m || "";
    return `${nombre} ${apellidoP} ${apellidoM}`.trim();
  };

  // Parsear arrays JSON de manera segura
  const parseJsonArray = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Formatear fecha para mostrar - CORREGIDO
  const formatearFecha = (fecha) => {
    // Si la fecha viene como string YYYY-MM-DD, parsearlo correctamente
    let fechaObj;

    if (typeof fecha === "string") {
      // Para fechas en formato YYYY-MM-DD, crear la fecha sin problemas de zona horaria
      const [year, month, day] = fecha.split("-").map(Number);
      fechaObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-indexado
    } else {
      fechaObj = new Date(fecha);
    }

    return fechaObj.toLocaleDateString("es-ES", {
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

  // Cerrar modal y resetear
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !horario) return null;

  const isPowerplate = horario.tipo === "powerplate";
  const nivelInfo = getNivelInfo(horario.nivel);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-2">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl shadow-2xl shadow-yellow-500/20 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Compacto */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${
                isPowerplate ? "bg-yellow-500" : "bg-yellow-500"
              }`}
            >
              <RiAddCircleLine className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h2
                className={`text-xl font-bold ${
                  isPowerplate ? "text-yellow-400" : "text-yellow-400"
                }`}
              >
                Confirmar Reserva
              </h2>
              <p className="text-xs text-gray-400">
                {horario.nombre_horario ||
                  `Sesión de ${isPowerplate ? "PowerPlate" : "Calistenia"}`}
                {horario.nivel && (
                  <span className={`ml-2 ${nivelInfo.color}`}>
                    • {nivelInfo.texto}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4">
            {/* Error general */}
            {error && (
              <div className="mb-4 p-3 rounded-lg border-l-4 bg-red-500/10 border-red-500 text-red-400">
                <div className="flex items-center gap-2">
                  <RiErrorWarningLine className="w-4 h-4" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna 1 - Información básica */}
              <div className="space-y-4">
                {/* Tu información - Compacto */}
                <div className="space-y-3">
                  <h3
                    className={`text-base font-semibold border-b pb-2 ${
                      isPowerplate
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    <RiUserLine className="inline h-4 w-4 mr-2" />
                    Tu Información
                  </h3>

                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="text-white font-medium">
                          {usuario?.nombre} {usuario?.apellido_p}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Categoría:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${
                            isPowerplate
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}
                        >
                          {usuario?.categoria}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles del turno - Compacto */}
                <div className="space-y-3">
                  <h3
                    className={`text-base font-semibold border-b pb-2 ${
                      isPowerplate
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    <RiCalendarLine className="inline h-4 w-4 mr-2" />
                    Detalles del Turno
                  </h3>

                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horario:</span>
                      <span className="text-white font-medium">
                        {horario.nombre_horario || "Entrenamiento"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-white font-medium">
                        {formatearFecha(horario.fecha)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hora:</span>
                      <span className="text-white font-medium">
                        {formatearHora(horario.hora_inicio)} -{" "}
                        {formatearHora(horario.hora_fin)}
                      </span>
                    </div>
                    {horario.nivel && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Nivel:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${nivelInfo.bg} ${nivelInfo.color}`}
                        >
                          {nivelInfo.texto}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entrenador:</span>
                      <span className="text-white font-medium">
                        {formatearNombreEntrenador(horario.entrenador)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capacidad:</span>
                      <span className="text-white font-medium">
                        {horario.capacidad} personas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comentarios - Compacto */}
                <div className="space-y-3">
                  <h3
                    className={`text-base font-semibold border-b pb-2 ${
                      isPowerplate
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    <RiInformationLine className="inline h-4 w-4 mr-2" />
                    Comentarios (Opcional)
                  </h3>

                  <textarea
                    value={formData.comentarios}
                    onChange={(e) =>
                      handleInputChange("comentarios", e.target.value)
                    }
                    rows={3}
                    placeholder="Comentarios opcionales..."
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all resize-none placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {/* Columna 2 - Rutina */}
              {horario.rutina && (
                <div className="space-y-4">
                  <h3
                    className={`text-base font-semibold border-b pb-2 ${
                      isPowerplate
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    <MdFitnessCenter className="inline h-4 w-4 mr-2" />
                    Rutina del Turno
                  </h3>

                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 space-y-3">
                    {/* Ejercicios compactos */}
                    {(() => {
                      let ejercicios = [];
                      let series = [];
                      let repeticiones = [];

                      // Parsear ejercicios (mismo código que antes pero más compacto)
                      try {
                        if (
                          typeof horario.rutina.nombre_ejercicio === "string"
                        ) {
                          if (horario.rutina.nombre_ejercicio.startsWith("[")) {
                            ejercicios = JSON.parse(
                              horario.rutina.nombre_ejercicio
                            );
                          } else {
                            ejercicios = [horario.rutina.nombre_ejercicio];
                          }
                        } else if (
                          Array.isArray(horario.rutina.nombre_ejercicio)
                        ) {
                          ejercicios = horario.rutina.nombre_ejercicio;
                        }
                      } catch (e) {
                        if (horario.rutina.nombre_ejercicio) {
                          ejercicios = [horario.rutina.nombre_ejercicio];
                        }
                      }

                      // Parsear series y repeticiones (compacto)
                      try {
                        if (horario.rutina.series) {
                          series =
                            typeof horario.rutina.series === "string"
                              ? JSON.parse(horario.rutina.series)
                              : Array.isArray(horario.rutina.series)
                              ? horario.rutina.series
                              : [horario.rutina.series];
                        }
                      } catch (e) {
                        series = horario.rutina.series
                          ? [horario.rutina.series]
                          : [];
                      }

                      try {
                        if (horario.rutina.repeticiones) {
                          repeticiones =
                            typeof horario.rutina.repeticiones === "string"
                              ? JSON.parse(horario.rutina.repeticiones)
                              : Array.isArray(horario.rutina.repeticiones)
                              ? horario.rutina.repeticiones
                              : [horario.rutina.repeticiones];
                        }
                      } catch (e) {
                        repeticiones = horario.rutina.repeticiones
                          ? [horario.rutina.repeticiones]
                          : [];
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MdFitnessCenter className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">
                              Ejercicios ({ejercicios.length})
                            </span>
                          </div>

                          {/* Lista compacta de ejercicios */}
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {ejercicios.map((ejercicio, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-700/30 rounded p-2 border border-gray-600/30"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-blue-500/20 text-blue-400 w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-100">
                                    {ejercicio}
                                  </span>
                                </div>
                                {(series[index] || repeticiones[index]) && (
                                  <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                                    {series[index] && (
                                      <span className="text-blue-300">
                                        {series[index]}s
                                      </span>
                                    )}
                                    {series[index] && repeticiones[index] && (
                                      <span className="text-gray-500"> × </span>
                                    )}
                                    {repeticiones[index] && (
                                      <span className="text-green-300">
                                        {repeticiones[index]}r
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Músculos trabajados - compacto */}
                          {horario.rutina.partes_musculo &&
                            parseJsonArray(horario.rutina.partes_musculo)
                              .length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <GiMuscleUp className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm font-medium text-yellow-400">
                                    Músculos
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {parseJsonArray(
                                    horario.rutina.partes_musculo
                                  ).map((musculo, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                    >
                                      {musculo}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Columna 3 - Equipos (powerplate) o Info adicional (calistenia) */}
              <div className="space-y-4">
                {isPowerplate ? (
                  // Equipos para powerplate
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                      <RiSettings3Line className="inline h-4 w-4 mr-2" />
                      {horario.equipoSeleccionado
                        ? "Equipo Seleccionado"
                        : "Seleccionar Equipo *"}
                    </h3>

                    {loadingEquipos ? (
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6 text-center text-gray-400">
                        <RiLoader4Line className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <span className="text-sm">Cargando equipos...</span>
                      </div>
                    ) : equiposDisponibles.length === 0 ? (
                      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6 text-center text-gray-400">
                        <RiSettings3Line className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <p className="text-sm mb-3">
                          No hay equipos disponibles
                        </p>
                        <button
                          type="button"
                          onClick={cargarEquiposDisponibles}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Intentar recargar
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                        <div className="space-y-2">
                          {equiposDisponibles.map((equipo) => (
                            <div
                              key={equipo.id_equipo}
                              className={`flex items-center p-3 border rounded transition-all ${
                                horario.equipoSeleccionado
                                  ? "border-blue-500/50 bg-blue-500/10"
                                  : "border-gray-600 hover:bg-gray-700/50 cursor-pointer"
                              }`}
                            >
                              {horario.equipoSeleccionado ? (
                                <>
                                  <RiCheckLine className="w-4 h-4 text-blue-400 mr-3" />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-blue-100">
                                      {equipo.nombre_equipo}
                                    </div>
                                    <div className="text-xs text-blue-300">
                                      Seleccionado
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <label className="flex items-center w-full cursor-pointer">
                                  <input
                                    type="radio"
                                    name="equipo"
                                    value={equipo.id_equipo}
                                    checked={
                                      formData.id_equipo ===
                                      equipo.id_equipo.toString()
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        "id_equipo",
                                        e.target.value
                                      )
                                    }
                                    className="h-4 w-4 text-blue-500"
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="text-sm font-medium text-gray-100">
                                      {equipo.nombre_equipo}
                                    </div>
                                    <div className="text-xs text-green-400">
                                      Disponible
                                    </div>
                                  </div>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Información para calistenia
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <RiInformationLine className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="text-sm text-green-300">
                          <p className="font-medium mb-2">
                            Sesión de Calistenia
                          </p>
                          <ul className="text-xs text-green-200 space-y-1">
                            <li>• Entrena con tu peso corporal</li>
                            <li>• Desarrollo de fuerza funcional</li>
                            <li>• Mejora de flexibilidad</li>
                            <li>• Supervisión personalizada</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Nivel info compacto */}
                    {horario.nivel && (
                      <div className={`border rounded-lg p-3 ${nivelInfo.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <RiAwardLine
                            className={`w-4 h-4 ${nivelInfo.color}`}
                          />
                          <span
                            className={`text-sm font-medium ${nivelInfo.color}`}
                          >
                            Nivel {nivelInfo.texto}
                          </span>
                        </div>
                        <p
                          className={`text-xs ${nivelInfo.color} opacity-90 mb-2`}
                        >
                          {nivelInfo.descripcion}
                        </p>

                        <div
                          className={`text-xs ${nivelInfo.color} opacity-80`}
                        >
                          <p className="font-medium mb-1">Recomendaciones:</p>
                          {horario.nivel === "principiante" && (
                            <ul className="space-y-0.5">
                              <li>• Enfócate en la técnica</li>
                              <li>• No te presiones por intensidad</li>
                            </ul>
                          )}
                          {horario.nivel === "intermedio" && (
                            <ul className="space-y-0.5">
                              <li>• Mantén ritmo constante</li>
                              <li>• Calidad de movimiento</li>
                            </ul>
                          )}
                          {horario.nivel === "avanzado" && (
                            <ul className="space-y-0.5">
                              <li>• Máxima intensidad</li>
                              <li>• Control en movimientos complejos</li>
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Botones de acción - Fijos en la parte inferior */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (isPowerplate && !formData.id_equipo)}
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm ${
              isPowerplate
                ? "bg-blue-500 hover:bg-blue-400 text-white"
                : "bg-yellow-500 hover:bg-yellow-400 text-gray-900"
            }`}
          >
            {loading ? (
              <>
                <RiLoader4Line className="w-4 h-4 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <RiAddCircleLine className="w-4 h-4" />
                <span>Confirmar Reserva</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearReservaModalCliente;
