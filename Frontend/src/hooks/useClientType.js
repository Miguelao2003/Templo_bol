// hooks/useClientType.js
import { useMemo } from 'react';
import { useAuth } from '../contextos/AuthContext';

/**
 * Hook personalizado para determinar el tipo de cliente
 * @returns {string} - 'powerplate' o 'calistenia'
 */
export const useClientType = () => {
  const { user } = useAuth();

  const clientType = useMemo(() => {
    if (!user || user.rol?.toLowerCase() !== 'cliente') {
      return 'calistenia'; // Valor por defecto
    }

    // Estrategia 1: Campo directo en el usuario
    if (user.tipo_cliente) {
      return user.tipo_cliente.toLowerCase();
    }

    // Estrategia 2: Basado en membresía
    if (user.membresia) {
      const membresia = user.membresia.toLowerCase();
      if (membresia.includes('powerplate') || membresia.includes('power-plate')) {
        return 'powerplate';
      }
    }

    // Estrategia 3: Basado en plan
    if (user.plan) {
      const plan = user.plan.toLowerCase();
      if (plan.includes('powerplate') || plan.includes('power-plate')) {
        return 'powerplate';
      }
    }

    // Estrategia 4: Basado en sucursal
    if (user.sucursal?.tipo) {
      const sucursalTipo = user.sucursal.tipo.toLowerCase();
      if (sucursalTipo === 'powerplate' || sucursalTipo === 'power-plate') {
        return 'powerplate';
      }
    }

    // Estrategia 5: Basado en servicios contratados
    if (user.servicios && Array.isArray(user.servicios)) {
      const hasPowerplate = user.servicios.some(servicio => 
        servicio.tipo?.toLowerCase().includes('powerplate') ||
        servicio.nombre?.toLowerCase().includes('powerplate')
      );
      if (hasPowerplate) {
        return 'powerplate';
      }
    }

    // Estrategia 6: Basado en categoría de cliente
    if (user.categoria) {
      const categoria = user.categoria.toLowerCase();
      if (categoria.includes('powerplate') || categoria.includes('power-plate')) {
        return 'powerplate';
      }
    }

    // Por defecto, calistenia
    return 'calistenia';
  }, [user]);

  return clientType;
};

/**
 * Hook para obtener información completa del tipo de cliente
 * @returns {object} - Información detallada del tipo de cliente
 */
export const useClientTypeInfo = () => {
  const clientType = useClientType();
  const { user } = useAuth();

  const clientInfo = useMemo(() => {
    const baseInfo = {
      type: clientType,
      displayName: clientType === 'powerplate' ? 'Power Plate' : 'Calistenia',
      isActive: Boolean(user && user.rol?.toLowerCase() === 'cliente')
    };

    // Configuraciones específicas por tipo
    if (clientType === 'powerplate') {
      return {
        ...baseInfo,
        features: [
          'Acceso a equipos Power Plate',
          'Entrenamiento de vibración',
          'Sesiones personalizadas',
          'Horarios flexibles'
        ],
        primaryColor: 'blue',
        accentColor: 'yellow',
        hasEquipmentAccess: true,
        maxReservationsPerWeek: 5
      };
    }

    return {
      ...baseInfo,
      features: [
        'Entrenamiento con peso corporal',
        'Rutinas de calistenia',
        'Progresiones personalizadas',
        'Entrenamientos grupales'
      ],
      primaryColor: 'green',
      accentColor: 'yellow',
      hasEquipmentAccess: false,
      maxReservationsPerWeek: 3
    };
  }, [clientType, user]);

  return clientInfo;
};