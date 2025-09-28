import React, { useState, useEffect } from 'react';
import {
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiRefreshLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiCalendarLine,
  RiUserLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiSettings3Line,
  RiBarChart2Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTimeLine
} from 'react-icons/ri';
import ReservaService from '../../../services/reservas';
import { getLocalUser } from '../../../services/auth';
import { userService } from '../../../services/usuarios';
import ReservaTable from './componentes/ReservaTable';
import CrearReservaModal from './modales/CrearReservaModal';
import CancelarReservaModal from './modales/CancelarReservaModal';
import Notification from '../../../componentes/Notification';
import { useNotification } from '../../../hooks/useNotification';

const Reservas = () => {
  // Estados principales
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [entrenadores, setEntrenadores] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    fecha: '',
    entrenador: '',
    busqueda: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    confirmadas: 0,
    canceladas: 0,
  });

  // Estados para modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  // Usuario actual desde localStorage
  const [usuario, setUsuario] = useState(null);

  // Notificaciones
  const { notification, showNotification, hideNotification } = useNotification();

  // Obtener usuario actual al montar el componente
  useEffect(() => {
    const currentUser = getLocalUser();
    if (currentUser) {
      setUsuario(currentUser);
    } else {
      setError('No se pudo obtener la información del usuario');
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (usuario) {
      cargarReservas();
      cargarEntrenadores();
    }
  }, [usuario]);

  // Calcular estadísticas cuando cambian las reservas
  useEffect(() => {
    calculateStats();
  }, [reservas]);

  // Calcular estadísticas
  const calculateStats = () => {
    if (!reservas.length) {
      setStats({
        total: 0,
        confirmadas: 0,
        canceladas: 0,
      });
      return;
    }

    const newStats = {
      total: reservas.length,
      confirmadas: reservas.filter(r => r.estado === 'confirmada').length,
      canceladas: reservas.filter(r => r.estado === 'cancelada').length,
    };
    
    setStats(newStats);
  };
    // REEMPLAZA la función handleMarcarAsistenciaDirecta en ReservaTable.jsx con esta:

  const handleMarcarAsistenciaDirecta = async (reserva) => {
    try {
      console.log("🎯 Iniciando marcado de asistencia para reserva:", reserva);

      // Si ya tiene asistencia, no permitir marcar de nuevo
      if (reserva.asistencia && reserva.asistencia > 0) {
        alert("Esta reserva ya tiene asistencia marcada");
        return;
      }

      console.log("📋 Datos de la reserva a marcar:", {
        id_reserva: reserva.id_reserva,
        usuario_id: reserva.usuario_id,
        estado: reserva.estado,
      });

      // Llamar a la función del componente padre y CAPTURAR la respuesta
      const resultado = await onMarcarAsistencia(
        reserva,
        100,
        "Asistencia registrada"
      );

      console.log("📊 Resultado recibido:", resultado);

      // Mostrar el resultado al usuario
      if (resultado && resultado.success === false) {
        // Mostrar el mensaje de error del backend (aquí aparecerá tu mensaje)
        alert(resultado.message);
      } else if (resultado && resultado.success === true) {
        // Mostrar mensaje de éxito
        alert(resultado.message);
      }
    } catch (error) {
      console.error("❌ Error al marcar asistencia:", error);
      alert(
        "Error al marcar asistencia: " + (error.message || "Error desconocido")
      );
    }
  };

  // Función para cargar las reservas
  const cargarReservas = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await ReservaService.obtenerReservas(usuario.rol);
      
      if (response.success) {
        setReservas(response.data.reservas || []);
      } else {
        setError(response.message);
        showNotification('error', response.message);
      }
    } catch (err) {
      const errorMsg = 'Error al cargar las reservas';
      setError(errorMsg);
      showNotification('error', errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar lista de entrenadores (para filtros)
  const cargarEntrenadores = async () => {
    try {
      const entrenadoresData = await userService.getEntrenadores();
      setEntrenadores(entrenadoresData);
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
      // No es crítico, solo afecta el filtro
    }
  };

  // Manejar refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarReservas();
    setRefreshing(false);
    showNotification('success', 'Lista de reservas actualizada');
  };

  // Filtrar reservas según los filtros aplicados
  const reservasFiltradas = reservas.filter(reserva => {
    const cumpleFiltros = {
      estado: !filtros.estado || reserva.estado === filtros.estado,
      fecha: !filtros.fecha || reserva.horario_fecha === filtros.fecha,
      entrenador: !filtros.entrenador || reserva.entrenador_id.toString() === filtros.entrenador,
      busqueda: !filtros.busqueda || 
        `${reserva.usuario_nombre} ${reserva.usuario_apellido_p} ${reserva.usuario_apellido_m}`.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        reserva.equipo_nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
        `${reserva.entrenador_nombre} ${reserva.entrenador_apellido_p}`.toLowerCase().includes(filtros.busqueda.toLowerCase())
    };

    return Object.values(cumpleFiltros).every(cumple => cumple);
  });

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      fecha: '',
      entrenador: '',
      busqueda: ''
    });
  };

  // Abrir modal de crear reserva
  const abrirModalCrear = () => {
    setModalCrear(true);
  };

  // Abrir modal de cancelar reserva
  const abrirModalCancelar = (reserva) => {
    setReservaSeleccionada(reserva);
    setModalCancelar(true);
  };

  // Cerrar modales
  const cerrarModales = () => {
    setModalCrear(false);
    setModalCancelar(false);
    setReservaSeleccionada(null);
  };

  // Manejar creación exitosa de reserva
  const handleReservaCreada = () => {
    cerrarModales();
    cargarReservas();
    showNotification('success', 'Reserva creada exitosamente');
  };

  // Manejar cancelación exitosa de reserva
  const handleReservaCancelada = () => {
    cerrarModales();
    cargarReservas();
    showNotification('success', 'Reserva cancelada exitosamente');
  };


  // Verificar permisos según rol
  const permisos = usuario ? {
    puedeCrear: usuario.rol === 'administrador',
    puedeCancelar: (reserva) => ReservaService.puedesCancelarReserva(usuario.rol, reserva, usuario.id_usuario),
    puedeMarcarAsistencia: (reserva) => ReservaService.puedesMarcarAsistencia(usuario.rol, reserva, usuario.id_usuario)
  } : {
    puedeCrear: false,
    puedeCancelar: () => false,
    puedeMarcarAsistencia: () => false
  };

  // Si no hay usuario, mostrar error
  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg max-w-md w-full text-center">
          <RiErrorWarningLine className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">No se pudo cargar la información del usuario.</p>
          <p className="text-sm mt-1 text-red-300">Por favor, inicia sesión nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 py-8">
      {/* Notificaciones */}
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={hideNotification}
      />

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
                Gestión de Reservas
              </h1>
              <div className="flex items-center gap-2 text-lg text-gray-400">
                <span>{usuario.rol === 'administrador' ? 'Todas las reservas' : 'Mis reservas'}</span>
                {usuario.nombre && (
                  <>
                    <span className="text-gray-600">•</span>
                    <div className="flex items-center gap-2">
                      {usuario.rol === 'administrador' ? (
                        <RiShieldCheckLine className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <RiUserLine className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-yellow-400 font-medium">
                        {usuario.nombre} {usuario.apellido_p}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded-xl transition-all duration-300 disabled:opacity-50"
            >
              <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            
            {permisos.puedeCrear && (
              <button
                onClick={abrirModalCrear}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-yellow-400/25"
              >
                <RiAddLine className="w-5 h-5" />
                <span>Nueva Reserva</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer">Dashboard</span>
          <span className="text-gray-600">/</span>
          <span className="text-yellow-400 font-medium">Reservas</span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCalendarLine className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCheckboxCircleLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Confirmadas</p>
              <p className="text-lg font-bold text-white">{stats.confirmadas}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RiCloseCircleLine className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Canceladas</p>
              <p className="text-lg font-bold text-white">{stats.canceladas}</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">


          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
            >
              <option value="" className="bg-gray-700">Todos los estados</option>
              <option value="confirmada" className="bg-gray-700">Confirmada</option>
              <option value="cancelada" className="bg-gray-700">Cancelada</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <RiCalendarLine className="inline w-4 h-4 mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => handleFiltroChange('fecha', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
            />
          </div>

          {/* Entrenador (solo si hay entrenadores y es admin) */}
          {usuario.rol === 'administrador' && entrenadores.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <RiUserLine className="inline w-4 h-4 mr-1" />
                Entrenador
              </label>
              <select
                value={filtros.entrenador}
                onChange={(e) => handleFiltroChange('entrenador', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
              >
                <option value="" className="bg-gray-700">Todos los entrenadores</option>
                {entrenadores.map(entrenador => (
                  <option key={entrenador.id_usuario} value={entrenador.id_usuario} className="bg-gray-700">
                    {entrenador.nombre} {entrenador.apellido_p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Botón limpiar filtros */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg transition-all duration-200"
          >
            <RiRefreshLine className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <RiErrorWarningLine className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Tabla de reservas */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden relative z-10">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
              <RiTimeLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Lista de Reservas</h2>
              <p className="text-gray-400 text-sm">
                {loading ? 'Cargando reservas...' : `${reservasFiltradas.length} reservas encontradas`}
              </p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <RiLoader4Line className="w-8 h-8 text-yellow-400 animate-spin" />
              <span className="text-gray-300 text-lg">Cargando reservas...</span>
            </div>
          </div>
        ) : (
          <ReservaTable
            reservas={reservasFiltradas}
            permisos={permisos}
            usuario={usuario}
            onCancelar={abrirModalCancelar}
            onMarcarAsistencia={handleMarcarAsistenciaDirecta}
            onRefresh={cargarReservas}
          />
        )}
      </div>

      {/* Modales */}
      {modalCrear && (
        <CrearReservaModal
          isOpen={modalCrear}
          onClose={cerrarModales}
          onSuccess={handleReservaCreada}
        />
      )}

      {modalCancelar && reservaSeleccionada && (
        <CancelarReservaModal
          isOpen={modalCancelar}
          reserva={reservaSeleccionada}
          onClose={cerrarModales}
          onSuccess={handleReservaCancelada}
        />
      )}
    </div>
  );
};

export default Reservas;