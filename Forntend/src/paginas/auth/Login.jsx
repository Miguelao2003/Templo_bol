import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as RiIcons from "react-icons/ri";
import { toast } from "react-toastify";
import { loginUser } from "../../services/auth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔐 Login: Iniciando proceso de login...");
      
      const response = await loginUser(formData.email, formData.password);
      
      console.log("✅ Login: Respuesta del servidor:", response);
      
      toast.success(`Bienvenido ${response.user.nombre}`);

      // Redirección mejorada basada en rol
      let redirectPath;
      const userRole = response.user.rol.toLowerCase();
      
      console.log("🚀 Login: Determinando ruta de redirección...");
      console.log("   - User role (lowercase):", userRole);
      
      switch (userRole) {
        case 'administrador':
          redirectPath = "/administrador/admindashboard";
          break;
        case 'entrenador':
          redirectPath = "/entrenador/perfil";
          break;
        case 'cliente':
          redirectPath = "/cliente/perfil";
          break;
        default:
          redirectPath = "/perfil";
      }

      console.log("🎯 Login: Redirigiendo a:", redirectPath);
      
      // Forzar la recarga de la página después del login
      window.location.href = redirectPath;
      
    } catch (error) {
      console.error("❌ Login: Error en el proceso:", error);
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent"></div>
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-yellow-500/8 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Header con logo */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-400/30 p-4">
                {!imageError ? (
                  <img 
                    src="/templo.png"
                    alt="Templo.bol Logo" 
                    className="w-full h-full object-contain rounded-full"
                    onError={() => setImageError(true)}
                    onLoad={() => console.log('Imagen cargada correctamente')}
                  />
                ) : (
                  <RiIcons.RiShieldCheckLine className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-full blur-xl"></div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              Templo.{" "}
              <span className="text-yellow-400 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Bol
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Bienvenido de vuelta</p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <RiIcons.RiMailLine className="w-5 h-5 text-yellow-400 group-focus-within:text-yellow-300 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="ejemplo@correo.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <RiIcons.RiLockLine className="w-5 h-5 text-yellow-400 group-focus-within:text-yellow-300 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-yellow-400 transition-colors duration-300"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <RiIcons.RiEyeOffLine className="w-5 h-5" />
                  ) : (
                    <RiIcons.RiEyeLine className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/25 transition-all duration-300 transform ${
                loading 
                  ? "opacity-70 cursor-not-allowed scale-[0.98]" 
                  : "hover:from-yellow-500 hover:to-yellow-600 hover:shadow-yellow-400/40 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-black/30 rounded-full animate-spin"></div>
                    <div className="w-5 h-5 border-2 border-t-black border-r-black rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <span>Ingresando...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RiIcons.RiLoginBoxLine className="w-5 h-5" />
                  Ingresar
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-r from-gray-800/40 to-gray-900/40 text-gray-400 backdrop-blur-sm">
                ¿No tienes cuenta? Regístrate aquí abajo
              </span>
            </div>
          </div>

          {/* Botón de registro */}
          <Link
            to="/registro"
            className="group w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-800/30 hover:bg-gray-700/30 border border-gray-600/30 hover:border-yellow-400/30 text-gray-300 hover:text-white rounded-xl transition-all duration-300 backdrop-blur-sm"
          >
            <RiIcons.RiUserAddLine className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <span className="font-medium">Crear cuenta nueva</span>
          </Link>
        </div>
      </div>

      {/* Elementos decorativos adicionales */}
      <div className="absolute top-1/2 left-4 w-2 h-2 bg-yellow-400/60 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 right-8 w-1 h-1 bg-yellow-400/40 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
};

export default Login;