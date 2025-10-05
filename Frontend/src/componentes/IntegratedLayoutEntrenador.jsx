import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
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
  RiNotification3Line,
  RiArrowDownSLine,
  RiBookmarkLine,
  RiSettings3Line,
} from "react-icons/ri";
import { getCurrentUser, getLocalUser, logoutUser } from "../services/auth";
import userIcon from "../assets/icon.png";

const IntegratedLayoutEntrenador = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Verificar si window está disponible (SSR safe)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  const location = useLocation();
  const navigate = useNavigate();
  const user = getLocalUser();

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024); // lg breakpoint
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [location, isMobile]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowSidebar(false);
    };
    
    if (showSidebar && isMobile) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showSidebar, isMobile]);

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  // Función para cerrar/colapsar sidebar al hacer clic en el logo
  const handleLogoClick = () => {
    if (isMobile) {
      setShowSidebar(false);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const menuItems = [
    { to: "/entrenador/perfil", icon: RiUser3Line, label: "Mi Perfil", color: "from-purple-500 to-purple-600" },
    { to: "/entrenador/HorarioEntrenador", icon: RiTimeLine, label: "Horarios", color: "from-orange-500 to-orange-600" },
    { to: "/entrenador/RutinaEntrenador", icon: RiFileList3Line, label: "Rutinas", color: "from-pink-500 to-pink-600" },
  ];

  const isActiveRoute = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Elementos decorativos amarillos */}
      <div className="absolute top-40 left-20 w-80 h-80 bg-gradient-to-br from-yellow-400/12 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-yellow-500/8 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Navbar superior */}
      <header className={`
        fixed top-0 right-0 h-20 z-30 transition-all duration-300 ease-in-out
        ${!isMobile ? (isCollapsed ? 'left-20' : 'left-64') : 'left-0'}
        bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 
        backdrop-blur-xl border-b border-gray-700/50 shadow-lg
        flex items-center justify-between px-6
      `}>

        {/* Logo en móvil */}
        {isMobile && (
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 border border-yellow-400/40 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => setShowSidebar(true)}
            >
              {!imageError ? (
                <img 
                  src="/templo.png"
                  alt="Templo.bol Logo" 
                  className="w-9 h-9 object-cover rounded-full"
                  onError={() => setImageError(true)}
                />
              ) : (
                <RiDashboardLine className="w-6 h-6 text-yellow-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span 
                className="text-white font-semibold text-sm cursor-pointer leading-tight"
                onClick={() => setShowSidebar(true)}
              >
                Templo.Bol
              </span>
              <div className="flex flex-col">
                <div className="text-xs font-medium text-white leading-tight">
                  {user ? `${user.nombre} ${user.apellido_p} ${user.apellido_m || ''}`.trim() : "Usuario"}
                </div>
                <div className="text-xs text-yellow-400 uppercase tracking-wide leading-tight">
                  Entrenador
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Espacio flexible */}
        <div className="flex-1"></div>

        {/* Información del usuario */}
        <div className="flex items-center gap-4">
          <Menu
            menuButton={
              <MenuButton className="flex items-center gap-3 bg-gray-800/30 rounded-xl px-4 py-2 border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer">
                <div className="relative">
                  <img
                    src={user?.foto || userIcon}
                    className="w-10 h-10 object-cover rounded-lg border-2 border-yellow-400/50 shadow-md"
                    alt="Foto de perfil"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = userIcon;
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
                </div>
                
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {user ? `${user.nombre} ${user.apellido_p} ${user.apellido_m || ''}`.trim() : "Usuario"}
                  </span>
                  <span className="text-xs text-yellow-400 font-medium uppercase tracking-wide">
                    Entrenador
                  </span>
                </div>
              </MenuButton>
            }
            align="end"
            arrow
            arrowClassName="bg-gray-800 border border-gray-700"
            transition
            menuClassName="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden min-w-80"
          >
            <MenuItem className="p-0 hover:bg-transparent">
              <Link
                to="/entrenador/perfil"
                className="rounded-lg transition-all duration-300 text-white hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-yellow-400/5 flex items-center gap-x-4 py-4 px-6 flex-1 border-b border-gray-700/50"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user?.foto || userIcon}
                    className="w-12 h-12 object-cover rounded-full border-2 border-yellow-400 shadow-lg"
                    alt="Foto de perfil"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
                </div>
                
                <div className="flex flex-col text-sm min-w-0 flex-1">
                  <span className="text-base font-semibold text-white mb-1 truncate">
                    {user ? `${user.nombre} ${user.apellido_p} ${user.apellido_m}` : "Usuario"}
                  </span>
                  <span className="text-sm text-yellow-400 font-medium uppercase tracking-wide truncate">
                    Entrenador
                  </span>
                  <span className="text-xs text-gray-400 mt-1 truncate">
                    {user?.correo || "correo@ejemplo.com"}
                  </span>
                </div>
              </Link>
            </MenuItem>

            <hr className="my-2 border-gray-700" />

            <MenuItem className="p-0 hover:bg-transparent">
              <button
                onClick={handleLogout}
                className="rounded-lg transition-all duration-300 text-gray-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/10 hover:text-red-400 flex items-center gap-x-3 py-3 px-4 flex-1 w-full text-left group"
              >
                <RiLogoutCircleRLine className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                <span>Cerrar sesión</span>
              </button>
            </MenuItem>
          </Menu>
        </div>
      </header>
      
      {/* Sidebar Desktop */}
      <aside className={`
        fixed top-0 h-full z-40 transition-all duration-300 ease-in-out
        ${isMobile ? 'hidden' : 'block'}
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 
        backdrop-blur-xl border-r border-gray-700/50 shadow-2xl
      `}>
        {/* Header del sidebar con logo */}
        <div className="h-20 flex items-center px-4 border-b border-gray-700/50">
          {!isCollapsed ? (
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={handleLogoClick}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 border border-yellow-400/40 rounded-full flex items-center justify-center group-hover:border-yellow-400/60 transition-all duration-300">
                  {!imageError ? (
                    <img 
                      src="/templo.png"
                      alt="Templo.bol Logo" 
                      className="w-11 h-11 object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <RiDashboardLine className="w-8 h-8 text-yellow-400" />
                  )}
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-base font-bold text-white group-hover:text-yellow-300 transition-colors leading-tight">
                  Templo.{" "}
                  <span className="text-yellow-400">Bol</span>
                </h1>
                <span className="text-xs text-yellow-400 font-medium uppercase tracking-wide">
                  Entrenador
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div 
                className="w-12 h-12 border border-yellow-400/40 rounded-full flex items-center justify-center cursor-pointer group hover:border-yellow-400/60 transition-all duration-300" 
                onClick={handleLogoClick}
              >
                {!imageError ? (
                  <img 
                    src="/templo.png"
                    alt="Templo.bol Logo" 
                    className="w-11 h-11 object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <RiDashboardLine className="w-8 h-8 text-yellow-400" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menú principal */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 h-[calc(100vh-160px)]">
          {/* Sección Menú */}
          {!isCollapsed && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
                Menú Principal
              </h3>
            </div>
          )}
          
          {menuItems.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={label}
              to={to}
              className={`group flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} rounded-xl 
                transition-all duration-300 font-medium select-none relative overflow-hidden
                ${isActiveRoute(to) 
                  ? 'bg-gradient-to-r from-yellow-400/15 to-yellow-500/15 text-yellow-300 shadow-lg shadow-yellow-400/10' 
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }
              `}
              title={isCollapsed ? label : ''}
            >
              <div className={`${isCollapsed ? 'p-2' : 'p-1.5'} rounded-lg bg-gradient-to-br ${color} flex-shrink-0 transition-all duration-300 ${isActiveRoute(to) ? 'shadow-md' : ''}`}>
                <Icon className={`${isCollapsed ? 'text-lg' : 'text-base'} text-white`} />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}

              {isActiveRoute(to) && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-l-full"></div>
              )}
            </Link>
          ))}
        </div>

        {/* Footer del sidebar */}
        <div className="h-20 px-3 border-t border-gray-700/50 flex items-center justify-center">
          <button
            onClick={handleLogout}
            className={`${isCollapsed ? 'p-3' : 'w-full flex items-center gap-3 py-2.5 px-3'} rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 group text-red-400 hover:text-red-300`}
            title="Cerrar sesión"
          >
            <RiLogoutCircleRLine className="text-lg" />
            {!isCollapsed && <span className="text-sm font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {isMobile && (
        <>
          <div className={`
            fixed top-0 left-0 h-full w-72 z-50 transition-all duration-500
            bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 
            backdrop-blur-xl border-r border-gray-700/50 shadow-2xl
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}>
            {/* Header móvil con logo */}
            <div className="h-20 flex items-center px-4 border-b border-gray-700/50">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={handleLogoClick}
              >
                <div className="relative">
                  <div className="w-12 h-12 border border-yellow-400/40 rounded-full flex items-center justify-center group-hover:border-yellow-400/60 transition-all duration-300">
                    {!imageError ? (
                      <img 
                        src="/templo.png"
                        alt="Templo.bol Logo" 
                        className="w-11 h-11 object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <RiDashboardLine className="w-8 h-8 text-yellow-400" />
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-base font-bold text-white group-hover:text-yellow-300 transition-colors">
                    Templo.{" "}
                    <span className="text-yellow-400">Bol</span>
                  </h1>
                  <span className="text-xs text-yellow-400 font-medium uppercase tracking-wide">
                    Entrenador
                  </span>
                </div>
              </div>
            </div>

            {/* Menú móvil */}
            <div className="px-4 py-4 space-y-2 h-[calc(100vh-160px)] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                  Menú Principal
                </h3>
                <div className="space-y-1">
                  {menuItems.map(({ to, icon: Icon, label, color }) => (
                    <Link
                      key={label}
                      to={to}
                      className={`group flex items-center gap-3 py-2.5 px-3 rounded-xl 
                        transition-all duration-300 font-medium select-none
                        ${isActiveRoute(to) 
                          ? 'bg-gradient-to-r from-yellow-400/15 to-yellow-500/15 text-yellow-300' 
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                        }
                      `}
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color}`}>
                        <Icon className="text-base text-white" />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer móvil */}
            <div className="h-20 px-4 border-t border-gray-700/50 flex items-center justify-center">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-all duration-300 group text-red-400 hover:text-red-300"
              >
                <RiLogoutCircleRLine className="text-base" />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Overlay móvil */}
          {showSidebar && (
            <div
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          )}
        </>
      )}

      {/* Contenido principal */}
      <main className={`
        transition-all duration-300 ease-in-out min-h-screen pt-20
        ${!isMobile ? (isCollapsed ? 'ml-20' : 'ml-64') : 'ml-0'}
      `}>
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default IntegratedLayoutEntrenador;