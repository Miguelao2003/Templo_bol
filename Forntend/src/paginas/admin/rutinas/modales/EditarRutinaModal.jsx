import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiEditLine,
  RiRunLine,
  RiBodyScanLine,
  RiRepeatLine,
  RiFunctionLine,
  RiInformationLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiListCheck2,
  RiUserLine,
  RiShieldUserLine,
  RiArrowDownSLine,
  RiLoader4Line,
  RiSearchLine,
  RiCheckLine,
  RiAddLine,
} from "react-icons/ri";
import { userService } from "../../../../services/usuarios";

// Componente selector de entrenadores con búsqueda (CORREGIDO)
const EntrenadorSelector = ({ entrenadores, loading, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEntrenadores = entrenadores.filter((entrenador) =>
    `${entrenador.nombre} ${entrenador.apellido_p}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // CORREGIDO: Manejar correctamente valores null/undefined
  const handleSelect = (entrenadorId) => {
    const valor = entrenadorId === "" ? null : entrenadorId;
    console.log("🔘 Seleccionando entrenador ID:", valor);

    const simulatedEvent = {
      target: {
        value: valor,
      },
    };

    onChange(simulatedEvent);
    setIsOpen(false);
    setSearchTerm("");
  };

  const selectedEntrenador = entrenadores.find((e) => e.id_usuario === value);

  const displayText = selectedEntrenador
    ? `${selectedEntrenador.nombre} ${selectedEntrenador.apellido_p}`
    : "Sin asignar (Administrador)";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 text-left focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all flex items-center justify-between"
      >
        <span
          className={selectedEntrenador ? "text-gray-100" : "text-gray-400"}
        >
          {displayText}
        </span>
        <div className="flex items-center space-x-2">
          {loading && (
            <RiLoader4Line className="h-4 w-4 text-yellow-400 animate-spin" />
          )}
          <RiArrowDownSLine
            className={`h-5 w-5 text-yellow-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar entrenador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-100 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-60">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                value === null
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "text-gray-300"
              }`}
            >
              <span>Sin asignar (Administrador)</span>
              {value === null && <RiCheckLine className="h-4 w-4" />}
            </button>

            {loading ? (
              <div className="px-4 py-6 text-center text-gray-400">
                <RiLoader4Line className="h-5 w-5 animate-spin mx-auto mb-2" />
                Cargando entrenadores...
              </div>
            ) : filteredEntrenadores.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">
                {searchTerm
                  ? "No se encontraron entrenadores"
                  : "No hay entrenadores disponibles"}
              </div>
            ) : (
              filteredEntrenadores.map((entrenador) => (
                <button
                  key={entrenador.id_usuario}
                  type="button"
                  onClick={() => handleSelect(entrenador.id_usuario)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    value === entrenador.id_usuario
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      {entrenador.nombre} {entrenador.apellido_p}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entrenador.email}
                    </div>
                  </div>
                  {value === entrenador.id_usuario && (
                    <RiCheckLine className="h-4 w-4" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

const EditarRutinaModal = ({ isOpen, onClose, onSave, rutina }) => {
  // Estado local para manejar la rutina editada
  const [rutinaEditada, setRutinaEditada] = useState({
    nombres_ejercicios: [],
    series: [],
    repeticiones: [],
    partes_musculo: [],
    id_entrenador: null,
  });

  // Estado para el ejercicio que se está editando o agregando
  const [ejercicioActual, setEjercicioActual] = useState({
    nombre_ejercicio: "",
    series: "",
    repeticiones: "",
    partes_musculo: "",
  });

  // Estados específicos para administrador
  const [entrenadores, setEntrenadores] = useState([]);
  const [loadingEntrenadores, setLoadingEntrenadores] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const PARTES_MUSCULO = [
    { value: "pecho", label: "Pecho", color: "bg-red-500/20 text-red-400" },
    { value: "bicep", label: "Bícep", color: "bg-blue-500/20 text-blue-400" },
    {
      value: "tricep",
      label: "Trícep",
      color: "bg-green-500/20 text-green-400",
    },
    {
      value: "espalda",
      label: "Espalda",
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      value: "hombro",
      label: "Hombros",
      color: "bg-pink-500/20 text-pink-400",
    },
    {
      value: "pierna",
      label: "Piernas",
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      value: "abdomen",
      label: "Abdomen",
      color: "bg-cyan-500/20 text-cyan-400",
    },
  ];

  // Cargar entrenadores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadEntrenadores();
    }
  }, [isOpen]);

  // CORREGIDO: Inicialización correcta
  useEffect(() => {
    if (isOpen && rutina) {
      console.log("🔄 Rutina recibida para editar:", rutina);

      // Determinar el ID del entrenador correctamente
      let idEntrenador = null;
      if (rutina.id_entrenador !== undefined && rutina.id_entrenador !== null) {
        idEntrenador = parseInt(rutina.id_entrenador);
      } else if (rutina.entrenador?.id_usuario) {
        idEntrenador = parseInt(rutina.entrenador.id_usuario);
      } else if (rutina.entrenador?.id) {
        idEntrenador = parseInt(rutina.entrenador.id);
      } else if (rutina.id_usuario) {
        idEntrenador = parseInt(rutina.id_usuario);
      }

      console.log("🔧 id_entrenador inicializado:", idEntrenador);

      setRutinaEditada({
        nombres_ejercicios: rutina.nombres_ejercicios || [],
        series: rutina.series || [],
        repeticiones: rutina.repeticiones || [],
        partes_musculo: rutina.partes_musculo || [],
        id_entrenador: idEntrenador,
      });

      setModoEdicion(null);
      setEjercicioActual({
        nombre_ejercicio: "",
        series: "",
        repeticiones: "",
        partes_musculo: "",
      });
    }
  }, [isOpen, rutina]);

  const loadEntrenadores = async () => {
    setLoadingEntrenadores(true);
    try {
      const entrenadoresData = await userService.getEntrenadores();
      setEntrenadores(entrenadoresData || []);
    } catch (error) {
      console.error("Error cargando entrenadores:", error);
      setMensaje("Error al cargar la lista de entrenadores");
      setEntrenadores([]);
    } finally {
      setLoadingEntrenadores(false);
    }
  };

  // Manejar cambios en el formulario de ejercicio
  const handleEjercicioChange = (e) => {
    const { name, value } = e.target;
    setEjercicioActual((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CORREGIDO: Manejo correcto de cambios de entrenador
  const handleEntrenadorChange = (e) => {
    const valor = e.target.value;
    console.log("👤 Cambiando entrenador a:", valor);

    // Debug detallado
    console.log("🔍 Debug valor:", {
      rawValue: valor,
      type: typeof valor,
      parsed: parseInt(valor),
      isNaN: isNaN(parseInt(valor)),
    });

    // Manejar correctamente el valor
    let nuevoValor;
    if (valor === null || valor === undefined || valor === "") {
      nuevoValor = null;
    } else {
      const parsed = parseInt(valor);
      nuevoValor = isNaN(parsed) ? null : parsed;
    }

    console.log("👤 Valor procesado:", nuevoValor);

    setRutinaEditada((prev) => ({
      ...prev,
      id_entrenador: nuevoValor,
    }));
  };

  // Iniciar edición de un ejercicio existente
  const iniciarEdicionEjercicio = (index) => {
    setModoEdicion(index);
    setEjercicioActual({
      nombre_ejercicio: rutinaEditada.nombres_ejercicios[index] || "",
      series: rutinaEditada.series[index]?.toString() || "",
      repeticiones: rutinaEditada.repeticiones[index]?.toString() || "",
      partes_musculo: rutinaEditada.partes_musculo[index] || "",
    });
  };

  // Guardar cambios en un ejercicio
  const guardarEjercicio = () => {
    if (!validarEjercicio()) return;

    const nuevaRutina = { ...rutinaEditada };

    if (modoEdicion === "agregar") {
      nuevaRutina.nombres_ejercicios.push(
        ejercicioActual.nombre_ejercicio.trim()
      );
      nuevaRutina.series.push(parseInt(ejercicioActual.series));
      nuevaRutina.repeticiones.push(parseInt(ejercicioActual.repeticiones));
      nuevaRutina.partes_musculo.push(ejercicioActual.partes_musculo);
    } else if (typeof modoEdicion === "number") {
      nuevaRutina.nombres_ejercicios[modoEdicion] =
        ejercicioActual.nombre_ejercicio.trim();
      nuevaRutina.series[modoEdicion] = parseInt(ejercicioActual.series);
      nuevaRutina.repeticiones[modoEdicion] = parseInt(
        ejercicioActual.repeticiones
      );
      nuevaRutina.partes_musculo[modoEdicion] = ejercicioActual.partes_musculo;
    }

    setRutinaEditada(nuevaRutina);
    cancelarEdicion();
    setMensaje("Ejercicio guardado correctamente");
    setTimeout(() => setMensaje(""), 3000);
  };

  // Eliminar ejercicio
  const eliminarEjercicio = (index) => {
    const nuevaRutina = {
      nombres_ejercicios: rutinaEditada.nombres_ejercicios.filter(
        (_, i) => i !== index
      ),
      series: rutinaEditada.series.filter((_, i) => i !== index),
      repeticiones: rutinaEditada.repeticiones.filter((_, i) => i !== index),
      partes_musculo: rutinaEditada.partes_musculo.filter(
        (_, i) => i !== index
      ),
      id_entrenador: rutinaEditada.id_entrenador,
    };
    setRutinaEditada(nuevaRutina);
    if (modoEdicion === index) {
      cancelarEdicion();
    }
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setModoEdicion(null);
    setEjercicioActual({
      nombre_ejercicio: "",
      series: "",
      repeticiones: "",
      partes_musculo: "",
    });
  };

  // Validar ejercicio actual
  const validarEjercicio = () => {
    if (!ejercicioActual.nombre_ejercicio.trim()) {
      setMensaje("El nombre del ejercicio es requerido");
      return false;
    }
    if (!ejercicioActual.series || ejercicioActual.series <= 0) {
      setMensaje("Las series deben ser un número positivo");
      return false;
    }
    if (!ejercicioActual.repeticiones || ejercicioActual.repeticiones <= 0) {
      setMensaje("Las repeticiones deben ser un número positivo");
      return false;
    }
    if (!ejercicioActual.partes_musculo) {
      setMensaje("Debe seleccionar una parte muscular");
      return false;
    }
    return true;
  };

  // CORREGIDO: Guardar rutina con validación
  const guardarRutina = async () => {
    if (rutinaEditada.nombres_ejercicios.length === 0) {
      setMensaje("La rutina debe tener al menos un ejercicio");
      return;
    }

    // Validar que id_entrenador sea válido
    if (
      rutinaEditada.id_entrenador !== null &&
      (isNaN(rutinaEditada.id_entrenador) ||
        rutinaEditada.id_entrenador === undefined)
    ) {
      console.error(
        "❌ ERROR: id_entrenador inválido:",
        rutinaEditada.id_entrenador
      );
      setMensaje("Error: ID de entrenador inválido");
      return;
    }

    // Preparar datos limpios para enviar
    const datosParaEnviar = {
      nombres_ejercicios: rutinaEditada.nombres_ejercicios,
      series: rutinaEditada.series,
      repeticiones: rutinaEditada.repeticiones,
      partes_musculo: rutinaEditada.partes_musculo,
      id_entrenador: rutinaEditada.id_entrenador,
    };

    console.log("💾 Guardando rutina con datos:", datosParaEnviar);
    console.log(
      "🎯 ID entrenador que se enviará:",
      datosParaEnviar.id_entrenador
    );

    setIsLoading(true);
    try {
      await onSave(datosParaEnviar);
      onClose();
    } catch (error) {
      setMensaje("Error al guardar la rutina: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMusculoLabel = (value) => {
    const musculo = PARTES_MUSCULO.find((m) => m.value === value);
    return musculo ? musculo.label : value;
  };

  const getMusculoColor = (value) => {
    const musculo = PARTES_MUSCULO.find((m) => m.value === value);
    return musculo ? musculo.color : "bg-gray-500/20 text-gray-400";
  };

  const getEntrenadorNombre = () => {
    if (
      rutinaEditada.id_entrenador === null ||
      rutinaEditada.id_entrenador === undefined
    ) {
      return "Administrador (sin asignar)";
    }
    const entrenador = entrenadores.find(
      (e) => e.id_usuario === rutinaEditada.id_entrenador
    );
    return entrenador
      ? `${entrenador.nombre} ${entrenador.apellido_p}`
      : `Entrenador ID: ${rutinaEditada.id_entrenador}`;
  };

  if (!isOpen || !rutina) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-7xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiEditLine className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Editar Rutina (Administrador)
              </h2>
              <p className="text-gray-400 text-sm">
                ID: {rutina.id_rutina} •{" "}
                {rutinaEditada.nombres_ejercicios.length} ejercicios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel izquierdo: Configuración */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Configuración
            </h3>

            {/* Reasignación de entrenador */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <RiUserLine className="inline h-4 w-4 mr-2" />
                Reasignar Entrenador
              </label>
              <EntrenadorSelector
                entrenadores={entrenadores}
                loading={loadingEntrenadores}
                value={rutinaEditada.id_entrenador}
                onChange={handleEntrenadorChange}
              />
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <RiInformationLine className="h-3 w-3 mr-1" />
                Cambiar asignación de la rutina
              </p>
            </div>

            {/* Resumen */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-400 mb-2">
                Resumen
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Asignada a:</span>
                  <span className="text-yellow-400">
                    {getEntrenadorNombre()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ejercicios:</span>
                  <span className="text-yellow-400">
                    {rutinaEditada.nombres_ejercicios.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Músculos:</span>
                  <span className="text-yellow-400">
                    {new Set(rutinaEditada.partes_musculo).size}
                  </span>
                </div>
              </div>

              {/* Mostrar información de cambio de asignación si es diferente */}
              {rutina &&
                rutina.entrenador &&
                (() => {
                  const idOriginal =
                    rutina.id_entrenador ||
                    rutina.entrenador.id_usuario ||
                    rutina.entrenador.id;
                  const hayDiferencia =
                    rutinaEditada.id_entrenador !== idOriginal;

                  if (hayDiferencia) {
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-xs text-blue-400 font-medium mb-1">
                          Cambio de asignación:
                        </p>
                        <p className="text-xs text-gray-400">
                          Desde: {rutina.entrenador.nombre}{" "}
                          {rutina.entrenador.apellido_p}
                        </p>
                        <p className="text-xs text-gray-400">
                          Hacia: {getEntrenadorNombre()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
            </div>
          </div>
          {/* Panel central: Lista de ejercicios */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                Ejercicios en la Rutina
              </h3>
              <button
                onClick={() => setModoEdicion("agregar")}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
              >
                <RiAddLine className="h-4 w-4" />
                Agregar
              </button>
            </div>

            {rutinaEditada.nombres_ejercicios.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <RiInformationLine className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">
                  No hay ejercicios en esta rutina
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rutinaEditada.nombres_ejercicios.map((nombre, index) => (
                  <div
                    key={index}
                    className={`bg-gray-800 border rounded-lg p-4 ${
                      modoEdicion === index
                        ? "border-yellow-500"
                        : "border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-100 mb-2">
                          {nombre}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                          <span className="flex items-center">
                            <RiFunctionLine className="h-3 w-3 mr-1" />
                            {rutinaEditada.repeticiones[index]} reps
                          </span>
                          <span className="flex items-center">
                            <RiRepeatLine className="h-3 w-3 mr-1" />
                            {rutinaEditada.series[index]} series
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMusculoColor(
                            rutinaEditada.partes_musculo[index]
                          )} border-opacity-30`}
                        >
                          {getMusculoLabel(rutinaEditada.partes_musculo[index])}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => iniciarEdicionEjercicio(index)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarEjercicio(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho: Formulario de edición */}
          <div className="space-y-6">
            {modoEdicion !== null ? (
              <>
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                  {modoEdicion === "agregar"
                    ? "Agregar Ejercicio"
                    : `Editando Ejercicio ${modoEdicion + 1}`}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <RiRunLine className="inline h-4 w-4 mr-2" />
                      Nombre del ejercicio *
                    </label>
                    <input
                      type="text"
                      name="nombre_ejercicio"
                      value={ejercicioActual.nombre_ejercicio}
                      onChange={handleEjercicioChange}
                      placeholder="Ej: Dominadas comando"
                      className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <RiBodyScanLine className="inline h-4 w-4 mr-2" />
                      Parte muscular *
                    </label>
                    <select
                      value={ejercicioActual.partes_musculo}
                      onChange={(e) =>
                        setEjercicioActual((prev) => ({
                          ...prev,
                          partes_musculo: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    >
                      <option value="">Seleccionar músculo</option>
                      {PARTES_MUSCULO.map((musculo) => (
                        <option key={musculo.value} value={musculo.value}>
                          {musculo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <RiFunctionLine className="inline h-4 w-4 mr-2" />
                        Repeticiones *
                      </label>
                      <input
                        type="number"
                        name="repeticiones"
                        value={ejercicioActual.repeticiones}
                        onChange={handleEjercicioChange}
                        min="1"
                        max="100"
                        placeholder="12"
                        className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <RiRepeatLine className="inline h-4 w-4 mr-2" />
                        Series *
                      </label>
                      <input
                        type="number"
                        name="series"
                        value={ejercicioActual.series}
                        onChange={handleEjercicioChange}
                        min="1"
                        max="20"
                        placeholder="3"
                        className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={guardarEjercicio}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      {modoEdicion === "agregar" ? "Agregar" : "Guardar"}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <RiListCheck2 className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">
                  Selecciona un ejercicio para editarlo
                </p>
                <p className="text-sm text-gray-500">
                  O agrega un nuevo ejercicio a la rutina
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div
            className={`mt-4 p-3 rounded-lg border ${
              mensaje.includes("Error") ||
              mensaje.includes("requerido") ||
              mensaje.includes("debe")
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-green-500/10 border-green-500/30 text-green-400"
            }`}
          >
            <RiInformationLine className="inline h-4 w-4 mr-2" />
            {mensaje}
          </div>
        )}

        {/* Información adicional para administrador */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <RiShieldUserLine className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-400 font-medium mb-1">
                Privilegios de Administrador
              </p>
              <p className="text-xs text-gray-300">
                Los cambios en esta rutina afectarán todos los horarios y
                entrenamientos que la utilicen. Los clientes verán la rutina
                actualizada en sus próximas sesiones.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarRutina}
            disabled={
              rutinaEditada.nombres_ejercicios.length === 0 ||
              isLoading ||
              modoEdicion !== null
            }
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center space-x-2 ${
              rutinaEditada.nombres_ejercicios.length > 0 &&
              !isLoading &&
              modoEdicion === null
                ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-yellow-500/25 hover:shadow-yellow-500/40"
                : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <RiSaveLine className="h-4 w-4" />
            <span>
              {isLoading
                ? "Guardando..."
                : `Guardar Rutina (${rutinaEditada.nombres_ejercicios.length} ejercicios)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarRutinaModal;
