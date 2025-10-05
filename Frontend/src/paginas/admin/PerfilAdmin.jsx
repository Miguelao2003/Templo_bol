import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/auth";
import { userService } from "../../services/usuarios";
import { PersonalInfoCard } from "./componentes/PersonalInfoCard";
import { BodyMetricsCard } from "./componentes/BodyMetricsCard";
import { CalculatedMetrics } from "./componentes/CalculatedMetrics";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../componentes/Notification";
import EditarUsuarioModal from "./usuarios/modales/EditarUsuarioModal";
import { 
  RiUser3Line, 
  RiBodyScanLine, 
  RiBarChart2Line, 
  RiRefreshLine,
  RiDownloadLine,
  RiEditLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiTrophyLine,
  RiSettings3Line
} from "react-icons/ri";

// Constantes que necesita el modal (igual que en Usuario.jsx)
const ROLES = {
  ADMINISTRADOR: "administrador",
  ENTRENADOR: "entrenador",
  CLIENTE: "cliente",
};

const CATEGORIAS = {
  POWERPLATE: "powerplate",
  CALISTENIA: "calistenia",
};

// NUEVA CONSTANTE NIVELES
const NIVELES = {
  PRINCIPIANTE: "principiante",
  INTERMEDIO: "intermedio",
  AVANZADO: "avanzado",
};

// Helper function para mapear usuario a formulario - ACTUALIZADA
const mapUserToForm = (user) => ({
  nombre: user.nombre ?? "",
  apellido_p: user.apellido_p ?? "",
  apellido_m: user.apellido_m ?? "",
  correo: user.correo ?? "",
  rol: user.rol ?? "cliente",
  categoria: user.categoria ?? "powerplate",
  peso: user.peso ?? 0,
  altura: user.altura ?? 0,
  edad: user.edad ?? 0,
  genero: user.genero ?? "Masculino",
  objetivo: user.objetivo ?? "perdida de peso",
  nivel: user.nivel ?? "principiante", // NUEVO CAMPO
  contrasena: "",
});

