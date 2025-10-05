import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { equipoService } from '../../../services/equipos';
import CrearReservaModalCliente from '../reservas/modales/CrearReservaModalCliente';
import {
  RiCalendarLine,
  RiSettings3Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiArrowLeftLine,
  RiToolsLine,
  RiBookmarkLine,
  RiInformationLine,
  RiCheckLine
} from "react-icons/ri";
import { MdFitnessCenter } from "react-icons/md";

const EquiposPowerplate = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para el modal
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  
  // Estado para notificación de éxito
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener datos del horario desde la navegación
  const horario = location.state?.horario;
  const horarioId = new URLSearchParams(location.search).get('horario');

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipoService.getAll();
      setEquipos(data);
    } catch (err) {
      console.error('Error al cargar los equipos:', err);
      setError('Error al cargar los equipos. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
  }, []);

  // 🎯 NUEVA FUNCIÓN PARA MANEJAR RESERVA CON MODAL
  const handleReservar = (equipo) => {
    if (equipo.estado === 'mantenimiento') {
      alert(`El equipo ${equipo.nombre_equipo} está en mantenimiento y no puede ser reservado.`);
      return;
    }
    
    console.log('Abriendo modal para reservar equipo:', equipo);
    console.log('Con horario:', horario);
    
    // Configurar equipo seleccionado y abrir modal
    setSelectedEquipo(equipo);
    setShowReservaModal(true);
  };

  // 🎯 FUNCIÓN PARA CERRAR MODAL
  const handleCloseModal = () => {
    setShowReservaModal(false);
    setSelectedEquipo(null);
  };

  // 🎯 FUNCIÓN PARA CONFIRMAR RESERVA
  const handleConfirmReserva = async (reservaData) => {
    try {
      console.log('Reserva confirmada:', reservaData);
      
      // Cerrar modal
      handleCloseModal();
      
      // Mostrar notificación de éxito
      setShowSuccessNotification(true);
      
      // Ocultar notificación después de 3 segundos y navegar
      setTimeout(() => {
        setShowSuccessNotification(false);
        navigate('/cliente/horarioturnocliente');
      }, 3000);
      
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
    }
  };

  const handleVolver = () => {
    navigate('/cliente/horarioturnocliente');
  };

  const getEstadoColor = (estado) => {
    return estado === 'activo' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  const getEstadoIcon = (estado) => {
    return estado === 'activo' ? <RiCheckboxCircleLine className="w-4 h-4" /> : <RiCloseCircleLine className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="relative z-10 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Cargando equipos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative z-10 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl w-fit mx-auto mb-6">
              <RiCloseCircleLine className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Error al cargar equipos</h3>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={fetchEquipos}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold mx-auto"
            >
              <RiRefreshLine className="w-4 h-4" />
              Reintentar
            </button>
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
                <MdFitnessCenter className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Equipos Powerplate
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Selecciona un equipo para tu entrenamiento
                {horario && (
                  <span className="ml-2 text-yellow-400 font-medium">
                    - {horario.nombre_horario}
                  </span>
                )}
              </p>
            </div>
          </div>

        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span 
            onClick={handleVolver}
            className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
          >
            Horario Turnos
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-yellow-400 font-medium">Equipos</span>
        </div>
      </div>

      {/* Información del horario seleccionado */}
      {horario && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <RiInformationLine className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-yellow-400">Horario Seleccionado</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Nombre: </span>
              <span className="text-white font-medium">{horario.nombre_horario}</span>
            </div>
            <div>
              <span className="text-gray-400">Horario: </span>
              <span className="text-white font-medium">{horario.hora_inicio} - {horario.hora_fin}</span>
            </div>
            <div>
              <span className="text-gray-400">Nivel: </span>
              <span className={`font-medium capitalize ${
                horario.nivel?.toLowerCase() === 'principiante' 
                  ? 'text-green-400' 
                  : horario.nivel?.toLowerCase() === 'intermedio' 
                  ? 'text-yellow-400' 
                  : horario.nivel?.toLowerCase() === 'avanzado' 
                  ? 'text-red-400' 
                  : 'text-gray-400'
              }`}>
                {horario.nivel || 'Sin especificar'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Entrenador: </span>
              <span className="text-white font-medium">
                {horario.entrenador ? `${horario.entrenador.nombre} ${horario.entrenador.apellido_p}` : 'Sin asignar'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de equipos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <MdFitnessCenter className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Total Equipos</p>
              <p className="text-lg font-bold text-white">{equipos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <RiCheckboxCircleLine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Disponibles</p>
              <p className="text-lg font-bold text-white">{equipos.filter(e => e.estado === 'activo').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <RiSettings3Line className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Mantenimiento</p>
              <p className="text-lg font-bold text-white">{equipos.filter(e => e.estado === 'mantenimiento').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de equipos */}
      {equipos.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
          <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl w-fit mx-auto mb-6">
            <MdFitnessCenter className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No hay equipos disponibles</h3>
          <p className="text-gray-400 mb-6">No se encontraron equipos Powerplate.</p>
          <button
            onClick={fetchEquipos}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl transition-all duration-300 font-semibold mx-auto"
          >
            <RiRefreshLine className="w-4 h-4" />
            Actualizar equipos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {equipos.map((equipo) => (
            <div
              key={equipo.id_equipo}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-yellow-400/50 group hover:shadow-lg hover:shadow-yellow-400/10"
            >
              {/* Header del card */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <MdFitnessCenter className="w-8 h-8 text-yellow-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${getEstadoColor(equipo.estado)}`}>
                  {getEstadoIcon(equipo.estado)}
                  {equipo.estado.charAt(0).toUpperCase() + equipo.estado.slice(1)}
                </span>
              </div>

              {/* Nombre del equipo */}
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                {equipo.nombre_equipo}
              </h3>

              {/* Especificaciones */}
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {equipo.especificaciones_tecnicas}
              </p>

              {/* Información de mantenimiento */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RiCalendarLine className="w-3 h-3" />
                  <span>Último: {new Date(equipo.ultimo_mantenimiento).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <RiSettings3Line className="w-3 h-3" />
                  <span>Próximo: {new Date(equipo.proximo_mantenimiento).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              {/* Botón de reservar */}
              <button
                onClick={() => handleReservar(equipo)}
                disabled={equipo.estado === 'mantenimiento'}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  equipo.estado === 'activo'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg shadow-yellow-500/25'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {equipo.estado === 'activo' ? (
                  <>
                    <RiBookmarkLine className="w-4 h-4" />
                    Reservar Equipo
                  </>
                ) : (
                  <>
                    <RiCloseCircleLine className="w-4 h-4" />
                    No disponible
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 MODAL DE RESERVA PARA POWERPLATE CON EQUIPO PRE-SELECCIONADO */}
      {showReservaModal && selectedEquipo && horario && (
        <CrearReservaModalCliente
          isOpen={showReservaModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmReserva}
          horario={{
            ...horario,
            equipoSeleccionado: selectedEquipo // Pasar el equipo pre-seleccionado
          }}
        />
      )}

      {/* 🎉 NOTIFICACIÓN DE ÉXITO */}
      {showSuccessNotification && (
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
                Tu reserva ha sido creada exitosamente
              </p>
              
              {/* Detalles */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 mb-4 text-left">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Equipo:</span>
                    <span className="text-yellow-400 font-medium">{selectedEquipo?.nombre_equipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Horario:</span>
                    <span className="text-white">{horario?.hora_inicio} - {horario?.hora_fin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Fecha:</span>
                    <span className="text-white">{horario?.fecha}</span>
                  </div>
                </div>
              </div>
              
              {/* Mensaje adicional */}
              <p className="text-gray-400 text-sm">
                Serás redirigido a tus horarios en un momento...
              </p>
              
              {/* Indicador de progreso */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full animate-pulse" style={{
                    animation: 'progress 3s linear forwards'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para la animación de progreso */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EquiposPowerplate;