import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
// Icons
import {
  RiBarChart2Line,
  RiUser3Line,
  RiListCheck2,
  RiFileList3Line,
  RiArchiveLine,
  RiLogoutCircleRLine,
  RiMenu3Line,
  RiCloseLine,
  RiDashboardLine,
  RiTimeLine,
  RiTeamLine,
} from "react-icons/ri";

const Sidebar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  // Cerrar menú al cambiar de ruta en móvil
  useEffect(() => {
    setShowMenu(false);
  }, [location]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowMenu(false);
    };
    
    if (showMenu) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showMenu]);

  const menuItems = [
    { to: "/admin/dashboard", icon: RiDashboardLine, label: "Dashboard", color: "from-blue-500 to-blue-600" },
    { to: "/admin/perfil", icon: RiUser3Line, label: "Mi Perfil", color: "from-purple-500 to-purple-600" },
    { to: "/admin/usuario", icon: RiTeamLine, label: "Usuarios", color: "from-green-500 to-green-600" },
    { to: "/admin/Horario", icon: RiTimeLine, label: "Horarios", color: "from-orange-500 to-orange-600" },
    { to: "/admin/HorarioTurno", icon: RiListCheck2, label: "Horario Turnos", color: "from-teal-500 to-teal-600" },
    { to: "/admin/Rutina", icon: RiFileList3Line, label: "Rutinas", color: "from-pink-500 to-pink-600" },
    { to: "/admin/Equipo", icon: RiArchiveLine, label: "Equipos", color: "from-indigo-500 to-indigo-600" },
    { to: "/admin/Reporte", icon: RiBarChart2Line, label: "Reportes", color: "from-red-500 to-red-600" },
  ];

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-[85%] sm:w-[70%] md:w-[50%] lg:w-[25%] xl:w-[20%] 
          bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
          backdrop-blur-xl border-r border-yellow-400/20 
          flex flex-col z-50 transition-all duration-500 ease-out shadow-2xl
          ${showMenu ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
        `}
      >
        {/* Header del sidebar */}
        <div className="p-4 sm:p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white select-none">
              Templo.{" "}
              <span className="text-yellow-400 text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Bol
              </span>
            </h1>
            
            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setShowMenu(false)}
              className="md:hidden p-2 rounded-lg bg-gray-800/50 hover:bg-yellow-400/20 transition-all duration-300 group"
            >
              <RiCloseLine className="text-xl text-yellow-400 group-hover:text-yellow-300" />
            </button>
          </div>
          
          {/* Indicador de estado */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Sistema activo</span>
          </div>
        </div>

        {/* Menú principal */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2 scrollbar-thin scrollbar-thumb-yellow-400/20 scrollbar-track-transparent">
          {menuItems.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={label}
              to={to}
              className={`group flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-4 sm:px-5 rounded-xl 
                transition-all duration-300 font-semibold select-none relative overflow-hidden
                ${isActiveRoute(to) 
                  ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-300 border border-yellow-400/30 shadow-lg shadow-yellow-400/10' 
                  : 'text-gray-300 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:text-white border border-transparent hover:border-gray-600/50'
                }
              `}
              tabIndex={0}
            >
              {/* Indicador activo */}
              {isActiveRoute(to) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-r-full"></div>
              )}
              
              {/* Icono con gradiente */}
              <div className={`p-2 rounded-lg bg-gradient-to-br ${color} ${isActiveRoute(to) ? 'shadow-lg' : 'opacity-80 group-hover:opacity-100'} transition-all duration-300`}>
                <Icon className="text-base sm:text-lg text-white" />
              </div>
              
              {/* Texto del menú */}
              <span className="text-sm sm:text-base truncate flex-1">{label}</span>
              
              {/* Efecto hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Link>
          ))}
        </div>

        {/* Footer del sidebar */}
        <div className="p-4 sm:p-6 border-t border-gray-700/50">
          <Link
            to="/"
            className="group flex items-center gap-3 sm:gap-4 py-3 sm:py-4 px-4 sm:px-5 rounded-xl 
              text-gray-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20 
              hover:text-red-400 hover:border-red-400/30 border border-transparent
              transition-all duration-300 font-semibold select-none relative overflow-hidden"
            tabIndex={0}
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 opacity-80 group-hover:opacity-100 transition-all duration-300">
              <RiLogoutCircleRLine className="text-base sm:text-lg text-white" />
            </div>
            <span className="text-sm sm:text-base">Cerrar sesión</span>
            
            {/* Efecto hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </Link>

        </div>
      </div>

      {/* Botón toggle mejorado */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        aria-label={showMenu ? "Cerrar menú" : "Abrir menú"}
        className={`fixed top-4 sm:top-5 left-4 sm:left-5 z-50 
          p-3 sm:p-4 rounded-xl shadow-2xl transition-all duration-300 
          ${showMenu 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-yellow-400/30' 
            : 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 shadow-yellow-400/30'
          }
        `}
      >
        <div className="relative">
          <RiMenu3Line 
            className={`text-xl sm:text-2xl transition-all duration-300 ${showMenu ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`} 
          />
          <RiCloseLine 
            className={`text-xl sm:text-2xl absolute inset-0 transition-all duration-300 ${showMenu ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}`} 
          />
        </div>
      </button>

      {/* Overlay mejorado */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          className="fixed inset-0 bg-black/60 z-40 cursor-pointer 
            animate-in fade-in duration-300"
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
};

export default Sidebar;