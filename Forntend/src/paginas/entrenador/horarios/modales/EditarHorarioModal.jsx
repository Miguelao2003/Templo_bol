import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiCalendarLine,
  RiTimeLine,
  RiUserLine,
  RiFileTextLine,
  RiSaveLine,
  RiShieldCheckLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiEditLine,
  RiGroupLine,
  RiLockLine,
  RiTrophyLine,
  RiRefreshLine
} from "react-icons/ri";
import { rutinaService } from "../../../../services/rutinas";
import { getCurrentUser } from "../../../../services/auth";
import { useNotification } from "../../../../hooks/useNotification";

const EditarHorarioModal = ({ isOpen, onClose, onSave, horario, onChange, isEntrenadorView = false }) => {
  const [rutinasDisponibles, setRutinasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRutinas, setLoadingRutinas] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalNotification, setModalNotification] = useState(null);
  const [rutinaActual, setRutinaActual] = useState(null);
  const { showNotification } = useNotification();

  // Mapeo de categorías a tipos de entrenamiento
  const categoriaToTipo = {
    "calistenia": "calistenia",
    "powerplate": "powerplate"
  };

  // Opciones para los selects
  const tiposEntrenamiento = [
    { value: "powerplate", label: "PowerPlate" },
    { value: "calistenia", label: "Calistenia" }
  ];

  // Opciones de nivel
  const nivelesEntrenamiento = [
    { value: "principiante", label: "Principiante", color: "text-green-400", description: "Para personas que inician" },
    { value: "intermedio", label: "Intermedio", color: "text-orange-400", description: "Con experiencia básica" },
    { value: "avanzado", label: "Avanzado", color: "text-red-400", description: "Para atletas experimentados" }
  ];

  // Cargar usuario actual cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCurrentUser();
    }
  }, [isOpen]);

  // Verificar que el tipo coincida con la categoría del entrenador
  useEffect(() => {
    if (currentUser && isOpen && isEntrenadorView) {
      const tipoEntrenamiento = categoriaToTipo[currentUser.categoria];
      if (tipoEntrenamiento && tipoEntrenamiento !== horario.tipo) {
        onChange({ target: { name: 'tipo', value: tipoEntrenamiento } });
      }
    }
  }, [currentUser, isOpen, isEntrenadorView]);

  // Cargar rutinas del entrenador cuando cambie el tipo o se abra el modal
  useEffect(() => {
    if (isOpen && currentUser && horario.tipo && isEntrenadorView) {
      loadRutinasEntrenador();
    }
  }, [horario.tipo, isOpen, currentUser, isEntrenadorView]);

  // Nuevo efecto para cargar información de la rutina actual - ACTUALIZADO
  useEffect(() => {
    const rutinaId = horario.id_rutina || horario.rutina?.id_rutina;
    
    if (isOpen && rutinaId && currentUser) {
      loadRutinaActual(rutinaId);
    } else {
      setRutinaActual(null);
    }
  }, [isOpen, horario.id_rutina, horario.rutina?.id_rutina, currentUser]);

  // Nuevo efecto para sincronizar id_rutina cuando hay rutina anidada
  useEffect(() => {
    if (isOpen && !horario.id_rutina && horario.rutina?.id_rutina) {
      // Si no hay id_rutina en el nivel superior pero sí en rutina anidada, sincronizar
      console.log("🔄 Sincronizando id_rutina desde rutina anidada:", horario.rutina.id_rutina);
      onChange({ target: { name: 'id_rutina', value: horario.rutina.id_rutina } });
    }
  }, [isOpen, horario.id_rutina, horario.rutina?.id_rutina]);

  const loadCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      console.log("👤 Usuario actual cargado:", userData);
      console.log("🏷️ Categoría del entrenador:", userData.categoria);
    } catch (error) {
      console.log("Error cargando usuario actual:", error);
    }
  };

  const showModalNotification = (type, message) => {
    setModalNotification({ type, message });
    setTimeout(() => setModalNotification(null), 5000);
  };

  // Nueva función para cargar la rutina actual - MEJORADA
  const loadRutinaActual = async (rutinaId = null) => {
    const idRutina = rutinaId || horario.id_rutina || horario.rutina?.id_rutina;
    
    if (!idRutina || !currentUser) {
      console.log("❌ No se puede cargar rutina - faltan datos:", { 
        idRutina, 
        currentUser: !!currentUser,
        horario_id_rutina: horario.id_rutina,
        horario_rutina_id: horario.rutina?.id_rutina
      });
      return;
    }
    
    console.log("🔍 Intentando cargar rutina ID:", idRutina);
    
    // Si ya tenemos la rutina completa en horario.rutina, usarla directamente
    if (horario.rutina && horario.rutina.id_rutina === parseInt(idRutina)) {
      console.log("✅ Usando rutina ya cargada del horario:", horario.rutina);
      setRutinaActual(horario.rutina);
      return;
    }
    
    try {
      let rutina = null;
      
      // Método 1: Intentar obtener rutina específica por ID
      if (rutinaService.getRutinaById) {
        try {
          rutina = await rutinaService.getRutinaById(idRutina);
          console.log("✅ Rutina cargada por ID:", rutina);
        } catch (error) {
          console.log("⚠️ getRutinaById falló, intentando método alternativo:", error.message);
        }
      }
      
      // Método 2: Si no se pudo cargar por ID, buscar en las rutinas del entrenador
      if (!rutina && currentUser?.id_usuario) {
        try {
          console.log("🔍 Buscando en rutinas del entrenador...");
          const rutinas = await rutinaService.getRutinasByEntrenador(currentUser.id_usuario);
          rutina = rutinas.find(r => r.id_rutina === parseInt(idRutina));
          console.log("🔍 Rutinas del entrenador:", rutinas);
          console.log("✅ Rutina encontrada en lista:", rutina);
        } catch (err) {
          console.log("❌ Error buscando en rutinas del entrenador:", err);
        }
      }
      
      // Método 3: Si aún no se encuentra, intentar cargar todas las rutinas disponibles
      if (!rutina) {
        try {
          console.log("🔍 Último intento: buscando en todas las rutinas...");
          const todasRutinas = await rutinaService.getAll();
          rutina = todasRutinas.find(r => r.id_rutina === parseInt(idRutina));
          console.log("🔍 Búsqueda en todas las rutinas, encontrada:", rutina);
        } catch (err) {
          console.log("❌ Error en búsqueda general:", err);
        }
      }
      
      setRutinaActual(rutina);
      
      if (rutina) {
        console.log("✅ Rutina actual establecida:", rutina);
      } else {
        console.log("❌ No se pudo encontrar la rutina con ID:", idRutina);
      }
      
    } catch (error) {
      console.error("❌ Error general cargando rutina actual:", error);
      setRutinaActual(null);
    }
  };

  const loadRutinasEntrenador = async () => {
    if (!currentUser?.id_usuario) return;
    
    try {
      setLoadingRutinas(true);
      const rutinas = await rutinaService.getRutinasByEntrenador(currentUser.id_usuario);
      
      const rutinasFiltradas = rutinas || [];
      setRutinasDisponibles(rutinasFiltradas);
      
      console.log(`📋 Rutinas del entrenador cargadas para edición (${horario.tipo}):`, rutinasFiltradas);
      
    } catch (error) {
      console.log("Error cargando rutinas del entrenador:", error);
      setRutinasDisponibles([]);
      showModalNotification("error", "Error al cargar tus rutinas");
    } finally {
      setLoadingRutinas(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!horario.nombre_horario.trim()) {
      showModalNotification("error", "El nombre del horario es obligatorio");
      return;
    }
    
    if (!horario.fecha) {
      showModalNotification("error", "La fecha es obligatoria");
      return;
    }
    
    if (!horario.hora_inicio || !horario.hora_fin) {
      showModalNotification("error", "Las horas de inicio y fin son obligatorias");
      return;
    }
    
    if (horario.hora_inicio >= horario.hora_fin) {
      showModalNotification("error", "La hora de inicio debe ser menor que la hora de fin");
      return;
    }

    if (!horario.capacidad || horario.capacidad < 1) {
      showModalNotification("error", "La capacidad debe ser al menos 1 persona");
      return;
    }

    if (!horario.nivel) {
      showModalNotification("error", "Debes seleccionar un nivel de dificultad");
      return;
    }

    setLoading(true);
    try {
      await onSave();
      showModalNotification("success", "Horario actualizado exitosamente");
      setTimeout(() => {
        resetModal();
      }, 1500);
    } catch (error) {
      console.error("❌ Error al actualizar horario:", error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail || 
                          error.response?.data?.error ||
                          error.message || 
                          "Error al actualizar el horario";
      
      showModalNotification("error", `Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setRutinasDisponibles([]);
    setRutinaActual(null);
    setModalNotification(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Función personalizada para manejar cambios
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // No permitir cambiar el tipo si es entrenador
    if (name === 'tipo' && isEntrenadorView) {
      showModalNotification("info", "El tipo de entrenamiento no se puede cambiar. Está establecido según tu especialidad.");
      return;
    }
    
    // Si cambia el tipo (solo para admin), limpiar rutina
    if (name === 'tipo') {
      onChange({ target: { name: 'id_rutina', value: '' } });
      setRutinaActual(null);
    }

    // Si cambia la rutina, actualizar la rutina actual
    if (name === 'id_rutina') {
      if (value) {
        const nuevaRutina = rutinasDisponibles.find(r => r.id_rutina === parseInt(value));
        setRutinaActual(nuevaRutina || null);
      } else {
        setRutinaActual(null);
      }
    }
    
    onChange(e);
  };

  // Obtener el label del tipo actual
  const getTipoLabel = (tipo) => {
    const tipoObj = tiposEntrenamiento.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  // Obtener información del nivel seleccionado
  const getNivelInfo = (nivel) => {
    return nivelesEntrenamiento.find(n => n.value === nivel);
  };

  // Función para formatear el nombre de la rutina
  const formatRutinaName = (rutina) => {
    if (!rutina) return "Sin rutina asignada";
    
    const ejercicios = rutina.nombres_ejercicios || rutina.nombre_ejercicio || rutina.ejercicios || [];
    const ejerciciosText = ejercicios.length > 0 
      ? ejercicios.slice(0, 2).join(', ') + (ejercicios.length > 2 ? '...' : '')
      : 'Sin ejercicios';
    
    return `Rutina #${rutina.id_rutina} - ${ejerciciosText}`;
  };

  // Función para recargar rutinas manualmente
  const handleRefreshRutinas = () => {
    if (currentUser && horario.tipo) {
      loadRutinasEntrenador();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-4xl shadow-2xl shadow-yellow-500/20 max-h-[80vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiEditLine className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Editar Horario
              </h2>
              <p className="text-gray-400 text-sm">
                Modifica los detalles de tu horario
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        {/* Notificación dentro del modal */}
        {modalNotification && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            modalNotification.type === 'success' 
              ? 'bg-green-500/10 border-green-500 text-green-400' 
              : modalNotification.type === 'error'
              ? 'bg-red-500/10 border-red-500 text-red-400'
              : 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
          }`}>
            <div className="flex items-center gap-3">
              {modalNotification.type === 'success' && <RiCheckLine className="w-5 h-5" />}
              {modalNotification.type === 'error' && <RiErrorWarningLine className="w-5 h-5" />}
              {modalNotification.type === 'info' && <RiInformationLine className="w-5 h-5" />}
              <span className="font-medium">{modalNotification.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              <RiFileTextLine className="inline h-5 w-5 mr-2" />
              Información Básica
            </h3>
            
            {/* Nombre del horario */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Horario *
              </label>
              <input
                type="text"
                name="nombre_horario"
                value={horario.nombre_horario || ""}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                placeholder="Ej: Entrenamiento de Fuerza Matutino"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tipo de entrenamiento - BLOQUEADO para entrenadores */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiLockLine className="inline h-4 w-4 mr-2" />
                  Tipo de Entrenamiento *
                </label>
                {isEntrenadorView ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={getTipoLabel(horario.tipo)}
                      disabled
                      className="w-full bg-gray-700 border border-gray-600 text-gray-300 rounded-lg px-4 py-3 cursor-not-allowed opacity-75"
                    />
                    <RiLockLine className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                ) : (
                  <select
                    name="tipo"
                    value={horario.tipo || ""}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    required
                  >
                    {tiposEntrenamiento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value} className="bg-gray-800">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                )}
                {isEntrenadorView && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    <RiInformationLine className="h-3 w-3 mr-1" />
                    No puedes cambiar el tipo. Establecido según tu especialidad ({currentUser?.categoria})
                  </p>
                )}
              </div>

              {/* Nivel de dificultad */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiTrophyLine className="inline h-4 w-4 mr-2" />
                  Nivel de Dificultad *
                </label>
                <select
                  name="nivel"
                  value={horario.nivel || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Selecciona un nivel
                  </option>
                  {nivelesEntrenamiento.map((nivel) => (
                    <option key={nivel.value} value={nivel.value} className="bg-gray-800">
                      {nivel.label}
                    </option>
                  ))}
                </select>
                {horario.nivel && (
                  <p className={`text-xs mt-1 flex items-center ${getNivelInfo(horario.nivel)?.color}`}>
                    <RiInformationLine className="h-3 w-3 mr-1" />
                    {getNivelInfo(horario.nivel)?.description}
                  </p>
                )}
              </div>

              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiGroupLine className="inline h-4 w-4 mr-2" />
                  Capacidad *
                </label>
                <input
                  type="number"
                  name="capacidad"
                  value={horario.capacidad || ""}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  placeholder="Máx. 50 personas"
                  required
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={horario.descripcion || ""}
                onChange={handleInputChange}
                placeholder="Describe el contenido del horario..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none placeholder-gray-400"
              />
            </div>
          </div>

          {/* Sección de rutina mejorada */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                <RiUserLine className="inline h-5 w-5 mr-2" />
                Rutina Asignada
              </h3>
              <button
                type="button"
                onClick={handleRefreshRutinas}
                disabled={loadingRutinas}
                className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1 disabled:opacity-50"
              >
                <RiRefreshLine className={`h-4 w-4 ${loadingRutinas ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
            
            {/* Información del entrenador (solo lectura) */}
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                <RiShieldCheckLine className="h-4 w-4 mr-2 text-blue-400" />
                Entrenador Asignado
              </h4>
              <div className="text-sm text-gray-400">
                <p className="font-medium text-gray-200">
                  {currentUser?.nombre} {currentUser?.apellido_p} {currentUser?.apellido_m}
                </p>
                <p className="text-xs">
                  Especialidad: {currentUser?.categoria} • Rol: {currentUser?.rol}
                </p>
              </div>
            </div>



            {/* Mensaje cuando no hay rutina asignada */}
            {!horario.id_rutina && !horario.rutina?.id_rutina && (
              <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Sin Rutina Asignada
                </h4>
                <p className="text-sm text-gray-500">
                  Este horario no tiene una rutina específica asignada. Puedes asignar una usando el selector de abajo.
                </p>
              </div>
            )}

            {/* Rutina actual (si existe) */}
            {rutinaActual && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">
                  Rutina Actualmente Asignada
                </h4>
                <p className="text-sm text-gray-300">
                  {formatRutinaName(rutinaActual)}
                </p>
                {(rutinaActual.nombres_ejercicios || rutinaActual.nombre_ejercicio) && (rutinaActual.nombres_ejercicios || rutinaActual.nombre_ejercicio).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Ejercicios: {(rutinaActual.nombres_ejercicios || rutinaActual.nombre_ejercicio).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Selector de rutina mejorado */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {(horario.id_rutina || horario.rutina?.id_rutina) ? 'Cambiar Rutina' : 'Asignar Rutina'} (Opcional)
              </label>
              <select
                name="id_rutina"
                value={horario.id_rutina || horario.rutina?.id_rutina || ""}
                onChange={handleInputChange}
                disabled={loadingRutinas}
                className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all disabled:opacity-50"
              >
                <option value="" className="bg-gray-800">
                  {loadingRutinas 
                    ? "Cargando tus rutinas..." 
                    : rutinasDisponibles.length === 0 
                      ? "No tienes rutinas disponibles"
                      : (horario.id_rutina || horario.rutina?.id_rutina)
                        ? "Sin rutina asignada"
                        : "Selecciona una rutina (opcional)"
                  }
                </option>
                {rutinasDisponibles.map((rutina) => (
                  <option 
                    key={rutina.id_rutina} 
                    value={rutina.id_rutina} 
                    className="bg-gray-800"
                  >
                    {formatRutinaName(rutina)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <RiInformationLine className="h-3 w-3 mr-1" />
                {(horario.id_rutina || horario.rutina?.id_rutina)
                  ? "Puedes cambiar la rutina o quitarla seleccionando 'Sin rutina asignada'"
                  : "Puedes asignar una rutina o dejar el horario sin rutina específica"
                }
              </p>
            </div>

            {/* Información para entrenador */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <RiInformationLine className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-400 font-medium mb-1">
                    Información de edición
                  </p>
                  <p className="text-xs text-gray-300">
                    Como entrenador, puedes modificar el nombre, fecha, horarios, capacidad, descripción, nivel y rutina asignada. 
                    No puedes cambiar el entrenador asignado ni el tipo de entrenamiento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Programación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              <RiTimeLine className="inline h-5 w-5 mr-2" />
              Programación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiCalendarLine className="inline h-4 w-4 mr-2" />
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={horario.fecha || ""}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                  required
                />
              </div>

              {/* Hora inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={horario.hora_inicio || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                  required
                />
              </div>

              {/* Hora fin */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  name="hora_fin"
                  value={horario.hora_fin || ""}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <RiSaveLine className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarHorarioModal;