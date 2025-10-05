import React, { useState, useEffect } from 'react';
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
  RiFilter3Line,
  RiRefreshLine
} from 'react-icons/ri';
import ReservaService from '../../../../services/reservas';
import { userService } from '../../../../services/usuarios';
import { horarioService } from '../../../../services/horarios';
import { equipoService } from '../../../../services/equipos';
import { getLocalUser } from '../../../../services/auth';

const CrearReservaModal = ({ isOpen, onClose, onSuccess }) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    id_usuario: '',
    id_horario: '',
    id_equipo: '', // Para powerplate
    comentarios: ''
  });

  // Estados para listas de opciones
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [error, setError] = useState('');

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    fecha: '',
    entrenador_id: ''
  });

  // Usuario actual
  const [usuario, setUsuario] = useState(null);
  const [entrenadores, setEntrenadores] = useState([]);

  // Obtener usuario actual
  useEffect(() => {
    const currentUser = getLocalUser();
    setUsuario(currentUser);
  }, []);

  // Cargar datos iniciales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarDatosIniciales();
      resetForm();
    }
  }, [isOpen]);

  // Cargar horarios cuando cambian los filtros o cliente
  useEffect(() => {
    if (isOpen && clienteSeleccionado && filtros.fecha) {
      cargarHorarios();
    }
  }, [filtros, clienteSeleccionado, isOpen]);

  // Cargar equipos cuando se selecciona un horario de powerplate
  useEffect(() => {
    if (horarioSeleccionado && horarioSeleccionado.tipo === 'powerplate') {
      cargarEquiposDisponibles();
    } else {
      setEquiposDisponibles([]);
      setFormData(prev => ({ ...prev, id_equipo: '' }));
    }
  }, [horarioSeleccionado]);

  // Cargar datos iniciales
  const cargarDatosIniciales = async () => {
    setLoadingData(true);
    setError('');

    try {
      // Cargar clientes
      const usuarios = await userService.getUsers();
      const clientesFiltrados = usuarios.filter(user => user.rol === 'cliente' && user.activo);
      setClientes(clientesFiltrados);

      // Cargar entrenadores para filtros
      const entrenadoresData = await userService.getEntrenadores();
      setEntrenadores(entrenadoresData);

      // Establecer fecha mínima como hoy
      const hoy = new Date().toISOString().split('T')[0];
      setFiltros(prev => ({ ...prev, fecha: hoy }));

    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar los datos iniciales');
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar horarios según filtros y categoría del cliente
  const cargarHorarios = async () => {
    if (!clienteSeleccionado || !filtros.fecha) return;

    setLoadingHorarios(true);
    setError('');

    try {
      // Crear el objeto HorarioSearch que espera el backend
      const horarioSearch = {
        fecha: filtros.fecha,
        tipo: clienteSeleccionado.categoria, // powerplate o calistenia
        ...(filtros.entrenador_id && { entrenador_id: parseInt(filtros.entrenador_id) })
      };

      console.log('Enviando búsqueda de horarios:', horarioSearch);
      console.log('Cliente seleccionado:', clienteSeleccionado);

      const horariosData = await horarioService.searchHorarios(horarioSearch);
      console.log('Horarios obtenidos del backend:', horariosData);
      
      // Los horarios ya vienen filtrados del backend
      setHorariosDisponibles(horariosData || []);

    } catch (error) {
      console.error('Error al cargar horarios:', error);
      
      // Si es 404, significa que no hay horarios disponibles
      if (error.response?.status === 404) {
        console.log('No se encontraron horarios para los filtros especificados');
        setHorariosDisponibles([]);
      } else {
        setError(`Error al cargar los horarios: ${error.response?.data?.detail || error.message}`);
        setHorariosDisponibles([]);
      }
    } finally {
      setLoadingHorarios(false);
    }
  };

  // Cargar equipos disponibles para el horario seleccionado
  const cargarEquiposDisponibles = async () => {
    if (!horarioSeleccionado) return;

    setLoadingEquipos(true);

    try {
      console.log('Cargando equipos para horario:', horarioSeleccionado);
      
      // Obtener todos los equipos disponibles
      const equiposData = await equipoService.getAll();
      console.log('Equipos obtenidos:', equiposData);
      
      // Filtrar equipos activos (no en mantenimiento)
      const equiposActivos = equiposData.filter(equipo => equipo.estado === 'activo');
      console.log('Equipos activos:', equiposActivos);
      setEquiposDisponibles(equiposActivos);

    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar los equipos disponibles');
      setEquiposDisponibles([]);
    } finally {
      setLoadingEquipos(false);
    }
  };

  // Manejar selección de cliente
  const handleClienteSelect = (clienteId) => {
    const cliente = clientes.find(c => c.id_usuario === parseInt(clienteId));
    setClienteSeleccionado(cliente);
    setFormData(prev => ({ ...prev, id_usuario: clienteId }));
    
    // Limpiar horario seleccionado cuando cambia el cliente
    setFormData(prev => ({ ...prev, id_horario: '', id_equipo: '' }));
    setHorarioSeleccionado(null);
    setHorariosDisponibles([]);
  };

  // Manejar selección de horario
  const handleHorarioSelect = (horarioId) => {
    const horario = horariosDisponibles.find(h => h.id_horario === parseInt(horarioId));
    setHorarioSeleccionado(horario);
    setFormData(prev => ({ ...prev, id_horario: horarioId }));
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  // Manejar cambios en filtros
  const handleFiltroChange = (field, value) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_usuario: '',
      id_horario: '',
      id_equipo: '',
      comentarios: ''
    });
    setClienteSeleccionado(null);
    setHorarioSeleccionado(null);
    setHorariosDisponibles([]);
    setEquiposDisponibles([]);
    setError('');
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.id_usuario) {
      setError('Debe seleccionar un cliente');
      return false;
    }
    if (!formData.id_horario) {
      setError('Debe seleccionar un horario');
      return false;
    }
    if (horarioSeleccionado?.tipo === 'powerplate' && !formData.id_equipo) {
      setError('Debe seleccionar un equipo para sesiones de powerplate');
      return false;
    }
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    setError('');

    try {
      const reservaData = {
        id_usuario: parseInt(formData.id_usuario),
        id_horario: parseInt(formData.id_horario),
        ...(formData.id_equipo && { id_equipo: parseInt(formData.id_equipo) }),
        ...(formData.comentarios && { comentarios: formData.comentarios })
      };

      console.log('Enviando datos de reserva:', reservaData);

      const response = await ReservaService.crearReserva(reservaData);
      console.log('Respuesta del servicio:', response);

      if (response.success) {
        onSuccess();
      } else {
        console.log('Error del servicio:', response.message);
        const mensajeError = obtenerMensajeError(response.message);
        console.log('Mensaje de error personalizado:', mensajeError);
        setError(mensajeError);
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al crear la reserva';
      
      // Intentar obtener el mensaje de error del backend
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
        console.log('Mensaje del backend:', mensajeError);
      } else if (error.response?.data?.message) {
        mensajeError = error.response.data.message;
        console.log('Mensaje alternativo del backend:', mensajeError);
      } else if (error.message) {
        mensajeError = error.message;
        console.log('Mensaje del error:', mensajeError);
      }
      
      const mensajePersonalizado = obtenerMensajeError(mensajeError);
      console.log('Mensaje personalizado final:', mensajePersonalizado);
      setError(mensajePersonalizado);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener mensaje de error personalizado
  const obtenerMensajeError = (errorMessage) => {
    // Mapeo de errores del backend a mensajes más descriptivos
    const mensajesError = {
      'El horario no existe': '❌ El horario seleccionado no existe',
      'No se puede reservar en un horario inactivo': '❌ Este horario no está disponible para reservas',
      'Las reservas de powerplate requieren un equipo': '❌ Debes seleccionar un equipo para sesiones de powerplate',
      'El equipo especificado no existe o no está activo': '❌ El equipo seleccionado no está disponible',
      'El equipo ya está reservado en este horario': '❌ El equipo ya está reservado en este horario. Por favor, selecciona otro equipo o horario.',
      'Las reservas de calistenia no deben incluir equipo': '❌ Las sesiones de calistenia no requieren equipo',
      'El horario ha alcanzado su capacidad máxima': '⚠️ Este horario ya está completo. No hay cupos disponibles.',
      'Ya tienes una reserva confirmada para este horario': '⚠️ Ya tienes una reserva confirmada para este horario. No puedes hacer reservas duplicadas.',
      'El horario especificado no existe': '❌ El horario seleccionado no es válido',
      'Tu categoría es powerplate pero intentas reservar un horario de calistenia': '❌ Tu categoría no coincide con el tipo de horario seleccionado',
      'Tu categoría es calistenia pero intentas reservar un horario de powerplate': '❌ Tu categoría no coincide con el tipo de horario seleccionado'
    };

    // Buscar mensaje específico
    for (const [errorKey, mensajePersonalizado] of Object.entries(mensajesError)) {
      if (errorMessage.includes(errorKey)) {
        return mensajePersonalizado;
      }
    }

    // Si no encuentra un mensaje específico, retorna el mensaje original
    return errorMessage;
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatearHora = (hora) => {
    return hora.slice(0, 5);
  };

  // Obtener color de la categoría
  const getCategoriaColor = (categoria) => {
    const colors = {
      'powerplate': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'calistenia': 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[categoria] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl shadow-2xl shadow-yellow-500/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiAddCircleLine className="h-6 w-6 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400">
              Crear Reserva
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Error general */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-500/10 border-red-500 text-red-400">
              <div className="flex items-center gap-3">
                <RiErrorWarningLine className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Columna izquierda */}
            <div className="space-y-6">
              
              {/* Seleccionar Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                  <RiUserLine className="inline h-5 w-5 mr-2" />
                  Información del Cliente
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del cliente *
                  </label>
                  {loadingData ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
                      <RiLoader4Line className="w-4 h-4 animate-spin" />
                      Cargando clientes...
                    </div>
                  ) : (
                    <select
                      value={formData.id_usuario}
                      onChange={(e) => handleClienteSelect(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                      required
                    >
                      <option value="" className="bg-gray-800">Seleccionar cliente...</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id_usuario} value={cliente.id_usuario} className="bg-gray-800">
                          {cliente.nombre} {cliente.apellido_p} {cliente.apellido_m}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Mostrar categoría del cliente */}
                  {clienteSeleccionado && (
                    <div className="mt-3 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">Categoría del cliente:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border capitalize ${getCategoriaColor(clienteSeleccionado.categoria)}`}>
                          {clienteSeleccionado.categoria}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtros para buscar horarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                  <RiFilter3Line className="inline h-5 w-5 mr-2" />
                  Filtros de Búsqueda
                </h3>
                
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 space-y-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <RiCalendarLine className="inline h-4 w-4 mr-1" />
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={filtros.fecha}
                      onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                      required
                    />
                  </div>

                  {/* Entrenador específico */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Entrenador específico (opcional)
                    </label>
                    <select
                      value={filtros.entrenador_id}
                      onChange={(e) => handleFiltroChange('entrenador_id', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    >
                      <option value="" className="bg-gray-800">Cualquier entrenador</option>
                      {entrenadores.map(entrenador => (
                        <option key={entrenador.id_usuario} value={entrenador.id_usuario} className="bg-gray-800">
                          {entrenador.nombre} {entrenador.apellido_p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comentarios (opcional)
                </label>
                <textarea
                  value={formData.comentarios}
                  onChange={(e) => handleInputChange('comentarios', e.target.value)}
                  rows={4}
                  placeholder="Comentarios opcionales sobre la reserva..."
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all resize-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">
              
              {/* Horarios Disponibles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                  <RiTimeLine className="inline h-5 w-5 mr-2" />
                  Horarios Disponibles
                </h3>
                
                {!clienteSeleccionado ? (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                    <RiUserLine className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p>Selecciona un cliente para ver los horarios disponibles</p>
                  </div>
                ) : !filtros.fecha ? (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                    <RiCalendarLine className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p>Selecciona una fecha para ver los horarios disponibles</p>
                  </div>
                ) : loadingHorarios ? (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <RiLoader4Line className="w-6 h-6 animate-spin" />
                      <span>Cargando horarios disponibles...</span>
                    </div>
                  </div>
                ) : horariosDisponibles.length === 0 ? (
                  <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                    <RiErrorWarningLine className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p className="mb-2">No hay horarios disponibles para la categoría <strong className="text-yellow-400">{clienteSeleccionado.categoria}</strong></p>
                    <p className="text-xs text-gray-500 mb-4">
                      Fecha: {formatearFecha(filtros.fecha)} | Categoría: {clienteSeleccionado.categoria}
                      {filtros.entrenador_id && ` | Entrenador específico seleccionado`}
                    </p>
                    <button 
                      type="button"
                      onClick={cargarHorarios}
                      className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <RiRefreshLine className="w-4 h-4" />
                      Intentar recargar
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="space-y-3">
                      {horariosDisponibles.map(horario => (
                        <label
                          key={horario.id_horario}
                          className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                        >
                          <input
                            type="radio"
                            name="horario"
                            value={horario.id_horario}
                            checked={formData.id_horario === horario.id_horario.toString()}
                            onChange={(e) => handleHorarioSelect(e.target.value)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-600 bg-gray-700"
                          />
                          <div className="ml-4 flex-1">
                            <div className="text-sm font-medium text-gray-100 mb-1">
                              {formatearHora(horario.hora_inicio)} - {formatearHora(horario.hora_fin)}
                            </div>
                            <div className="text-xs text-gray-400 mb-1">
                              Entrenador: {horario.entrenador?.nombre || 'Sin entrenador'} {horario.entrenador?.apellido_p || ''}
                            </div>
                            <div className="text-xs text-gray-400">
                              Tipo: <span className="text-yellow-400 capitalize">{horario.tipo}</span>
                            </div>
                            {horario.rutina && (
                              <div className="text-xs text-green-400 mt-1">
                                Rutina: {horario.rutina.nombre}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Equipos disponibles (solo para powerplate) */}
              {horarioSeleccionado?.tipo === 'powerplate' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                    <RiSettings3Line className="inline h-5 w-5 mr-2" />
                    Equipos Disponibles
                  </h3>
                  
                  {loadingEquipos ? (
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-3">
                        <RiLoader4Line className="w-6 h-6 animate-spin" />
                        <span>Cargando equipos disponibles...</span>
                      </div>
                    </div>
                  ) : equiposDisponibles.length === 0 ? (
                    <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-8 text-center text-gray-400">
                      <RiSettings3Line className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                      <p className="mb-4">No hay equipos disponibles para este horario</p>
                      <button 
                        type="button"
                        onClick={cargarEquiposDisponibles}
                        className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        <RiRefreshLine className="w-4 h-4" />
                        Intentar recargar
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-3">
                        {equiposDisponibles.map(equipo => (
                          <label
                            key={equipo.id_equipo}
                            className="flex items-center p-4 border border-gray-600 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                          >
                            <input
                              type="radio"
                              name="equipo"
                              value={equipo.id_equipo}
                              checked={formData.id_equipo === equipo.id_equipo.toString()}
                              onChange={(e) => handleInputChange('id_equipo', e.target.value)}
                              className="h-4 w-4 text-purple-500 focus:ring-purple-500 border-gray-600 bg-gray-700"
                            />
                            <div className="ml-4 flex-1">
                              <div className="text-sm font-medium text-gray-100 mb-1">
                                {equipo.nombre_equipo}
                              </div>
                              {equipo.especificaciones && (
                                <div className="text-xs text-gray-400 mb-1">
                                  {equipo.especificaciones}
                                </div>
                              )}
                              <div className="text-xs">
                                <span className="text-gray-400">Estado: </span>
                                <span className="text-green-400 capitalize">{equipo.estado}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.id_usuario || !formData.id_horario || (horarioSeleccionado?.tipo === 'powerplate' && !formData.id_equipo)}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <RiAddCircleLine className="w-5 h-5" />
                  <span>Crear Reserva</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearReservaModal;