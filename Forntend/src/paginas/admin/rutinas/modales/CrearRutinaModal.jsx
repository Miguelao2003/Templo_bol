import React, { useState, useEffect } from 'react';
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
  RiListCheck2,
  RiUserLine,
  RiShieldUserLine,
  RiArrowDownSLine,
  RiLoader4Line,
  RiSearchLine,
  RiCheckLine
} from "react-icons/ri";
import { userService } from "../../../../services/usuarios";

// Componente selector de entrenadores con búsqueda
const EntrenadorSelector = ({ entrenadores, loading, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredEntrenadores = entrenadores.filter(entrenador =>
    `${entrenador.nombre} ${entrenador.apellido_p}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEntrenador = entrenadores.find(e => e.id_usuario === value);

  const handleSelect = (entrenadorId) => {
    onChange({ target: { value: entrenadorId === '' ? '' : entrenadorId } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayText = selectedEntrenador 
    ? `${selectedEntrenador.nombre} ${selectedEntrenador.apellido_p}`
    : 'Sin asignar (Administrador)';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-4 py-3 text-left focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all flex items-center justify-between"
      >
        <span className={selectedEntrenador ? 'text-gray-100' : 'text-gray-400'}>
          {displayText}
        </span>
        <div className="flex items-center space-x-2">
          {loading && (
            <RiLoader4Line className="h-4 w-4 text-yellow-400 animate-spin" />
          )}
          <RiArrowDownSLine className={`h-5 w-5 text-yellow-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          {/* Barra de búsqueda */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar entrenador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-100 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="overflow-y-auto max-h-60">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                !value ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-300'
              }`}
            >
              <span>Sin asignar (Administrador)</span>
              {!value && <RiCheckLine className="h-4 w-4" />}
            </button>

            {loading ? (
              <div className="px-4 py-6 text-center text-gray-400">
                <RiLoader4Line className="h-5 w-5 animate-spin mx-auto mb-2" />
                Cargando entrenadores...
              </div>
            ) : filteredEntrenadores.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400">
                {searchTerm ? 'No se encontraron entrenadores' : 'No hay entrenadores disponibles'}
              </div>
            ) : (
              filteredEntrenadores.map((entrenador) => (
                <button
                  key={entrenador.id_usuario}
                  type="button"
                  onClick={() => handleSelect(entrenador.id_usuario)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    value === entrenador.id_usuario ? 'bg-yellow-500/10 text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">
                      {entrenador.nombre} {entrenador.apellido_p}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entrenador.email}
                    </div>
                  </div>
                  {value === entrenador.id_usuario && <RiCheckLine className="h-4 w-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar el dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

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

  // Estados específicos para administrador
  const [entrenadores, setEntrenadores] = useState([]);
  const [loadingEntrenadores, setLoadingEntrenadores] = useState(false);

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

  // Cargar entrenadores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadEntrenadores();
    }
  }, [isOpen]);

  const loadEntrenadores = async () => {
    setLoadingEntrenadores(true);
    try {
      const entrenadoresData = await userService.getEntrenadores();
      setEntrenadores(entrenadoresData || []);
    } catch (error) {
      console.error('Error cargando entrenadores:', error);
      setMensaje('Error al cargar la lista de entrenadores');
      setEntrenadores([]);
    } finally {
      setLoadingEntrenadores(false);
    }
  };

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

  // Manejar cambio de entrenador asignado
  const handleEntrenadorChange = (e) => {
    const valor = e.target.value;
    setRutina(prev => ({
      ...prev,
      id_entrenador: valor === '' ? null : parseInt(valor)
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

  const getEntrenadorNombre = () => {
    if (!rutina.id_entrenador) return 'Administrador (sin asignar)';
    const entrenador = entrenadores.find(e => e.id_usuario === rutina.id_entrenador);
    return entrenador ? `${entrenador.nombre} ${entrenador.apellido_p}` : 'Entrenador seleccionado';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/30 rounded-xl p-6 w-full max-w-6xl shadow-2xl shadow-yellow-500/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <RiAddLine className="h-5 w-5 text-gray-900" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-400">
              Crear Nueva Rutina (Administrador)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Configuración de rutina */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-yellow-400 border-b border-yellow-500/30 pb-2">
              Configuración de Rutina
            </h3>
            
            {/* Asignación de entrenador */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <RiUserLine className="inline h-4 w-4 mr-2" />
                Asignar a Entrenador
              </label>
              <EntrenadorSelector
                entrenadores={entrenadores}
                loading={loadingEntrenadores}
                value={rutina.id_entrenador}
                onChange={handleEntrenadorChange}
              />
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <RiInformationLine className="h-3 w-3 mr-1" />
                La rutina se asignará al entrenador seleccionado
              </p>
            </div>

            {/* Resumen de rutina */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Resumen de Rutina</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Asignada a:</span>
                  <span className="text-yellow-400">{getEntrenadorNombre()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ejercicios:</span>
                  <span className="text-yellow-400">{rutina.nombres_ejercicios.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Músculos trabajados:</span>
                  <span className="text-yellow-400">{new Set(rutina.partes_musculo).size}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel central: Agregar ejercicio */}
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
                  value={ejercicioActual.partes_musculo}
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
                <p className="text-sm text-gray-500 mt-1">Agrega ejercicios usando el formulario del centro</p>
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

        {/* Información adicional para administrador */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <RiShieldUserLine className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-400 font-medium mb-1">
                Privilegios de Administrador
              </p>
              <p className="text-xs text-gray-300">
                Como administrador, puedes crear rutinas para cualquier entrenador del sistema. 
                La rutina estará disponible inmediatamente en el panel del entrenador asignado.
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