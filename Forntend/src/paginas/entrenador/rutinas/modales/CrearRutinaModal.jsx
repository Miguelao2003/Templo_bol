import React, { useState } from 'react';
import { 
  RiCloseLine, 
  RiAddLine, 
  RiRunLine, 
  RiBodyScanLine, 
  RiRepeatLine, 
  RiFunctionLine,
  RiInformationLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiListCheck2
} from "react-icons/ri";

const CrearRutinaModal = ({ isOpen, onClose, onCreate }) => {
  // Estado para la rutina completa (arrays JSON)
  const [rutina, setRutina] = useState({
    nombres_ejercicios: [],
    series: [],
    repeticiones: [],
    partes_musculo: [],
    id_entrenador: null
  });

  // Estado para el ejercicio actual que se está agregando
  const [ejercicioActual, setEjercicioActual] = useState({
    nombre_ejercicio: '',
    series: '',
    repeticiones: '',
    partes_musculo: ''  // String, no array
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const PARTES_MUSCULO = [
    { value: "pecho", label: "Pecho", color: "bg-red-500/20 text-red-400" },
    { value: "bicep", label: "Bícep", color: "bg-blue-500/20 text-blue-400" },
    { value: "tricep", label: "Trícep", color: "bg-green-500/20 text-green-400" },
    { value: "espalda", label: "Espalda", color: "bg-purple-500/20 text-purple-400" },
    { value: "hombro", label: "Hombros", color: "bg-pink-500/20 text-pink-400" },
    { value: "pierna", label: "Piernas", color: "bg-orange-500/20 text-orange-400" },
    { value: "abdomen", label: "Abdomen", color: "bg-cyan-500/20 text-cyan-400" },
  ];

  // Manejar cambios en el formulario del ejercicio actual
  const handleEjercicioChange = (e) => {
    const { name, value } = e.target;
    setEjercicioActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en partes musculares (solo una por ejercicio)
  const handleParteMuscularChange = (e) => {
    setEjercicioActual(prev => ({
      ...prev,
      partes_musculo: e.target.value  // String directo
    }));
  };

  // Agregar ejercicio a la rutina
  const agregarEjercicio = () => {
    // Validaciones
    if (!ejercicioActual.nombre_ejercicio.trim()) {
      setMensaje('El nombre del ejercicio es requerido');
      return;
    }
    if (!ejercicioActual.series || ejercicioActual.series <= 0) {
      setMensaje('Las series deben ser un número positivo');
      return;
    }
    if (!ejercicioActual.repeticiones || ejercicioActual.repeticiones <= 0) {
      setMensaje('Las repeticiones deben ser un número positivo');
      return;
    }
    if (!ejercicioActual.partes_musculo) {
      setMensaje('Debe seleccionar una parte muscular');
      return;
    }

    // Agregar a los arrays
    setRutina(prev => ({
      ...prev,
      nombres_ejercicios: [...prev.nombres_ejercicios, ejercicioActual.nombre_ejercicio.trim()],
      series: [...prev.series, parseInt(ejercicioActual.series)],
      repeticiones: [...prev.repeticiones, parseInt(ejercicioActual.repeticiones)],
      partes_musculo: [...prev.partes_musculo, ejercicioActual.partes_musculo]
    }));

    // Limpiar formulario
    setEjercicioActual({
      nombre_ejercicio: '',
      series: '',
      repeticiones: '',
      partes_musculo: ''  // String vacío
    });

    setMensaje('Ejercicio agregado correctamente');
    setTimeout(() => setMensaje(''), 3000);
  };

  // Eliminar ejercicio de la rutina
  const eliminarEjercicio = (index) => {
    setRutina(prev => ({
      ...prev,
      nombres_ejercicios: prev.nombres_ejercicios.filter((_, i) => i !== index),
      series: prev.series.filter((_, i) => i !== index),
      repeticiones: prev.repeticiones.filter((_, i) => i !== index),
      partes_musculo: prev.partes_musculo.filter((_, i) => i !== index)
    }));
  };

  // Crear rutina completa
  const crearRutina = async () => {
    if (rutina.nombres_ejercicios.length === 0) {
      setMensaje('Debe agregar al menos un ejercicio');
      return;
    }

    setIsLoading(true);
    try {
      // Preparar datos para el backend - usar nombres correctos del schema
      const rutinaData = {
        nombres_ejercicios: rutina.nombres_ejercicios,
        series: rutina.series,
        repeticiones: rutina.repeticiones,
        partes_musculo: rutina.partes_musculo, // Array de strings
        id_entrenador: rutina.id_entrenador
      };

      console.log('📤 Enviando datos al backend:', rutinaData);
      await onCreate(rutinaData);
      
      // Limpiar formularios
      setRutina({
        nombres_ejercicios: [],
        series: [],
        repeticiones: [],
        partes_musculo: [],
        id_entrenador: null
      });
      setEjercicioActual({
        nombre_ejercicio: '',
        series: '',
        repeticiones: '',
        partes_musculo: ''
      });
      onClose();
    } catch (error) {
      console.error('❌ Error en crearRutina:', error);
      setMensaje('Error al crear la rutina: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const isEjercicioValid = () => {
    return (
      ejercicioActual.nombre_ejercicio?.trim() &&
      ejercicioActual.partes_musculo &&
      ejercicioActual.repeticiones &&
      ejercicioActual.series
    );
  };

  const getMusculoLabel = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.label : value;
  };

  const getMusculoColor = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.color : 'bg-gray-500/20 text-gray-400';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-4xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiAddLine className="h-5 w-5 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400">
              Crear Nueva Rutina
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Agregar ejercicio */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Agregar Ejercicio
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiRunLine className="inline h-4 w-4 mr-2" />
                  Nombre del ejercicio *
                </label>
                <input
                  type="text"
                  name="nombre_ejercicio"
                  value={ejercicioActual.nombre_ejercicio}
                  onChange={handleEjercicioChange}
                  placeholder="Ej: Dominadas comando"
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <RiBodyScanLine className="inline h-4 w-4 mr-2" />
                  Parte muscular *
                </label>
                <select
                  value={ejercicioActual.partes_musculo} // String, no array
                  onChange={handleParteMuscularChange}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                >
                  <option value="">Seleccionar músculo</option>
                  {PARTES_MUSCULO.map((musculo) => (
                    <option key={musculo.value} value={musculo.value}>
                      {musculo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <RiFunctionLine className="inline h-4 w-4 mr-2" />
                    Repeticiones *
                  </label>
                  <input
                    type="number"
                    name="repeticiones"
                    value={ejercicioActual.repeticiones}
                    onChange={handleEjercicioChange}
                    min="1"
                    max="100"
                    placeholder="12"
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <RiRepeatLine className="inline h-4 w-4 mr-2" />
                    Series *
                  </label>
                  <input
                    type="number"
                    name="series"
                    value={ejercicioActual.series}
                    onChange={handleEjercicioChange}
                    min="1"
                    max="20"
                    placeholder="3"
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                onClick={agregarEjercicio}
                disabled={!isEjercicioValid()}
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 ${
                  isEjercicioValid()
                    ? "bg-green-600 hover:bg-green-500 text-white shadow-green-600/25"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                }`}
              >
                <RiAddLine className="h-4 w-4" />
                <span>Agregar Ejercicio</span>
              </button>
            </div>
          </div>

          {/* Panel derecho: Lista de ejercicios */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                Ejercicios Agregados ({rutina.nombres_ejercicios.length})
              </h3>
              <RiListCheck2 className="h-5 w-5 text-yellow-400" />
            </div>

            {rutina.nombres_ejercicios.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <RiInformationLine className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No hay ejercicios agregados aún</p>
                <p className="text-sm text-gray-500 mt-1">Agrega ejercicios usando el formulario de la izquierda</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rutina.nombres_ejercicios.map((nombre, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-100 mb-2">{nombre}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <RiFunctionLine className="h-3 w-3 mr-1" />
                            {rutina.repeticiones[index]} reps
                          </span>
                          <span className="flex items-center">
                            <RiRepeatLine className="h-3 w-3 mr-1" />
                            {rutina.series[index]} series
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMusculoColor(rutina.partes_musculo[index])} border-opacity-30`}>
                            {getMusculoLabel(rutina.partes_musculo[index])}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarEjercicio(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors ml-2"
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className={`mt-4 p-3 rounded-lg border ${
            mensaje.includes('Error') || mensaje.includes('requerido') || mensaje.includes('debe')
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}>
            <RiInformationLine className="inline h-4 w-4 mr-2" />
            {mensaje}
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={crearRutina}
            disabled={rutina.nombres_ejercicios.length === 0 || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center space-x-2 ${
              rutina.nombres_ejercicios.length > 0 && !isLoading
                ? "bg-yellow-500 hover:bg-yellow-400 text-gray-900 shadow-yellow-500/25 hover:shadow-yellow-500/40"
                : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <RiSaveLine className="h-4 w-4" />
            <span>{isLoading ? 'Creando...' : `Crear Rutina (${rutina.nombres_ejercicios.length} ejercicios)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearRutinaModal;