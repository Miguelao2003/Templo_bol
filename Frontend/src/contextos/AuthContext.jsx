import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, getCurrentUser, logoutUser, getLocalUser, registerPublicUser } from "../services/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔍 DEBUGGING: Interceptar todos los cambios de usuario
  const setUserWithDebug = (newUser) => {
    const stack = new Error().stack;
    console.log("🔄 AuthContext - CAMBIO DE USUARIO:");
    console.log("   - Usuario anterior:", user);
    console.log("   - Usuario nuevo:", newUser);
    console.log("   - Stack trace:", stack);
    setUser(newUser);
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    console.log("🚀 AuthContext - useEffect INICIAL ejecutándose");
    
    const checkAuth = async () => {
      try {
        // 🔧 PROBLEMA SOLUCIONADO: Primero verificar localStorage
        const localUser = getLocalUser();
        const token = localStorage.getItem('token');
        
        console.log("🔍 AuthContext - Verificando autenticación inicial:");
        console.log("   - Token:", token ? "✅ Existe" : "❌ No existe");
        console.log("   - Local User:", localUser);
        
        if (localUser && token) {
          // Si hay usuario local y token, usar el usuario local
          console.log("✅ AuthContext - Autenticación válida encontrada");
          setUserWithDebug(localUser);
        } else {
          // Si no hay usuario local o token, limpiar todo
          console.log("❌ AuthContext - No hay autenticación válida");
          setUserWithDebug(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error("💥 AuthContext - Error al verificar autenticación:", err);
        setUserWithDebug(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        console.log("🏁 AuthContext - Finalizando verificación inicial");
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // 🔍 DEBUGGING: Monitorear cambios en el usuario
  useEffect(() => {
    console.log("👤 AuthContext - Usuario cambió a:", user);
    if (!user) {
      console.log("⚠️ AuthContext - USUARIO SE PERDIÓ!");
      console.log("   - Token en localStorage:", localStorage.getItem('token') ? "Existe" : "No existe");
      console.log("   - User en localStorage:", localStorage.getItem('user') ? "Existe" : "No existe");
    }
  }, [user]);

  const login = async ({ correo, contrasena }) => {
    setLoading(true);
    try {
      console.log("🔐 AuthContext - Iniciando login con:", correo);
      
      // ✅ loginUser ya maneja todo (token + user en localStorage)
      const response = await loginUser(correo, contrasena);
      
      console.log("✅ AuthContext - Login exitoso:", response);
      console.log("   - Guardando usuario en contexto...");

      // ✅ Solo actualizar el estado del contexto
      setUserWithDebug(response.user);
      setError(null);
      
      console.log("✅ AuthContext - Usuario guardado en contexto");
      return response;
    } catch (err) {
      console.error("💥 AuthContext - Error en login:", err);
      setError(err.message || "Error de autenticación");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 AuthContext - Cerrando sesión");
      
      // Limpiar estado y localStorage
      setUserWithDebug(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      setError(null);
      console.log("✅ AuthContext - Sesión cerrada correctamente");
    } catch (err) {
      console.error("💥 AuthContext - Error al cerrar sesión:", err);
      setError(err.message || "Error al cerrar sesión");
      throw err;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const newUser = await registerPublicUser(userData);
      setError(null);
      return newUser;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar el usuario desde el backend
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUserWithDebug(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
      return userData;
    } catch (err) {
      console.error("💥 Error al refrescar usuario:", err);
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        error, 
        login, 
        logout, 
        register, 
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);