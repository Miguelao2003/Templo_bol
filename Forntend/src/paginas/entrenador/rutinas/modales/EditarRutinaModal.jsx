import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiEditLine,
  RiRunLine,
  RiBodyScanLine,
  RiRepeatLine,
  RiFunctionLine,
  RiInformationLine,
  RiSaveLine,
  RiAddLine,
  RiDeleteBinLine,
  RiListCheck2
} from "react-icons/ri";

const EditarRutinaModal = ({ isOpen, onClose, onSave, rutina }) => {
  // Estado local para manejar la rutina editada
  const [rutinaEditada, setRutinaEditada] = useState({
    nombres_ejercicios: [],
    series: [],
    repeticiones: [],
    partes_musculo: []
  });

  // Estado para el ejercicio que se está editando o agregando
  const [ejercicioActual, setEjercicioActual] = useState({
    nombre_ejercicio: '',
    series: '',
    repeticiones: '',
    partes_musculo: ''
  });

  const [modoEdicion, setModoEdicion] = useState(null); // null, 'agregar', o índice del ejercicio
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

  // Inicializar con datos de la rutina cuando se abre el modal
  useEffect(() => {
    if (isOpen && rutina) {
      setRutinaEditada({
        nombres_ejercicios: rutina.nombres_ejercicios || [],
        series: rutina.series || [],
        repeticiones: rutina.repeticiones || [],
        partes_musculo: rutina.partes_musculo || []
      });
      setModoEdicion(null);
      setEjercicioActual({
        nombre_ejercicio: '',
        series: '',
        repeticiones: '',
        partes_musculo: ''
      });
    }
  }, [isOpen, rutina]);

  // Manejar cambios en el formulario de ejercicio
  const handleEjercicioChange = (e) => {
    const { name, value } = e.target;
    setEjercicioActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Iniciar edición de un ejercicio existente
  const iniciarEdicionEjercicio = (index) => {
    setModoEdicion(index);
    setEjercicioActual({
      nombre_ejercicio: rutinaEditada.nombres_ejercicios[index] || '',
      series: rutinaEditada.series[index]?.toString() || '',
      repeticiones: rutinaEditada.repeticiones[index]?.toString() || '',
      partes_musculo: rutinaEditada.partes_musculo[index] || ''
    });
  };

  // Guardar cambios en un ejercicio
  const guardarEjercicio = () => {
    if (!validarEjercicio()) return;

    const nuevaRutina = { ...rutinaEditada };

    if (modoEdicion === 'agregar') {
      // Agregar nuevo ejercicio
      nuevaRutina.nombres_ejercicios.push(ejercicioActual.nombre_ejercicio.trim());
      nuevaRutina.series.push(parseInt(ejercicioActual.series));
      nuevaRutina.repeticiones.push(parseInt(ejercicioActual.repeticiones));
      nuevaRutina.partes_musculo.push(ejercicioActual.partes_musculo);
    } else if (typeof modoEdicion === 'number') {
      // Editar ejercicio existente
      nuevaRutina.nombres_ejercicios[modoEdicion] = ejercicioActual.nombre_ejercicio.trim();
      nuevaRutina.series[modoEdicion] = parseInt(ejercicioActual.series);
      nuevaRutina.repeticiones[modoEdicion] = parseInt(ejercicioActual.repeticiones);
      nuevaRutina.partes_musculo[modoEdicion] = ejercicioActual.partes_musculo;
    }

    setRutinaEditada(nuevaRutina);
    cancelarEdicion();
    setMensaje('Ejercicio guardado correctamente');
    setTimeout(() => setMensaje(''), 3000);
  };

  // Eliminar ejercicio
  const eliminarEjercicio = (index) => {
    const nuevaRutina = {
      nombres_ejercicios: rutinaEditada.nombres_ejercicios.filter((_, i) => i !== index),
      series: rutinaEditada.series.filter((_, i) => i !== index),
      repeticiones: rutinaEditada.repeticiones.filter((_, i) => i !== index),
      partes_musculo: rutinaEditada.partes_musculo.filter((_, i) => i !== index)
    };
    setRutinaEditada(nuevaRutina);
    if (modoEdicion === index) {
      cancelarEdicion();
    }
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setModoEdicion(null);
    setEjercicioActual({
      nombre_ejercicio: '',
      series: '',
      repeticiones: '',
      partes_musculo: ''
    });
  };

  // Validar ejercicio actual
  const validarEjercicio = () => {
    if (!ejercicioActual.nombre_ejercicio.trim()) {
      setMensaje('El nombre del ejercicio es requerido');
      return false;
    }
    if (!ejercicioActual.series || ejercicioActual.series <= 0) {
      setMensaje('Las series deben ser un número positivo');
      return false;
    }
    if (!ejercicioActual.repeticiones || ejercicioActual.repeticiones <= 0) {
      setMensaje('Las repeticiones deben ser un número positivo');
      return false;
    }
    if (!ejercicioActual.partes_musculo) {
      setMensaje('Debe seleccionar una parte muscular');
      return false;
    }
    return true;
  };

  // Guardar rutina completa
  const guardarRutina = async () => {
    if (rutinaEditada.nombres_ejercicios.length === 0) {
      setMensaje('La rutina debe tener al menos un ejercicio');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(rutinaEditada);
      onClose();
    } catch (error) {
      setMensaje('Error al guardar la rutina: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMusculoLabel = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.label : value;
  };

  const getMusculoColor = (value) => {
    const musculo = PARTES_MUSCULO.find(m => m.value === value);
    return musculo ? musculo.color : 'bg-gray-500/20 text-gray-400';
  };

  if (!isOpen || !rutina) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 backdrop-blur-sm p-4 pt-12">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-5xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiEditLine className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">Editar Rutina</h2>
              <p className="text-gray-400 text-sm">
                ID: {rutina.id_rutina} • {rutinaEditada.nombres_ejercicios.length} ejercicios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Lista de ejercicios */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                Ejercicios en la Rutina
              </h3>
              <button
                onClick={() => setModoEdicion('agregar')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-sm"
              >
                <RiAddLine className="h-4 w-4" />
                Agregar
              </button>
            </div>

            {rutinaEditada.nombres_ejercicios.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <RiInformationLine className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No hay ejercicios en esta rutina</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rutinaEditada.nombres_ejercicios.map((nombre, index) => (
                  <div key={index} className={`bg-gray-800 border rounded-lg p-4 ${
                    modoEdicion === index ? 'border-yellow-500' : 'border-gray-700'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-100 mb-2">{nombre}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                          <span className="flex items-center">
                            <RiFunctionLine className="h-3 w-3 mr-1" />
                            {rutinaEditada.repeticiones[index]} reps
                          </span>
                          <span className="flex items-center">
                            <RiRepeatLine className="h-3 w-3 mr-1" />
                            {rutinaEditada.series[index]} series
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          getMusculoColor(rutinaEditada.partes_musculo[index]) // String simple
                        } border-opacity-30`}>
                          {getMusculoLabel(rutinaEditada.partes_musculo[index])} {/* String simple */}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => iniciarEdicionEjercicio(index)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                        >
                          <RiEditLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarEjercicio(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho: Formulario de edición */}
          <div className="space-y-6">
            {modoEdicion !== null ? (
              <>
                <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
                  {modoEdicion === 'agregar' ? 'Agregar Ejercicio' : `Editando Ejercicio ${modoEdicion + 1}`}
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
                      value={ejercicioActual.partes_musculo}
                      onChange={(e) => setEjercicioActual(prev => ({ ...prev, partes_musculo: e.target.value }))}
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

                  <div className="flex gap-3">
                    <button
                      onClick={guardarEjercicio}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      {modoEdicion === 'agregar' ? 'Agregar' : 'Guardar'}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
                <RiListCheck2 className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 mb-2">Selecciona un ejercicio para editarlo</p>
                <p className="text-sm text-gray-500">O agrega un nuevo ejercicio a la rutina</p>
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

        {/* Información adicional */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <RiInformationLine className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-400 font-medium mb-1">Información importante</p>
              <p className="text-xs text-gray-300">
                Los cambios en esta rutina afectarán todos los horarios y entrenamientos que la utilicen.
                Los clientes verán la rutina actualizada en sus próximas sesiones.
              </p>
            </div>
          </div>
        </div>

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
            onClick={guardarRutina}
            disabled={rutinaEditada.nombres_ejercicios.length === 0 || isLoading || modoEdicion !== null}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg flex items-center space-x-2 ${
              rutinaEditada.nombres_ejercicios.length > 0 && !isLoading && modoEdicion === null
                ? "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/25 hover:shadow-blue-500/40"
                : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <RiSaveLine className="h-4 w-4" />
            <span>
              {isLoading ? 'Guardando...' : `Guardar Rutina (${rutinaEditada.nombres_ejercicios.length} ejercicios)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarRutinaModal;