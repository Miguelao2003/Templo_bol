// components/HistorialPanel.jsx - Nuevo componente para mostrar historial

import React from 'react';
import {
  RiHistoryLine,
  RiBarChart2Line,
  RiCalendarLine,
  RiTrophyLine,
  RiHeartPulseLine,
  RiCheckboxCircleLine,
  RiInformationLine
} from 'react-icons/ri';

const HistorialPanel = ({ historial, mostrarDetalle = false }) => {
  if (!historial || historial.totalEntrenamientos === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <RiHistoryLine className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Sin historial disponible</h3>
        <p className="text-gray-400 text-sm">
          Una vez que completes algunas rutinas, podremos personalizar mejor tus entrenamientos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <RiHistoryLine className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Tu Historial de Entrenamientos</h3>
          <p className="text-sm text-gray-400">
            Basado en {historial.totalEntrenamientos} entrenamientos completados
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-800/30 rounded-lg p-4 text-center">
          <RiCalendarLine className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {historial.entrenamientosPorSemana}
          </div>
          <div className="text-xs text-gray-400">por semana</div>
        </div>

        <div className="bg-green-800/30 rounded-lg p-4 text-center">
          <RiCheckboxCircleLine className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {historial.asistenciaPromedio}%
          </div>
          <div className="text-xs text-gray-400">asistencia</div>
        </div>

        <div className="bg-yellow-800/30 rounded-lg p-4 text-center">
          <RiTrophyLine className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-white capitalize">
            {historial.nivelMasFrecuente}
          </div>
          <div className="text-xs text-gray-400">nivel usual</div>
        </div>

        <div className="bg-purple-800/30 rounded-lg p-4 text-center">
          <RiBarChart2Line className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {historial.totalEntrenamientos}
          </div>
          <div className="text-xs text-gray-400">total</div>
        </div>
      </div>

      {/* Grupos musculares más trabajados */}
      {historial.gruposMasTrabajados && historial.gruposMasTrabajados.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <RiHeartPulseLine className="w-4 h-4 text-blue-400" />
            Grupos musculares más trabajados
          </h4>
          <div className="flex flex-wrap gap-2">
            {historial.gruposMasTrabajados.slice(0, 5).map((grupo, index) => (
              <span
                key={grupo}
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{
                  backgroundColor: getColorMusculo(grupo),
                  opacity: 1 - (index * 0.15) // Degradado de opacidad
                }}
              >
                {grupo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Último entrenamiento */}
      {historial.ultimoEntrenamiento && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Último entrenamiento</p>
              <p className="text-xs text-gray-400">
                {new Date(historial.ultimoEntrenamiento).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-400">
                {calcularDiasDesde(historial.ultimoEntrenamiento)} días atrás
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional si se solicita detalle */}
      {mostrarDetalle && (
        <div className="mt-6 pt-6 border-t border-blue-500/20">
          <div className="bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <RiInformationLine className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium mb-1">Personalización activa</p>
                <p className="text-sm text-gray-300">
                  Esta rutina ha sido ajustada automáticamente basándose en tu historial 
                  de entrenamientos para evitar sobreentrenamiento y optimizar tu progreso.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Funciones helper
const getColorMusculo = (musculo) => {
  const colores = {
    'pecho': '#e91e63',
    'espalda': '#2196f3', 
    'pierna': '#4caf50',
    'bicep': '#ff9800',
    'tricep': '#ff5722',
    'hombro': '#9c27b0',
    'abdomen': '#795548'
  };
  return colores[musculo] || '#607d8b';
};

const calcularDiasDesde = (fecha) => {
  const ahora = new Date();
  const fechaEntrenamiento = new Date(fecha);
  const diffTime = Math.abs(ahora - fechaEntrenamiento);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default HistorialPanel;
