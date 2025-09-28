import { api } from './api';

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      correo: email,
      contrasena: password
    });

    // ⚠️ PROBLEMA SOLUCIONADO: Usar access_token en lugar de token
    const { access_token, user } = response.data;

    // Guardar token y usuario completo
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    if (error.response?.status === 401) {
      throw new Error("Correo o contraseña incorrectos");
    }
    throw new Error(errorData?.detail || error.message);
  }
};

export const registerPublicUser = async (userData) => {
  try {
    // Asegura que los números sean números
    const payload = {
      ...userData,
      peso: parseFloat(userData.peso),
      altura: parseFloat(userData.altura),
      edad: parseInt(userData.edad),
      // rol lo asigna el backend
      // Asegura que categoría esté en el formato correcto
      categoria: userData.categoria.toLowerCase()
    };
    
    console.log("Payload final:", payload); // Para debug

    const response = await api.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    console.error("Error completo:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || "Error en el registro");
  }
};

export const logoutUser = () => {
  // Limpiar localStorage al hacer logout
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Función para obtener usuario actual desde el backend
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

// Función para obtener usuario desde localStorage
export const getLocalUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Error al obtener el usuario local:", e);
    return null;
  }
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = getLocalUser();
  return !!(token && user);
};

// Función para obtener el token
export const getToken = () => {
  return localStorage.getItem('token');
};