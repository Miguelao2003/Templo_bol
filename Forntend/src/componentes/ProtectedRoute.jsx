import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated, getLocalUser } from "../services/auth";

const ProtectedRoute = ({ allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      console.log("=== ProtectedRoute DEBUG ===");
      console.log("ProtectedRoute - Current path:", location.pathname);
      console.log("ProtectedRoute - Allowed roles:", allowedRoles);
      
      // ✅ Verificar autenticación directamente desde localStorage
      const authenticated = isAuthenticated();
      const localUser = getLocalUser();
      
      console.log("ProtectedRoute - Authenticated:", authenticated);
      console.log("ProtectedRoute - Local user:", localUser);
      
      if (authenticated && localUser) {
        console.log("ProtectedRoute - User role:", localUser.rol);
        console.log("ProtectedRoute - User role (lowercase):", localUser.rol?.toLowerCase());
        setUser(localUser);
      } else {
        console.log("ProtectedRoute - No authentication found");
        setUser(null);
      }
      
      setLoading(false);
      console.log("=============================");
    };

    // ✅ Ejecutar inmediatamente de forma síncrona
    checkAuth();
  }, [location.pathname, allowedRoles]);

  // 1. Mostrar loading
  if (loading) {
    console.log("🔄 ProtectedRoute: Showing loading...");
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // 2. Verificar si hay usuario
  if (!user) {
    console.log("❌ ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verificar roles
  const userRole = user.rol?.toLowerCase();
  console.log("🔐 ProtectedRoute: Checking roles...");
  console.log("   - User role:", userRole);
  console.log("   - Allowed roles:", allowedRoles);
  console.log("   - Role check:", allowedRoles ? allowedRoles.includes(userRole) : "No role restriction");

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`❌ ProtectedRoute: Role '${userRole}' not allowed, redirecting to /${userRole}/perfil`);
    
    // ✅ CORREGIDO: Usar las rutas correctas según el rol
    let defaultRoute;
    switch (userRole) {
      case 'administrador':
        defaultRoute = '/administrador/perfil';
        break;
      case 'entrenador':
        defaultRoute = '/entrenador/perfil';
        break;
      case 'cliente':
        defaultRoute = '/cliente/perfil';
        break;
      default:
        defaultRoute = '/login';
    }
    
    return <Navigate to={defaultRoute} replace />;
  }

  // 4. Todo OK, mostrar contenido
  console.log("✅ ProtectedRoute: Access granted, rendering Outlet");
  return <Outlet />;
};

export default ProtectedRoute;