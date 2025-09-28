import React from "react";
import { 
  RiCloseLine, 
  RiDeleteBinLine, 
  RiAlertLine,
  RiInformationLine,
  RiErrorWarningLine,
  RiBodyScanLine,
  RiFunctionLine,
  RiRepeatLine,
  RiRunLine,
  RiListCheck2
} from "react-icons/ri";

const CambiarEstadoModal = ({ isOpen, onClose, onConfirm, rutina, error }) => {
  if (!isOpen || !rutina) {
    return null;
  }

  const PARTES_MUSCULO = [
    { value: "pecho", label: "Pecho", color: "bg-red-500/20 text-red-400" },
    { value: "bicep", label: "Bícep", color: "bg-blue-500/20 text-blue-400" },
    { value: "tricep", label: "Trícep", color: "bg-green-500/20 text-green-400" },
    { value: "espalda", label: "Espalda", color: "bg-purple-500/20 text-purple-400" },
    { value: "hombro", label: "Hombros", color: "bg-pink-500/20 text-pink-400" },
    { value: "pierna", label: "Piernas", color: "bg-orange-500/20 text-orange-400" },
    { value: "abdomen", label: "Abdomen", color: "bg-cyan-500/20 text-cyan-400" },
  ];

  const getMusculoLabel = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.label : value;
  };

  const getMusculoColor = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.color : 'bg-gray-500/20 text-gray-400';
  };

  // Obtener conteos de músculos únicos
  const getMusculosUnicos = () => {
    if (!rutina.partes_musculo || !Array.isArray(rutina.partes_musculo)) return [];
    const musculos = [...new Set(rutina.partes_musculo)]; // Eliminar duplicados
    return musculos.map(musculo => ({
      value: musculo,
      label: getMusculoLabel(musculo),
      color: getMusculoColor(musculo),
      count: rutina.partes_musculo.filter(m => m === musculo).length
    }));
  };

  const getTotalEjercicios = () => {
    return rutina.nombres_ejercicios ? rutina.nombres_ejercicios.length : 0;
  };

  const getTotalSeries = () => {
    return rutina.series && Array.isArray(rutina.series) 
      ? rutina.series.reduce((total, series) => total + series, 0) 
      : 0;
  };

  const getTotalRepeticiones = () => {
    return rutina.repeticiones && Array.isArray(rutina.repeticiones)
      ? rutina.repeticiones.reduce((total, reps) => total + reps, 0)
      : 0;
  };

  const musculosUnicos = getMusculosUnicos();
  const totalEjercicios = getTotalEjercicios();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 backdrop-blur-sm p-4 pt-20">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-4xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <RiDeleteBinLine className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Eliminar Rutina
              </h2>
              <p className="text-sm text-gray-400">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Mensaje de advertencia principal */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <RiAlertLine className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium mb-2">
                ¿Estás seguro que deseas eliminar esta rutina completa?
              </p>
              <p className="text-gray-300 text-sm">
                Esta acción eliminará permanentemente la rutina con {totalEjercicios} ejercicios de tu lista de rutinas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Información general de la rutina */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
              <RiInformationLine className="h-5 w-5 mr-2" />
              Información General
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">ID de Rutina:</span>
                <span className="text-white font-medium">#{rutina.id_rutina}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <RiRunLine className="h-4 w-4 mr-1" />
                  Total de Ejercicios:
                </span>
                <span className="text-white font-medium">{totalEjercicios}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <RiRepeatLine className="h-4 w-4 mr-1" />
                  Total de Series:
                </span>
                <span className="text-white font-medium">{getTotalSeries()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <RiFunctionLine className="h-4 w-4 mr-1" />
                  Total de Repeticiones:
                </span>
                <span className="text-white font-medium">{getTotalRepeticiones()}</span>
              </div>

              {/* Músculos trabajados */}
              <div>
                <span className="text-gray-400 block mb-2 flex items-center">
                  <RiBodyScanLine className="h-4 w-4 mr-1" />
                  Músculos Trabajados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {musculosUnicos.map((musculo) => (
                    <span
                      key={musculo.value}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${musculo.color} border-opacity-30`}
                    >
                      {musculo.label} ({musculo.count}x)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de ejercicios */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 border-b border-gray-600 pb-2 flex items-center">
              <RiListCheck2 className="h-5 w-5 mr-2" />
              Ejercicios ({totalEjercicios})
            </h3>
            
            {totalEjercicios > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {rutina.nombres_ejercicios.map((nombre, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-100 text-sm mb-1">{nombre}</h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <span className="flex items-center">
                            <RiFunctionLine className="h-3 w-3 mr-1" />
                            {rutina.repeticiones ? rutina.repeticiones[index] : 'N/A'} reps
                          </span>
                          <span className="flex items-center">
                            <RiRepeatLine className="h-3 w-3 mr-1" />
                            {rutina.series ? rutina.series[index] : 'N/A'} series
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        getMusculoColor(rutina.partes_musculo ? rutina.partes_musculo[index] : '')
                      } border-opacity-30 ml-2`}>
                        {getMusculoLabel(rutina.partes_musculo ? rutina.partes_musculo[index] : '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No hay ejercicios para mostrar</p>
              </div>
            )}
          </div>
        </div>

        {/* Error de eliminación si existe */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <RiErrorWarningLine className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium mb-1">
                  Error al eliminar rutina
                </p>
                <p className="text-gray-300 text-sm">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Información sobre las consecuencias */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <RiInformationLine className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium mb-2">
                Consecuencias de eliminar esta rutina:
              </p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Se eliminarán permanentemente {totalEjercicios} ejercicios</li>
                <li>• La rutina se eliminará completamente de tu lista</li>
                <li>• No podrás asignarla a nuevos horarios</li>
                <li>• Los horarios activos que usan esta rutina podrían verse afectados</li>
                <li>• Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmación adicional */}
        <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <RiAlertLine className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <p className="text-gray-300 text-sm">
              <strong className="text-orange-400">Importante:</strong> Si esta rutina está siendo utilizada en horarios activos, 
              la eliminación podría afectar esos entrenamientos. Asegúrate de que no esté en uso antes de proceder.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center space-x-2"
          >
            <RiDeleteBinLine className="h-4 w-4" />
            <span>Sí, eliminar rutina completa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CambiarEstadoModal;