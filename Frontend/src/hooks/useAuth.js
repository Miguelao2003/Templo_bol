// hooks/useAuth.js - Hook actualizado para manejar nivel y datos completos para IA

import { useState, useEffect } from 'react';
import { getLocalUser, isAuthenticated, getCurrentUser } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay token y usuario en localStorage
      if (isAuthenticated()) {
        const localUser = getLocalUser();
        setUser(localUser);
        setAuthenticated(true);
        
        // Opcionalmente, verificar con el backend
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            // Actualizar localStorage con datos frescos
            localStorage.setItem('user', JSON.stringify(currentUser));
          }
        } catch (error) {
          console.warn('No se pudo verificar usuario con el backend:', error);
          // Mantener usuario local si el backend falla
        }
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthenticated(false);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  // ACTUALIZADO: Verificar si el usuario tiene perfil completo para IA (incluyendo nivel)
  const hasCompleteProfile = () => {
    return user && 
           user.genero && 
           user.edad && 
           user.peso && 
           user.altura && 
           user.objetivo && 
           user.nivel;  // NUEVO: Incluir nivel
  };

  // ACTUALIZADO: Obtener datos formateados para IA (incluyendo nivel)
  const getProfileForIA = () => {
    if (!user || !hasCompleteProfile()) return null;
    
    return {
      genero: user.genero,
      edad: user.edad,
      peso: user.peso,
      altura: user.altura,
      objetivo: user.objetivo,
      nivel: user.nivel || 'intermedio',  // NUEVO: Incluir nivel con default
      id_usuario: user.id_usuario,
      nombre: user.nombre
    };
  };

  // NUEVO: Función para verificar qué datos faltan
  const getDataCompleteness = () => {
    if (!user) return { complete: false, missing: ['No hay usuario logueado'] };
    
    const missing = [];
    if (!user.genero) missing.push('género');
    if (!user.edad) missing.push('edad');
    if (!user.peso) missing.push('peso');
    if (!user.altura) missing.push('altura');
    if (!user.objetivo) missing.push('objetivo');
    if (!user.nivel) missing.push('nivel');
    
    return {
      complete: missing.length === 0,
      missing,
      hasBasicData: user.genero && user.edad && user.peso && user.objetivo,
      needsHeight: !user.altura,
      needsLevel: !user.nivel
    };
  };

  return {
    user,
    loading,
    authenticated,
    hasCompleteProfile: hasCompleteProfile(),
    profileForIA: getProfileForIA(),
    logout,
    updateUser,
    refreshAuth: checkAuthStatus,
    getDataCompleteness  // NUEVO: Exponer función de completeness
  };
};