const PerfilAdmin = () => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados necesarios para el modal (similar a Usuario.jsx)
  const [formUser, setFormUser] = useState({});
  
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      if (!userData || userData.rol !== "administrador") {
        navigate("/login");
        return;
      }
      setUsuario(userData);
    } catch (error) {
      showNotification("error", "Error al cargar perfil");
      navigate("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    showNotification("success", "Perfil actualizado correctamente");
  };

  const handleExportData = () => {
    showNotification("info", "Preparando exportación de datos...");
  };

  const handleEditProfile = () => {
    // Mapear el usuario actual al formato del formulario
    setFormUser(mapUserToForm(usuario));
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setFormUser({});
  };

  // Función para manejar cambios en el formulario del modal
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setFormUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para guardar los cambios (similar a Usuario.jsx)
  const handleSaveUser = async () => {
    try {
      if (!usuario) return;

      const userToUpdate = {
        ...formUser,
        peso: parseFloat(formUser.peso) || null,
        altura: parseFloat(formUser.altura) || null,
        edad: parseInt(formUser.edad) || null,
      };

      const updatedUser = await userService.updateUser(
        usuario.id_usuario,
        userToUpdate
      );

      // Actualizar el estado local
      setUsuario(updatedUser);
      setShowEditModal(false);
      setFormUser({});
      showNotification("success", "Perfil actualizado correctamente");
      
      // Opcional: recargar datos del servidor para asegurar consistencia
      await loadUser();
    } catch (err) {
      showNotification("error", err.message || "Error al actualizar el perfil");
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex justify-center items-center relative overflow-hidden">
        {/* Efectos de fondo amarillos */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-800"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-yellow-400 border-r-yellow-400 absolute top-0 left-0"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/20 to-transparent animate-pulse"></div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-white">Cargando perfil</div>
            <div className="text-gray-400">Obteniendo información del administrador...</div>
            <div className="flex justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent"></div>
        
        <div className="text-center p-8 z-10">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto backdrop-blur-xl border border-yellow-400/30">
              <RiUser3Line className="w-16 h-16 text-yellow-400" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 rounded-full blur-xl"></div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Usuario no encontrado</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            No se pudo cargar la información del perfil. Por favor, verifica tu conexión e intenta nuevamente.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg shadow-yellow-400/25"
            >
              Volver al login
            </button>
            <button
              onClick={handleRefresh}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-yellow-400/50 rounded-xl transition-all duration-300"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Contenido principal con padding top aumentado */}
      <div className="relative z-10 pt-8 px-4 sm:px-6 lg:px-8">
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
        
        {/* Header con más espaciado */}
        <div className="mb-10 mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
                  <RiShieldCheckLine className="w-8 h-8 text-black" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
              </div>
              
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                  Perfil del Usuario
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Gestiona tu información personal y supervisa tus métricas
                </p>
              </div>
            </div>
            
            {/* Acciones rápidas con colores amarillo/gris */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleEditProfile}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-yellow-400/25 flex items-center gap-2"
                title="Editar perfil"
              >
                <RiEditLine className="w-5 h-5" />
                Editar Perfil
              </button>
            </div>
          </div>
          
          {/* Breadcrumb con más espacio */}
          <div className="flex items-center gap-2 text-sm ml-1">
            <span className="text-gray-500">Administración</span>
            <span className="text-gray-600">/</span>
            <span className="text-yellow-400 font-medium">Mi Perfil</span>
          </div>
        </div>

        {/* Grid principal: izquierda y derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Información personal y Datos corporales */}
          <div className="space-y-8">
            {/* Información personal */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg shadow-yellow-400/25">
                    <RiUser3Line className="w-6 h-6 text-black" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-xl blur-lg"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Información Personal</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">Datos de identificación y contacto</p>
                </div>
              </div>
              <div className="transform hover:scale-[1.02] transition-all duration-300">
                <PersonalInfoCard usuario={usuario} />
              </div>
            </div>

            {/* Datos corporales */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl shadow-lg shadow-gray-600/25">
                    <RiBodyScanLine className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-500/30 via-transparent to-gray-500/30 rounded-xl blur-lg"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Datos Corporales</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">Medidas físicas y composición</p>
                </div>
              </div>
              <div className="transform hover:scale-[1.02] transition-all duration-300">
                <BodyMetricsCard usuario={usuario} />
              </div>
            </div>
          </div>

          {/* Columna derecha: Métricas calculadas */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg shadow-yellow-400/25">
                  <RiBarChart2Line className="w-6 h-6 text-black" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-xl blur-lg"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Métricas Calculadas</h2>
                <p className="text-gray-400 text-sm leading-relaxed">Análisis automático de salud</p>
              </div>
            </div>
            
            <div className="transform hover:scale-[1.02] transition-all duration-300">
              {usuario.metricas ? (
                <CalculatedMetrics metrics={usuario.metricas} />
              ) : (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 text-center hover:border-yellow-400/50 transition-all duration-300">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                      <RiBarChart2Line className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/15 via-transparent to-yellow-400/15 rounded-full blur-xl"></div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">
                    Sin métricas disponibles
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Complete sus datos corporales para ver las métricas calculadas automáticamente
                  </p>
                  
                  <button
                    onClick={handleEditProfile}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-yellow-400/25"
                  >
                    Completar datos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición - ACTUALIZADO CON NIVELES */}
      {showEditModal && (
        <EditarUsuarioModal
          isOpen={showEditModal}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          usuario={formUser}
          onChange={handleEditInputChange}
          roles={ROLES}
          categorias={CATEGORIAS}
          niveles={NIVELES} // NUEVO PROP
        />
      )}
    </div>
  );
};

export default PerfilAdmin;