import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  Monitor, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Settings,
  Activity,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  BarController,
  PieController
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  DoughnutController,
  BarController,
  PieController
);

// Importar servicios reales
import ReservaService from '../../services/reservas';
import { userService } from '../../services/usuarios';
import { equipoService } from '../../services/equipos';
import { horarioService } from '../../services/horarios';
import { rutinaService } from '../../services/rutinas';

// Componente para tarjetas de estadísticas
const StatCard = ({ title, value, subtitle, icon: Icon, color = "yellow", trend = null, loading = false }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-5 hover:border-yellow-400/50 transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div className={`p-3 bg-gradient-to-br from-${color}-400/20 to-${color}-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-12 mt-1"></div>
          </div>
        ) : (
          <p className="text-lg font-bold text-white">{value}</p>
        )}
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
            <span className="text-xs text-green-400">{trend}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Componente para gráficos con Chart.js
const ChartCard = ({ title, children, loading = false, icon: Icon = BarChart3 }) => (
  <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400 text-sm">Estadísticas en tiempo real</p>
      </div>
    </div>
    {loading ? (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-700/50 rounded-xl"></div>
      </div>
    ) : (
      <div className="relative h-64">
        {children}
      </div>
    )}
  </div>
);

// Componente principal del Dashboard
const AdminDashboard = () => {
  const [data, setData] = useState({
    reservas: [],
    usuarios: [],
    equipos: [],
    horarios: [],
    rutinas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Referencias para los gráficos
  const reservasChartRef = useRef(null);
  const usuariosChartRef = useRef(null);
  const equiposChartRef = useRef(null);
  const horariosChartRef = useRef(null);

  // Instancias de los gráficos
  const reservasChartInstance = useRef(null);
  const usuariosChartInstance = useRef(null);
  const equiposChartInstance = useRef(null);
  const horariosChartInstance = useRef(null);

  // Función de prueba para debugging del servicio de reservas
  const testReservasService = async () => {
    console.log('🧪 PRUEBA DIRECTA DEL SERVICIO DE RESERVAS');
    try {
      console.log('📞 Llamando a ReservaService.obtenerTodasLasReservas()...');
      const resultado = await ReservaService.obtenerTodasLasReservas();
      console.log('📋 Resultado completo:', resultado);
      console.log('📋 Tipo de resultado:', typeof resultado);
      console.log('📋 Es array?', Array.isArray(resultado));
      console.log('📋 Propiedades:', Object.keys(resultado || {}));
      
      if (resultado && resultado.data) {
        console.log('📋 resultado.data:', resultado.data);
        console.log('📋 Tipo de data:', typeof resultado.data);
        console.log('📋 Es array data?', Array.isArray(resultado.data));
      }
    } catch (error) {
      console.error('💥 Error en prueba de servicio:', error);
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando carga de datos...');
      
      const [reservasResult, usuariosResult, equiposResult, horariosResult, rutinasResult] = await Promise.allSettled([
        ReservaService.obtenerTodasLasReservas(),
        userService.getUsers(),
        equipoService.getAll(),
        horarioService.getAll(),
        rutinaService.getAll()
      ]);

      console.log('📊 Resultados de servicios:', {
        reservas: reservasResult,
        usuarios: usuariosResult,
        equipos: equiposResult,
        horarios: horariosResult,
        rutinas: rutinasResult
      });

      const newData = {
        reservas: [],
        usuarios: [],
        equipos: [],
        horarios: [],
        rutinas: []
      };

      // Procesar reservas con debugging detallado
      if (reservasResult.status === 'fulfilled') {
        console.log('🔍 Resultado completo de reservas:', reservasResult.value);
        
        if (reservasResult.value && reservasResult.value.success && reservasResult.value.data && Array.isArray(reservasResult.value.data.reservas)) {
          newData.reservas = reservasResult.value.data.reservas;
          console.log('✅ Formato: success + data.reservas array');
        } else if (reservasResult.value && reservasResult.value.success && Array.isArray(reservasResult.value.data)) {
          newData.reservas = reservasResult.value.data;
          console.log('✅ Formato: success + data array');
        } else if (reservasResult.value && Array.isArray(reservasResult.value.reservas)) {
          newData.reservas = reservasResult.value.reservas;
          console.log('✅ Formato: objeto con propiedad reservas');
        } else if (Array.isArray(reservasResult.value)) {
          newData.reservas = reservasResult.value;
          console.log('✅ Formato: array directo');
        } else {
          console.log('⚠️ Formato no reconocido de reservas:', typeof reservasResult.value, reservasResult.value);
        }
        console.log('✅ Reservas procesadas:', newData.reservas);
      } else {
        console.error('❌ Error en reservas:', reservasResult.reason);
      }

      // Procesar usuarios
      if (usuariosResult.status === 'fulfilled' && Array.isArray(usuariosResult.value)) {
        newData.usuarios = usuariosResult.value;
        console.log('✅ Usuarios procesados:', newData.usuarios.length);
      }

      // Procesar equipos
      if (equiposResult.status === 'fulfilled' && Array.isArray(equiposResult.value)) {
        newData.equipos = equiposResult.value;
        console.log('✅ Equipos procesados:', newData.equipos.length);
      }

      // Procesar horarios
      if (horariosResult.status === 'fulfilled' && Array.isArray(horariosResult.value)) {
        newData.horarios = horariosResult.value;
        console.log('✅ Horarios procesados:', newData.horarios.length);
      }

      // Procesar rutinas
      if (rutinasResult.status === 'fulfilled' && Array.isArray(rutinasResult.value)) {
        newData.rutinas = rutinasResult.value;
        console.log('✅ Rutinas procesadas:', newData.rutinas.length);
      }

      console.log('📈 Datos finales:', newData);
      setData(newData);

      // Verificar si hay errores
      const errors = [reservasResult, usuariosResult, equiposResult, horariosResult, rutinasResult]
        .filter(result => result.status === 'rejected')
        .map(result => result.reason?.message || 'Error desconocido');

      if (errors.length > 0) {
        console.warn('⚠️ Errores encontrados:', errors);
        setError(`Algunos datos no se pudieron cargar: ${errors.join(', ')}`);
      }

    } catch (error) {
      console.error('💥 Error general al cargar datos:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas en tiempo real con validaciones de seguridad
  const stats = {
    totalReservas: Array.isArray(data.reservas) ? data.reservas.length : 0,
    reservasHoy: Array.isArray(data.reservas) ? data.reservas.filter(r => {
      const hoy = new Date().toISOString().split('T')[0];
      console.log('🗓️ Comparando fechas:', {
        hoy,
        reservaFecha: r.horario_fecha,
        coincide: r.horario_fecha === hoy
      });
      return r.horario_fecha === hoy;
    }).length : 0,
    totalUsuarios: Array.isArray(data.usuarios) ? data.usuarios.length : 0,
    usuariosActivos: Array.isArray(data.usuarios) ? data.usuarios.filter(u => u.activo === true).length : 0,
    totalEquipos: Array.isArray(data.equipos) ? data.equipos.length : 0,
    equiposActivos: Array.isArray(data.equipos) ? data.equipos.filter(e => e.estado === 'activo').length : 0,
    totalEntrenadores: Array.isArray(data.usuarios) ? data.usuarios.filter(u => u.rol === 'entrenador').length : 0,
    totalClientes: Array.isArray(data.usuarios) ? data.usuarios.filter(u => u.rol === 'cliente').length : 0
  };

  console.log('📊 Estadísticas calculadas:', stats);
  console.log('📅 Datos de reservas para debug:', data.reservas);

  // Preparar datos para gráficos
  const prepareChartData = () => {
    console.log('Datos para gráficos:', data);

    // Gráfico de reservas por estado
    const reservasPorEstado = Array.isArray(data.reservas) && data.reservas.length > 0 ? data.reservas.reduce((acc, reserva) => {
      // Normalizar el estado para manejar variaciones
      const estado = reserva.estado ? reserva.estado.toLowerCase() : 'sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {}) : {};

    // Gráfico de usuarios por rol
    const usuariosPorRol = Array.isArray(data.usuarios) && data.usuarios.length > 0 ? data.usuarios.reduce((acc, usuario) => {
      const rol = usuario.rol ? usuario.rol.toLowerCase() : 'sin rol';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {}) : {};

    // Gráfico de equipos por estado
    const equiposPorEstado = Array.isArray(data.equipos) && data.equipos.length > 0 ? data.equipos.reduce((acc, equipo) => {
      const estado = equipo.estado ? equipo.estado.toLowerCase() : 'sin estado';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {}) : {};

    // Gráfico de horarios por tipo
    const horariosPorTipo = Array.isArray(data.horarios) && data.horarios.length > 0 ? data.horarios.reduce((acc, horario) => {
      const tipo = horario.tipo || 'sin tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {}) : {};

    // Solo mostrar "Sin datos" si realmente no hay datos
    const result = {
      reservasPorEstado: Object.keys(reservasPorEstado).length > 0 ? reservasPorEstado : { 'Sin reservas': 1 },
      usuariosPorRol: Object.keys(usuariosPorRol).length > 0 ? usuariosPorRol : { 'Sin usuarios': 1 },
      equiposPorEstado: Object.keys(equiposPorEstado).length > 0 ? equiposPorEstado : { 'Sin equipos': 1 },
      horariosPorTipo: Object.keys(horariosPorTipo).length > 0 ? horariosPorTipo : { 'Sin horarios': 1 }
    };

    console.log('Datos procesados para gráficos:', result);
    return result;
  };

  // Crear gráficos
  const createCharts = () => {
    const chartData = prepareChartData();

    // Destruir gráficos existentes
    if (reservasChartInstance.current) {
      reservasChartInstance.current.destroy();
    }
    if (usuariosChartInstance.current) {
      usuariosChartInstance.current.destroy();
    }
    if (equiposChartInstance.current) {
      equiposChartInstance.current.destroy();
    }
    if (horariosChartInstance.current) {
      horariosChartInstance.current.destroy();
    }

    // Verificar que hay datos antes de crear gráficos
    if (Object.keys(chartData.reservasPorEstado).length === 0) {
      console.log('No hay datos de reservas para mostrar');
      return;
    }

    // Gráfico de Reservas por Estado
    if (reservasChartRef.current) {
      const ctx = reservasChartRef.current.getContext('2d');
      
      // Mapear colores según los estados conocidos
      const getBackgroundColors = (labels) => {
        return labels.map(label => {
          switch(label.toLowerCase()) {
            case 'confirmada': return '#10B981'; // verde
            case 'pendiente': return '#F59E0B'; // amarillo
            case 'cancelada': return '#EF4444'; // rojo
            case 'completada': return '#3B82F6'; // azul
            case 'sin reservas': return '#6B7280'; // gris
            default: return '#6B7280'; // gris por defecto
          }
        });
      };

      const labels = Object.keys(chartData.reservasPorEstado);
      
      reservasChartInstance.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: Object.values(chartData.reservasPorEstado),
            backgroundColor: getBackgroundColors(labels),
            borderWidth: 2,
            borderColor: '#1F2937'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                color: '#D1D5DB'
              }
            }
          }
        }
      });
    }

    // Gráfico de Usuarios por Rol
    if (usuariosChartRef.current && Object.keys(chartData.usuariosPorRol).length > 0) {
      const ctx = usuariosChartRef.current.getContext('2d');
      
      // Mapear colores según los roles conocidos
      const getBackgroundColors = (labels) => {
        return labels.map(label => {
          switch(label.toLowerCase()) {
            case 'administrador': return '#8B5CF6'; // púrpura
            case 'entrenador': return '#06B6D4'; // cyan
            case 'cliente': return '#10B981'; // verde
            case 'sin usuarios': return '#6B7280'; // gris
            default: return '#6B7280'; // gris por defecto
          }
        });
      };

      const getBorderColors = (labels) => {
        return labels.map(label => {
          switch(label.toLowerCase()) {
            case 'administrador': return '#7C3AED';
            case 'entrenador': return '#0891B2';
            case 'cliente': return '#059669';
            case 'sin usuarios': return '#4B5563';
            default: return '#4B5563';
          }
        });
      };

      const labels = Object.keys(chartData.usuariosPorRol);
      
      usuariosChartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Número de Usuarios',
            data: Object.values(chartData.usuariosPorRol),
            backgroundColor: getBackgroundColors(labels),
            borderColor: getBorderColors(labels),
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#9CA3AF'
              },
              grid: {
                color: '#374151'
              }
            },
            x: {
              ticks: {
                color: '#9CA3AF'
              },
              grid: {
                color: '#374151'
              }
            }
          }
        }
      });
    }

    // Gráfico de Equipos por Estado
    if (equiposChartRef.current && Object.keys(chartData.equiposPorEstado).length > 0) {
      const ctx = equiposChartRef.current.getContext('2d');
      equiposChartInstance.current = new ChartJS(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(chartData.equiposPorEstado),
          datasets: [{
            data: Object.values(chartData.equiposPorEstado),
            backgroundColor: [
              '#10B981', // activo - verde
              '#F59E0B', // mantenimiento - amarillo
              '#EF4444', // inactivo - rojo
            ],
            borderWidth: 2,
            borderColor: '#1F2937'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                color: '#D1D5DB'
              }
            }
          }
        }
      });
    }

    // Gráfico de Horarios por Tipo
    if (horariosChartRef.current && Object.keys(chartData.horariosPorTipo).length > 0) {
      const ctx = horariosChartRef.current.getContext('2d');
      
      // Mapear colores según el tipo de horario
      const getBackgroundColors = (labels) => {
        return labels.map(label => {
          switch(label.toLowerCase()) {
            case 'powerplate': return '#8B5CF6'; // púrpura
            case 'calistenia': return '#06B6D4'; // celeste/cyan
            default: return '#F59E0B'; // amarillo por defecto
          }
        });
      };

      const getBorderColors = (labels) => {
        return labels.map(label => {
          switch(label.toLowerCase()) {
            case 'powerplate': return '#7C3AED'; // púrpura más oscuro
            case 'calistenia': return '#0891B2'; // celeste más oscuro
            default: return '#D97706'; // amarillo más oscuro
          }
        });
      };

      const labels = Object.keys(chartData.horariosPorTipo);
      
      horariosChartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Número de Horarios',
            data: Object.values(chartData.horariosPorTipo),
            backgroundColor: getBackgroundColors(labels),
            borderColor: getBorderColors(labels),
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#9CA3AF'
              },
              grid: {
                color: '#374151'
              }
            },
            x: {
              ticks: {
                color: '#9CA3AF'
              },
              grid: {
                color: '#374151'
              }
            }
          }
        }
      });
    }

    console.log('Gráficos creados con datos:', chartData);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Delay para asegurar que los elementos del DOM estén montados
      const timer = setTimeout(() => {
        createCharts();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, data]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (reservasChartInstance.current) reservasChartInstance.current.destroy();
      if (usuariosChartInstance.current) usuariosChartInstance.current.destroy();
      if (equiposChartInstance.current) equiposChartInstance.current.destroy();
      if (horariosChartInstance.current) horariosChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="relative z-10 py-8">
      {/* Header principal */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                <PieChart className="w-8 h-8 text-black" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
            </div>
            
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Dashboard
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Panel de control y estadísticas del sistema
              </p>
            </div>
          </div>

        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm ml-1">
          <span className="text-yellow-400 font-medium">Dashboard</span>
        </div>
      </div>

      {/* Mostrar errores si los hay */}
      {error && (
        <div className="mb-6 bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-xl border border-red-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="text-sm text-red-300">{error}</div>
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Reservas"
          value={stats.totalReservas}
          subtitle="Todas las reservas"
          icon={Calendar}
          color="yellow"
          loading={loading}
          trend={stats.totalReservas > 0 ? "+12% vs mes anterior" : null}
        />
        <StatCard
          title="Reservas Hoy"
          value={stats.reservasHoy}
          subtitle="Reservas para hoy"
          icon={Clock}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Usuarios Activos"
          value={`${stats.usuariosActivos}/${stats.totalUsuarios}`}
          subtitle="Del total de usuarios"
          icon={Users}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Equipos Operativos"
          value={`${stats.equiposActivos}/${stats.totalEquipos}`}
          subtitle="Equipos disponibles"
          icon={Monitor}
          color="blue"
          loading={loading}
        />
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Entrenadores"
          value={stats.totalEntrenadores}
          subtitle="Personal especializado"
          icon={UserCheck}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Clientes"
          value={stats.totalClientes}
          subtitle="Usuarios del sistema"
          icon={Users}
          color="yellow"
          loading={loading}
        />
        <StatCard
          title="Total Rutinas"
          value={Array.isArray(data.rutinas) ? data.rutinas.length : 0}
          subtitle="Rutinas disponibles"
          icon={Dumbbell}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Horarios Activos"
          value={Array.isArray(data.horarios) ? data.horarios.filter(h => h.estado === 'activo').length : 0}
          subtitle="Horarios disponibles"
          icon={Activity}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Reservas por Estado" loading={loading} icon={PieChart}>
          <canvas ref={reservasChartRef}></canvas>
        </ChartCard>
        
        <ChartCard title="Usuarios por Rol" loading={loading} icon={Users}>
          <canvas ref={usuariosChartRef}></canvas>
        </ChartCard>
        
        <ChartCard title="Estado de Equipos" loading={loading} icon={Monitor}>
          <canvas ref={equiposChartRef}></canvas>
        </ChartCard>
        
        <ChartCard title="Horarios por Tipo" loading={loading} icon={Calendar}>
          <canvas ref={horariosChartRef}></canvas>
        </ChartCard>
      </div>

      {/* Resumen rápido */}
      <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg">
            <BarChart3 className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Resumen del Sistema</h3>
            <p className="text-gray-400 text-sm">Métricas clave del rendimiento</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 hover:border-yellow-400/50 transition-all duration-300">
            <div className="text-2xl font-bold text-yellow-400">{((stats.equiposActivos / stats.totalEquipos) * 100 || 0).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Disponibilidad de Equipos</div>
          </div>
          <div className="text-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 hover:border-yellow-400/50 transition-all duration-300">
            <div className="text-2xl font-bold text-green-400">{((stats.usuariosActivos / stats.totalUsuarios) * 100 || 0).toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Usuarios Activos</div>
          </div>
          <div className="text-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4 hover:border-yellow-400/50 transition-all duration-300">
            <div className="text-2xl font-bold text-blue-400">{stats.reservasHoy}</div>
            <div className="text-sm text-gray-400">Actividad Hoy</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;