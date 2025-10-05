// src/hooks/useNotification.js
import { useState } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState({ type: null, message: null });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => hideNotification(), 5000);
  };

  const hideNotification = () => {
    setNotification({ type: null, message: null });
  };

  return { notification, showNotification, hideNotification };
};

// Mensajes predefinidos para operaciones CRUD
export const NotificationMessages = {
  // Mensajes de éxito
  SUCCESS: {
    CREATED: "Se ha creado correctamente",
    UPDATED: "Se ha actualizado correctamente", 
    ACTIVATED: "Se ha activado correctamente",
    DEACTIVATED: "Se ha desactivado correctamente",
    DELETED: "Se ha eliminado correctamente"
  },
  
  // Mensajes de error
  ERROR: {
    CREATE: "Error al crear",
    UPDATE: "Error al actualizar",
    DELETE: "Error al eliminar",
    CHANGE_STATUS: "Error al cambiar estado",
    LOAD: "Error al cargar"
  }
};