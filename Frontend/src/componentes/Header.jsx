import React from "react";
import {
  RiNotification3Line,
  RiArrowDownSLine,
  RiSettings3Line,
  RiLogoutCircleRLine,
} from "react-icons/ri";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getLocalUser, logoutUser } from "../services/auth";
import userIcon from "../assets/icon.png";

const Header = () => {
  const navigate = useNavigate();
  const user = getLocalUser(); // Obtenemos el usuario desde localStorage

  const handleLogout = () => {
    logoutUser(); // Limpia el localStorage
    navigate("/"); // Redirige al login
  };

  return (
    <header className="h-[7vh] md:h-[10vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b-2 border-yellow-400 shadow-lg px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between md:justify-end">
      {/* Logo/Brand en móvil */}
      <div className="flex items-center md:hidden">

      </div>

      <nav className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">


        {/* Menu de usuario */}
        <Menu
          menuButton={
            <MenuButton className="flex items-center gap-x-2 sm:gap-x-3 hover:bg-gray-800/70 bg-gray-800/30 p-2 sm:p-3 rounded-xl transition-all duration-300 border border-gray-700 hover:border-yellow-400/50 group max-w-fit overflow-hidden">
              <div className="relative">
                <img
                  src={user?.foto || userIcon}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded-full border-2 border-yellow-400 shadow-md"
                  alt="Foto de perfil"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = userIcon;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
              </div>
              
              {/* Información del usuario - completamente responsiva */}
              <div className="hidden sm:flex flex-col text-left min-w-0 max-w-24 md:max-w-32 lg:max-w-40">
                <span className="text-xs md:text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors truncate">
                  {user
                    ? `${user.nombre} ${user.apellido_p}`
                    : "Usuario"}
                </span>
                <span className="text-xs text-yellow-400 font-medium uppercase tracking-wide truncate">
                  {user?.rol || "Usuario"}
                </span>
              </div>

              <RiArrowDownSLine className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors group-hover:rotate-180 duration-300" />
            </MenuButton>
          }
          align="end"
          arrow
          arrowClassName="bg-gray-800 border border-gray-700"
          transition
          menuClassName="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden min-w-64 sm:min-w-80"
        >
          {/* Perfil del usuario */}
          <MenuItem className="p-0 hover:bg-transparent">
            <Link
              to="/perfil"
              className="rounded-lg transition-all duration-300 text-white hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-yellow-400/5 flex items-center gap-x-3 sm:gap-x-4 py-3 sm:py-4 px-4 sm:px-6 flex-1 border-b border-gray-700/50"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={user?.foto || userIcon}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full border-2 border-yellow-400 shadow-lg"
                  alt="Foto de perfil"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
              </div>
              
              <div className="flex flex-col text-sm min-w-0 flex-1">
                <span className="text-sm sm:text-base font-semibold text-white mb-1 truncate">
                  {user
                    ? `${user.nombre} ${user.apellido_p} ${user.apellido_m}`
                    : "Usuario"}
                </span>
                <span className="text-xs sm:text-sm text-yellow-400 font-medium uppercase tracking-wide truncate">
                  {user?.rol || "Rol desconocido"}
                </span>
                <span className="text-xs text-gray-400 mt-1 truncate">
                  {user?.correo || "correo@ejemplo.com"}
                </span>
              </div>
            </Link>
          </MenuItem>

          {/* Configuraciones */}
          <MenuItem className="p-0 hover:bg-transparent">
            <Link
              to="/configuracion"
              className="rounded-lg transition-all duration-300 text-gray-300 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:to-yellow-400/5 hover:text-white flex items-center gap-x-3 sm:gap-x-4 py-2.5 sm:py-3 px-4 sm:px-6 flex-1"
            >
              <RiSettings3Line className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-sm sm:text-base">Configuración</span>
            </Link>
          </MenuItem>

          <hr className="my-2 border-gray-700" />

          {/* Cerrar sesión */}
          <MenuItem className="p-0 hover:bg-transparent">
            <button
              onClick={handleLogout}
              className="rounded-lg transition-all duration-300 text-gray-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-500/10 hover:text-red-400 flex items-center gap-x-3 sm:gap-x-4 py-2.5 sm:py-3 px-4 sm:px-6 flex-1 w-full text-left group"
            >
              <RiLogoutCircleRLine className="w-5 h-5 text-red-400 group-hover:text-red-300 flex-shrink-0" />
              <span className="text-sm sm:text-base">Cerrar sesión</span>
            </button>
          </MenuItem>
        </Menu>
      </nav>
    </header>
  );
};

export default Header;