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
  RiTrophyLine,
  RiRefreshLine
} from "react-icons/ri";
import { userService } from "../../../../services/usuarios";
import { rutinaService } from "../../../../services/rutinas";
import { getCurrentUser } from "../../../../services/auth";
import { useNotification } from "../../../../hooks/useNotification";

const EditarHorarioModal = ({ isOpen, onClose, onSave, horario, onChange }) => {
  const [entrenadoresDisponibles, setEntrenadoresDisponibles] = useState([]);
  const [rutinasDisponibles, setRutinasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEntrenadores, setLoadingEntrenadores] = useState(false);
  const [loadingRutinas, setLoadingRutinas] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalNotification, setModalNotification] = useState(null);
  const [rutinaActual, setRutinaActual] = useState(null);
  const { showNotification } = useNotification();

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

  // Cargar entrenadores cuando cambie el tipo
  useEffect(() => {
    if (horario.tipo && isOpen) {
      loadEntrenadores(horario.tipo);
    }
  }, [horario.tipo, isOpen]);

  // Cargar rutinas cuando cambie el entrenador
  useEffect(() => {
    if (horario.id_entrenador && isOpen) {
      loadRutinas(horario.id_entrenador);
    } else if (!horario.id_entrenador && currentUser?.rol === 'administrador' && isOpen && horario.tipo) {
      loadRutinas(currentUser.id_usuario);
    }
  }, [horario.id_entrenador, horario.tipo, isOpen, currentUser]);

  // Cargar información de la rutina actual
  useEffect(() => {
    const rutinaId = horario.id_rutina || horario.rutina?.id_rutina;
    
    if (isOpen && rutinaId && currentUser) {
      loadRutinaActual(rutinaId);
    } else {
      setRutinaActual(null);
    }
  }, [isOpen, horario.id_rutina, horario.rutina?.id_rutina, currentUser]);

  // Sincronizar id_rutina cuando hay rutina anidada
  useEffect(() => {
    if (isOpen && !horario.id_rutina && horario.rutina?.id_rutina) {
      console.log("🔄 Sincronizando id_rutina desde rutina anidada:", horario.rutina.id_rutina);
      onChange({ target: { name: 'id_rutina', value: horario.rutina.id_rutina } });
    }
  }, [isOpen, horario.id_rutina, horario.rutina?.id_rutina]);

  const loadCurrentUser = async () => {
    try {
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      console.log("🐛 DEBUG - Usuario actual cargado:", {
        id: userData.id_usuario,
        nombre: userData.nombre,
        rol: userData.rol
      });
    } catch (error) {
      console.log("Error cargando usuario actual:", error);
    }
  };

  const showModalNotification = (type, message) => {
    setModalNotification({ type, message });
    setTimeout(() => setModalNotification(null), 5000);
  };

  // Cargar la rutina actual
  const loadRutinaActual = async (rutinaId = null) => {
    const idRutina = rutinaId || horario.id_rutina || horario.rutina?.id_rutina;
    
    if (!idRutina || !currentUser) {
      return;
    }
    
    // Si ya tenemos la rutina completa en horario.rutina, usarla directamente
    if (horario.rutina && horario.rutina.id_rutina === parseInt(idRutina)) {
      setRutinaActual(horario.rutina);
      return;
    }
    
    try {
      let rutina = null;
      
      // Intentar obtener rutina específica por ID
      if (rutinaService.getRutinaById) {
        try {
          rutina = await rutinaService.getRutinaById(idRutina);
        } catch (error) {
          console.log("⚠️ getRutinaById falló, intentando método alternativo:", error.message);
        }
      }
      
      // Buscar en las rutinas del entrenador
      if (!rutina && horario.id_entrenador) {
        try {
          const rutinas = await rutinaService.getRutinasByEntrenador(horario.id_entrenador);
          rutina = rutinas.find(r => r.id_rutina === parseInt(idRutina));
        } catch (err) {
          console.log("❌ Error buscando en rutinas del entrenador asignado:", err);
        }
      }
      
      setRutinaActual(rutina);
      
    } catch (error) {
      console.error("❌ Error general cargando rutina actual:", error);
      setRutinaActual(null);
    }
  };

  const loadEntrenadores = async (tipo) => {
    try {
      setLoadingEntrenadores(true);
      const entrenadores = await userService.searchUsers({ 
        rol: 'entrenador', 
        categoria: tipo 
      });
      setEntrenadoresDisponibles(entrenadores || []);
      
      console.log("Entrenadores cargados para tipo", tipo, ":", entrenadores);
      
      // Verificar si el entrenador actual sigue siendo válido
      if (horario.id_entrenador) {
        const entrenadorValido = entrenadores?.find(e => e.id_usuario === parseInt(horario.id_entrenador));
        if (!entrenadorValido && parseInt(horario.id_entrenador) !== currentUser?.id_usuario) {
          onChange({ target: { name: 'id_entrenador', value: '' } });
          setRutinasDisponibles([]);
        }
      }
    } catch (error) {
      console.log("Error cargando entrenadores:", error);
      setEntrenadoresDisponibles([]);
    } finally {
      setLoadingEntrenadores(false);
    }
  };

  const loadRutinas = async (entrenadorId) => {
    try {
      setLoadingRutinas(true);
      const rutinas = await rutinaService.getRutinasByEntrenador(entrenadorId);
      setRutinasDisponibles(rutinas || []);
      
      console.log(`Rutinas cargadas para entrenador ${entrenadorId} (tipo: ${horario.tipo}):`, rutinas);
      
    } catch (error) {
      console.log("Error cargando rutinas:", error);
      setRutinasDisponibles([]);
    } finally {
      setLoadingRutinas(false);
    }
  };

  // Obtener información del nivel seleccionado
  const getNivelInfo = (nivel) => {
    return nivelesEntrenamiento.find(n => n.value === nivel);
  };

  // Formatear el nombre de la rutina
  const formatRutinaName = (rutina) => {
    if (!rutina) return "Sin rutina asignada";
    
    const ejercicios = rutina.nombres_ejercicios || rutina.nombre_ejercicio || rutina.ejercicios || [];
    const ejerciciosText = ejercicios.length > 0 
      ? ejercicios.slice(0, 2).join(', ') + (ejercicios.length > 2 ? '...' : '')
      : 'Sin ejercicios';
    
    return `Rutina #${rutina.id_rutina} - ${ejerciciosText}`;
  };

  // Recargar rutinas manualmente
  const handleRefreshRutinas = () => {
    if (horario.id_entrenador) {
      loadRutinas(horario.id_entrenador);
    } else if (currentUser?.rol === 'administrador' && horario.tipo) {
      loadRutinas(currentUser.id_usuario);
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
    setEntrenadoresDisponibles([]);
    setRutinasDisponibles([]);
    setRutinaActual(null);
    setModalNotification(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Manejar cambios en los campos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el tipo, cargar entrenadores correspondientes
    if (name === 'tipo') {
      onChange({ target: { name: 'id_entrenador', value: '' } });
      onChange({ target: { name: 'id_rutina', value: '' } });
      setRutinasDisponibles([]);
      setRutinaActual(null);
      
      if (currentUser?.rol === 'administrador') {
        setTimeout(() => {
          loadRutinas(currentUser.id_usuario);
        }, 100);
      }
    }
    
    // Si cambia el entrenador, cargar sus rutinas
    if (name === 'id_entrenador') {
      onChange({ target: { name: 'id_rutina', value: '' } });
      setRutinaActual(null);
      
      if (value === currentUser?.id_usuario?.toString()) {
        showModalNotification("info", `Te has asignado como entrenador para este horario`);
      } else if (value === "" && entrenadoresDisponibles.length > 0) {
        showModalNotification("info", "Sin entrenador seleccionado - te asignarás automáticamente");
      }
      
      if (value === "" && currentUser?.rol === 'administrador') {
        loadRutinas(currentUser.id_usuario);
      }
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
                Modifica los detalles del horario
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
              {/* Tipo de entrenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Entrenamiento *
                </label>
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

          {/* Asignación */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                <RiUserLine className="inline h-5 w-5 mr-2" />
                Asignación
              </h3>
              <button
                type="button"
                onClick={handleRefreshRutinas}
                disabled={loadingRutinas}
                className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1 disabled:opacity-50"
              >
                <RiRefreshLine className={`h-4 w-4 ${loadingRutinas ? 'animate-spin' : ''}`} />
                Actualizar Rutinas
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entrenador */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entrenador
                </label>
                <select
                  name="id_entrenador"
                  value={horario.id_entrenador || ""}
                  onChange={handleInputChange}
                  disabled={loadingEntrenadores}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all disabled:opacity-50"
                >
                  <option value="" className="bg-gray-800">
                    {loadingEntrenadores 
                      ? "Cargando entrenadores..." 
                      : "Selecciona un entrenador"
                    }
                  </option>
                  
                  {/* Administrador PRIMERO si es admin */}
                  {currentUser && currentUser.rol === 'administrador' && (
                    <option 
                      value={currentUser.id_usuario} 
                      className="bg-yellow-800 text-yellow-200 font-semibold"
                    >
                      👑 {currentUser.nombre} {currentUser.apellido_p} {currentUser.apellido_m} 
                      {(parseInt(horario.id_entrenador) === currentUser.id_usuario || 
                        horario.id_entrenador === currentUser.id_usuario?.toString()) 
                        ? " (Yo - Administrador)" 
                        : " (Asignarme como entrenador)"}
                    </option>
                  )}
                  
                  {/* Entrenadores disponibles */}
                  {entrenadoresDisponibles.map((entrenador) => (
                    <option key={entrenador.id_usuario} value={entrenador.id_usuario} className="bg-gray-800">
                      {entrenador.nombre} {entrenador.apellido_p} {entrenador.apellido_m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rutina */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {(horario.id_rutina || horario.rutina?.id_rutina) ? 'Cambiar Rutina' : 'Asignar Rutina'} (Opcional)
                </label>
                <select
                  name="id_rutina"
                  value={horario.id_rutina || horario.rutina?.id_rutina || ""}
                  onChange={handleInputChange}
                  disabled={loadingRutinas || !rutinasDisponibles.length}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all disabled:opacity-50"
                >
                  <option value="" className="bg-gray-800">
                    {loadingRutinas 
                      ? "Cargando rutinas..." 
                      : rutinasDisponibles.length === 0 
                        ? "No hay rutinas disponibles"
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
              </div>
            </div>

            {/* Información de rutina actual */}
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

            {/* Mensaje cuando no hay rutina asignada */}
            {!horario.id_rutina && !horario.rutina?.id_rutina && (
              <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  Sin rutina asignada
                </h4>
                <p className="text-xs text-gray-400">
                  Puedes asignar una rutina opcionalmente o crear una nueva después.
                </p>
              </div>
            )}

            {/* Mensajes informativos */}
            {horario.tipo && entrenadoresDisponibles.length === 0 && !loadingEntrenadores && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  No hay entrenadores disponibles para {horario.tipo}.
                </p>
              </div>
            )}
            
            {/* Mostrar si el admin está asignado */}
            {currentUser?.rol === 'administrador' && parseInt(horario.id_entrenador) === currentUser?.id_usuario && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  <RiShieldCheckLine className="w-4 h-4" />
                  Estás asignado como entrenador de este horario
                </p>
              </div>
            )}
            
            {/* Mostrar si está asignado otro entrenador */}
            {horario.id_entrenador && parseInt(horario.id_entrenador) !== currentUser?.id_usuario && (
              <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <RiUserLine className="w-4 h-4" />
                  Entrenador específico asignado
                </p>
              </div>
            )}

            {/* Mensajes informativos para rutinas */}
            {!horario.id_entrenador && currentUser?.rol === 'administrador' && rutinasDisponibles.length === 0 && !loadingRutinas && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  No tienes rutinas creadas para {horario.tipo} aún.
                </p>
              </div>
            )}
            {horario.id_entrenador && rutinasDisponibles.length === 0 && !loadingRutinas && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  Este entrenador no tiene rutinas asignadas para {horario.tipo}
                </p>
              </div>
            )}
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