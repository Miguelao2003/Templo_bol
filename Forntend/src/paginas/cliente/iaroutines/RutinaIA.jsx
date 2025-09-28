// components/RutinaIA.jsx - Componente actualizado para manejar usuarios con datos completos e historial

import React, { useState, useEffect } from "react";
import iaClientService from "../../../services/ia_routines_client";
import { useAuth } from "../../../hooks/useAuth";
import HistorialPanel from './HistorialPanel';  // Ajustar ruta según tu estructura

import {
  RiRobotLine,
  RiUser3Line,
  RiRefreshLine,
  RiArrowLeftLine,
  RiFireLine,
  RiBarChart2Line,
  RiCalendarLine,
  RiTrophyLine,
  RiHeartPulseLine,
  RiFlashlightLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiCheckboxCircleLine,
  RiEyeLine,
  RiTimeLine,
  RiHistoryLine  // AGREGADO: Import para historial
} from "react-icons/ri";

const RutinaIA = () => {
  // Estados
  const [formData, setFormData] = useState({
    genero: "",
    edad: "",
    peso: "",
    altura: "",
    objetivo: "",
    nivel: "intermedio" // Valor por defecto
  });
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sistemaInfo, setSistemaInfo] = useState(null);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(true);
  const [mostrandoInfoDescanso, setMostrandoInfoDescanso] = useState(false);
  const [historialUsuario, setHistorialUsuario] = useState(null);
  const [mostrandoHistorial, setMostrandoHistorial] = useState(false);
  
  // Hooks y autenticación
  const { user, authenticated, hasCompleteProfile, profileForIA, getDataCompleteness } = useAuth();

  // Verificar completeness de datos usando la nueva función
  const dataCompleteness = getDataCompleteness ? getDataCompleteness() : { complete: false, missing: [] };
  const tienePerfilCompleto = hasCompleteProfile;

  // Efectos
  useEffect(() => {
    verificarSistema();

    // Cargar datos del usuario al formulario
    if (user) {
      setFormData({
        genero: user.genero || "",
        edad: user.edad || "",
        peso: user.peso || "",
        altura: user.altura || "",
        objetivo: user.objetivo || "",
        nivel: user.nivel || "intermedio"
      });
    }
  }, [user]);

  // Funciones
  const verificarSistema = async () => {
    console.log("🔄 Verificando sistema de IA...");
    try {
      const resultado = await iaClientService.verificarSistemaListo();
      console.log("🎯 Resultado verificación:", resultado);
      setSistemaInfo(resultado);
    } catch (error) {
      console.error("❌ Error en verificación:", error);
      setSistemaInfo({ listo: false, error: error.message });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Función para generar rutina con historial integrado
  const generarRutina = async () => {
    if (!sistemaInfo?.listo) {
      setError("El sistema no está disponible. Contacta al administrador.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let resultado;

      // Si el usuario tiene perfil completo, usar endpoint con historial
      if (user && tienePerfilCompleto) {
        console.log('🎯 Usuario con perfil completo, intentando usar historial');
        
        try {
          // Primero obtener historial
          const historialResponse = await iaClientService.obtenerHistorialUsuario(user.id_usuario);
          setHistorialUsuario(historialResponse.data);
          
          // Usar rutina con historial (intentará usar historial si existe)
          resultado = await iaClientService.generarRutinaUsuarioLogueado(user, true);
        } catch (errorHistorial) {
          console.warn('⚠️ Problema con historial, usando rutina estándar:', errorHistorial);
          resultado = await iaClientService.generarRutinaUsuarioLogueado(user, false);
        }
      } else {
        console.log('🎯 Usando formulario, datos:', formData);
        // Validar datos del formulario antes de enviar
        if (!formData.altura) {
          setError("La altura es requerida para generar la rutina");
          setLoading(false);
          return;
        }
        
        resultado = await iaClientService.generarRutinaPersonalizada(formData);
      }

      setRutina(resultado.data);
      setMostrandoFormulario(false);
    } catch (err) {
      console.error('❌ Error generando rutina:', err);
      setError(err.message || "Error al generar rutina");
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar/ocultar historial
  const toggleHistorial = async () => {
    if (!historialUsuario && user?.id_usuario) {
      try {
        const historialResponse = await iaClientService.obtenerHistorialUsuario(user.id_usuario);
        setHistorialUsuario(historialResponse.data);
      } catch (error) {
        console.error('Error obteniendo historial:', error);
      }
    }
    setMostrandoHistorial(!mostrandoHistorial);
  };

  const volverAlFormulario = () => {
    setMostrandoFormulario(true);
    setRutina(null);
    setError("");
    setMostrandoInfoDescanso(false);
  };

  const toggleInfoDescanso = () => {
    setMostrandoInfoDescanso(!mostrandoInfoDescanso);
  };

  const opcionesForm = iaClientService.getOpcionesFormulario();

  // Renderizado condicional si el sistema no está listo
  if (!sistemaInfo?.listo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 pt-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 text-center hover:border-yellow-400/50 transition-all duration-300">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-xl border border-yellow-400/30">
                  <RiRobotLine className="w-12 h-12 text-yellow-400" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 rounded-full blur-xl"></div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Sistema de IA no disponible
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                {sistemaInfo?.error || "El sistema está inicializándose. Intenta de nuevo en unos momentos."}
              </p>

              <button
                onClick={verificarSistema}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-yellow-400/25 flex items-center gap-3 mx-auto"
              >
                <RiRefreshLine className="w-5 h-5" />
                Verificar de nuevo
              </button>

              <div className="mt-8 text-sm text-gray-500 space-y-2">
                <p className="text-yellow-400 font-medium">
                  Si el problema persiste:
                </p>
                <p>1. Verifica que el backend esté ejecutándose</p>
                <p>2. Revisa la consola del navegador (F12)</p>
                <p>3. El modelo puede necesitar ser entrenado primero</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 pt-8 px-4 sm:px-6 lg:px-8">
        {mostrandoFormulario ? (
          <FormularioRutina
            user={user}
            tienePerfilCompleto={tienePerfilCompleto}
            dataCompleteness={dataCompleteness}
            formData={formData}
            handleInputChange={handleInputChange}
            generarRutina={generarRutina}
            loading={loading}
            error={error}
            opcionesForm={opcionesForm}
            sistemaInfo={sistemaInfo}
            toggleInfoDescanso={toggleInfoDescanso}
            mostrandoInfoDescanso={mostrandoInfoDescanso}
            // PROPS PARA HISTORIAL:
            toggleHistorial={toggleHistorial}
            mostrandoHistorial={mostrandoHistorial}
            historialUsuario={historialUsuario}
          />
        ) : (
          <ResultadoRutina
            rutina={rutina}
            volverAlFormulario={volverAlFormulario}
            generarRutina={generarRutina}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Componente de formulario actualizado con historial
const FormularioRutina = ({
  user,
  tienePerfilCompleto,
  dataCompleteness,
  formData,
  handleInputChange,
  generarRutina,
  loading,
  error,
  opcionesForm,
  sistemaInfo,
  toggleInfoDescanso,
  mostrandoInfoDescanso,
  // PROPS PARA HISTORIAL:
  toggleHistorial,
  mostrandoHistorial,
  historialUsuario
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10 mt-6">
        <div className="flex items-center gap-5 mb-8">
          <div className="relative">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg shadow-yellow-400/30">
              <RiRobotLine className="w-8 h-8 text-black" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-2xl blur-xl"></div>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
              Rutina con IA
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Obtén una rutina personalizada de calistenia con sistema de descanso muscular inteligente
            </p>
          </div>
        </div>

        {/* MODIFICADO: Sección de botones con historial */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm ml-1">
            <span className="text-yellow-400 font-medium">
              Generador de Rutinas IA
            </span>
            {sistemaInfo?.sistemaDescansoActivo && (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <RiShieldCheckLine className="w-4 h-4" />
                Sistema de descanso activo
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && tienePerfilCompleto && (
              <button
                onClick={toggleHistorial}
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 hover:bg-blue-700 border border-blue-600 rounded-lg text-sm text-blue-300 transition-all duration-300"
              >
                <RiHistoryLine className="w-4 h-4" />
                {mostrandoHistorial ? 'Ocultar' : 'Ver'} mi historial
              </button>
            )}
            
            <button
              onClick={toggleInfoDescanso}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 transition-all duration-300"
            >
              <RiInformationLine className="w-4 h-4" />
              {mostrandoInfoDescanso ? 'Ocultar info' : 'Ver sistema de descanso'}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de información del sistema de descanso */}
      {mostrandoInfoDescanso && (
        <InfoDescansoPanel sistemaInfo={sistemaInfo} />
      )}

      {/* NUEVO: Panel de historial */}
      {mostrandoHistorial && historialUsuario && (
        <HistorialPanel 
          historial={historialUsuario.estadisticas} 
          mostrarDetalle={true}
        />
      )}

      {/* Usuario logueado con perfil completo */}
      {user && tienePerfilCompleto && (
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black p-8 rounded-2xl mb-8 shadow-lg shadow-yellow-400/25">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-black/20 rounded-xl flex items-center justify-center">
              <RiUser3Line className="w-8 h-8 text-black" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Hola {user.nombre}</h3>
              <p className="text-black/80">
                Tu perfil está completo para generar rutinas personalizadas con descanso muscular inteligente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-sm">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="font-medium">Género</p>
              <p className="text-black/80">{user.genero}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="font-medium">Edad</p>
              <p className="text-black/80">{user.edad} años</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="font-medium">Peso</p>
              <p className="text-black/80">{user.peso} kg</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="font-medium">Altura</p>
              <p className="text-black/80">{user.altura > 10 ? user.altura + ' cm' : user.altura + ' m'}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="font-medium">Nivel</p>
              <p className="text-black/80 capitalize">{user.nivel || 'intermedio'}</p>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <RiTrophyLine className="w-5 h-5 text-black" />
              <span className="font-semibold">Objetivo: {user.objetivo}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine className="w-4 h-4 text-green-600" />
                <span>Rutina adaptada a tu nivel</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine className="w-4 h-4 text-green-600" />
                <span>Descanso muscular automático</span>
              </div>
              <div className="flex items-center gap-2">
                <RiCheckboxCircleLine className="w-4 h-4 text-green-600" />
                <span>Ejercicios personalizados</span>
              </div>
            </div>
          </div>

          <button
            onClick={generarRutina}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-900 text-yellow-400 py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent"></div>
                Generando rutina inteligente...
              </>
            ) : (
              <>
                <RiFlashlightLine className="w-5 h-5" />
                Generar Mi Rutina Personalizada
              </>
            )}
          </button>
        </div>
      )}

      {/* Usuario logueado sin perfil completo */}
      {user && !tienePerfilCompleto && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-yellow-400/50 text-white p-8 rounded-2xl mb-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-xl flex items-center justify-center">
              <RiUser3Line className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Hola {user.nombre}</h3>
              <p className="text-gray-400">
                Para generar tu rutina personalizada, necesitamos completar algunos datos:
              </p>
              {dataCompleteness.missing.length > 0 && (
                <p className="text-red-400 text-sm mt-2">
                  Faltan: {dataCompleteness.missing.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {(!user || !tienePerfilCompleto) && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-yellow-400/50 transition-all duration-300">
          {user && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 p-4 rounded-xl mb-6">
              <p className="text-yellow-400 text-sm">
                Completa los datos que faltan para generar tu rutina personalizada.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              generarRutina();
            }}
            className="space-y-6"
          >
            {/* Género */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Género
              </label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                required
              >
                <option value="">Selecciona tu género</option>
                {opcionesForm.generos.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Edad y Peso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Edad (años)
                </label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleInputChange}
                  min="16"
                  max="80"
                  placeholder="Ej: 25"
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  min="30"
                  max="200"
                  step="0.1"
                  placeholder="Ej: 70"
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Altura - CAMPO IMPORTANTE */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Altura (cm o metros) *
              </label>
              <input
                type="number"
                name="altura"
                value={formData.altura}
                onChange={handleInputChange}
                step="0.01"
                placeholder="Ej: 175 cm o 1.75 m"
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Requerida para calcular TMB e IMC. Puedes usar cm (175) o metros (1.75)
              </p>
            </div>

            {/* Objetivo y Nivel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Objetivo
                </label>
                <select
                  name="objetivo"
                  value={formData.objetivo}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                >
                  <option value="">Selecciona tu objetivo</option>
                  {opcionesForm.objetivos.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo de nivel */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Nivel de Entrenamiento
                </label>
                <select
                  name="nivel"
                  value={formData.nivel}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                >
                  {opcionesForm.niveles.map((opcion) => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botón generar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-yellow-400/25 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                  Generando Rutina Inteligente...
                </>
              ) : (
                <>
                  <RiFlashlightLine className="w-5 h-5" />
                  Generar Rutina con IA
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 bg-red-900/50 border border-red-500/50 p-4 rounded-xl">
          <p className="text-red-400">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
};

// Componente de información del sistema de descanso
const InfoDescansoPanel = ({ sistemaInfo }) => {
  return (
    <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border border-blue-500/30 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <RiShieldCheckLine className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Sistema de Descanso Muscular Inteligente</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración por niveles */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <RiBarChart2Line className="w-5 h-5 text-yellow-400" />
            Configuración por Niveles
          </h4>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-medium">Principiante</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• 6-8 ejercicios por día</p>
                <p>• 1 ejercicio por grupo muscular</p>
                <p>• Enfoque en forma correcta</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-400 font-medium">Intermedio</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• 8-10 ejercicios por día</p>
                <p>• 2-3 ejercicios por grupo muscular</p>
                <p>• Balance fuerza-resistencia</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400 font-medium">Avanzado</span>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                <p>• 9-12 ejercicios por día</p>
                <p>• 3-4 ejercicios por grupo muscular</p>
                <p>• Técnicas avanzadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grupos musculares */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <RiHeartPulseLine className="w-5 h-5 text-yellow-400" />
            Grupos Musculares
          </h4>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400 font-medium">Músculos Grandes</span>
                <span className="text-sm text-gray-400">(48-72h descanso)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['pecho', 'espalda', 'pierna'].map(musculo => (
                  <span key={musculo} className="px-2 py-1 bg-red-400/20 text-red-300 rounded text-sm">
                    {musculo}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-400 font-medium">Músculos Medianos/Pequeños</span>
                <span className="text-sm text-gray-400">(24-48h descanso)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['hombro', 'bicep', 'tricep'].map(musculo => (
                  <span key={musculo} className="px-2 py-1 bg-orange-400/20 text-orange-300 rounded text-sm">
                    {musculo}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-medium">Músculo de Resistencia</span>
                <span className="text-sm text-gray-400">(puede entrenar diario)</span>
              </div>
              <span className="px-2 py-1 bg-green-400/20 text-green-300 rounded text-sm">
                abdomen
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <RiCheckboxCircleLine className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium mb-1">Sistema Activo</p>
            <p className="text-sm text-gray-300">
              El sistema valida automáticamente que no haya conflictos de descanso muscular 
              y respeta los límites de ejercicios por nivel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de resultado de rutina actualizado con historial
const ResultadoRutina = ({
  rutina,
  volverAlFormulario,
  generarRutina,
  loading,
}) => {
  const [mostrandoEstadisticas, setMostrandoEstadisticas] = useState(false);
  const estadisticas = iaClientService.obtenerEstadisticasRutina(rutina);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header con perfil mejorado e historial */}
      <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 text-black p-8 rounded-2xl mb-8 shadow-2xl shadow-yellow-400/25">
        <button
          onClick={volverAlFormulario}
          className="absolute top-6 left-6 bg-black/20 hover:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Volver
        </button>

        <button
          onClick={generarRutina}
          disabled={loading}
          className="absolute top-6 right-6 bg-black/20 hover:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
              Generando...
            </>
          ) : (
            <>
              <RiRefreshLine className="w-4 h-4" />
              Nueva Rutina
            </>
          )}
        </button>

        <div className="text-center pt-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold">Tu Rutina Personalizada</h1>
            <span className="text-2xl">{rutina.perfil.nivelEmoji}</span>
          </div>
          
          <p className="text-black/80 mb-6">{rutina.perfil.nivelDescripcion}</p>

          {/* MODIFICADO: Grid con historial si está disponible */}
          <div className={`grid grid-cols-1 ${rutina.historial && rutina.historial.totalEntrenamientos > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-xl text-center">
              <RiFireLine className="text-3xl mx-auto mb-2" />
              <strong className="block text-sm">TMB</strong>
              <p className="font-semibold">
                {iaClientService.formatearTMB(rutina.perfil.tmb)}
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-xl text-center">
              <RiBarChart2Line className="text-3xl mx-auto mb-2" />
              <strong className="block text-sm">IMC</strong>
              <p className="font-semibold">
                {rutina.perfil.imc} ({rutina.perfil.rangoImc})
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-xl text-center">
              <RiTrophyLine className="text-3xl mx-auto mb-2" />
              <strong className="block text-sm">Nivel</strong>
              <p className="font-semibold capitalize">
                {rutina.perfil.nivel}
              </p>
            </div>

            {/* NUEVO: Mostrar historial si está disponible */}
            {rutina.historial && rutina.historial.totalEntrenamientos > 0 && (
              <div className="bg-black/20 backdrop-blur-sm p-4 rounded-xl text-center">
                <RiHistoryLine className="text-3xl mx-auto mb-2" />
                <strong className="block text-sm">Historial</strong>
                <p className="font-semibold">
                  {rutina.historial.totalEntrenamientos} entrenamientos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl mb-8 hover:border-yellow-400/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl">
              <RiTrophyLine className="w-6 h-6 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white">Resumen de tu rutina</h3>
          </div>

          <button
            onClick={() => setMostrandoEstadisticas(!mostrandoEstadisticas)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-all"
          >
            <RiEyeLine className="w-4 h-4" />
            {mostrandoEstadisticas ? 'Ocultar' : 'Ver'} estadísticas
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <span className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-full text-sm text-gray-300 flex items-center gap-2">
            <RiCalendarLine className="w-4 h-4" />
            {rutina.resumen.totalDias} días de entrenamiento
          </span>
          <span className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-full text-sm text-gray-300 flex items-center gap-2">
            <RiHeartPulseLine className="w-4 h-4" />
            {rutina.resumen.totalEjercicios} ejercicios totales
          </span>
          <span className="bg-gray-700 border border-gray-600 px-4 py-2 rounded-full text-sm text-gray-300 flex items-center gap-2">
            <RiBarChart2Line className="w-4 h-4" />
            {rutina.resumen.gruposUnicos} grupos musculares
          </span>
          <span className="bg-green-700 border border-green-600 px-4 py-2 rounded-full text-sm text-green-300 flex items-center gap-2">
            <RiShieldCheckLine className="w-4 h-4" />
            Descanso respetado
          </span>
          {/* NUEVO: Indicador si se usó historial */}
          {rutina.resumen.historialConsiderado && (
            <span className="bg-blue-700 border border-blue-600 px-4 py-2 rounded-full text-sm text-blue-300 flex items-center gap-2">
              <RiHistoryLine className="w-4 h-4" />
              Historial aplicado
            </span>
          )}
        </div>

        {mostrandoEstadisticas && (
          <EstadisticasPanel estadisticas={estadisticas} rutina={rutina} />
        )}
      </div>

      {/* Plan semanal */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl">
            <RiCalendarLine className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-2xl font-bold text-white">Tu Plan Semanal</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {rutina.planSemanal.map(dia => (
            <DiaCard key={dia.dia} dia={dia} />
          ))}
        </div>
      </div>

      {/* NUEVO: Recomendaciones personales basadas en historial */}
      {rutina.recomendacionesPersonales && rutina.recomendacionesPersonales.length > 0 && (
        <div className="bg-green-900/30 border border-green-500/30 p-6 rounded-2xl mt-8">
          <div className="flex items-center gap-3 mb-4">
            <RiTrophyLine className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-bold text-white">Recomendaciones Personales</h3>
          </div>
          <div className="space-y-2">
            {rutina.recomendacionesPersonales.map((recomendacion, index) => (
              <div key={index} className="flex items-start gap-3">
                <RiCheckboxCircleLine className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{recomendacion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones de descanso */}
      {rutina.resumen.recomendacionesDescanso && rutina.resumen.recomendacionesDescanso.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-2xl mt-8">
          <div className="flex items-center gap-3 mb-4">
            <RiShieldCheckLine className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Recomendaciones de Descanso</h3>
          </div>
          <div className="space-y-2">
            {rutina.resumen.recomendacionesDescanso.map((recomendacion, index) => (
              <div key={index} className="flex items-start gap-3">
                <RiCheckboxCircleLine className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">{recomendacion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6 mt-8">
        <div className="bg-yellow-400/10 border border-yellow-400/30 p-6 rounded-2xl">
          <p className="text-yellow-400 text-center font-medium mb-4">
            {rutina.resumen.mensaje}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={generarRutina}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-yellow-400/25 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                Generando Nueva Rutina...
              </>
            ) : (
              <>
                <RiRefreshLine className="w-5 h-5" />
                Generar Otra Rutina
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de estadísticas detalladas
const EstadisticasPanel = ({ estadisticas, rutina }) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-600">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Promedio por día</h4>
          <p className="text-2xl font-bold text-white">
            {estadisticas.promedioEjerciciosPorDia.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400">ejercicios por día</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Grupo más trabajado</h4>
          <p className="text-lg font-bold text-white capitalize">
            {estadisticas.grupoMasTrabjado?.[0] || 'N/A'}
          </p>
          <p className="text-xs text-gray-400">
            {estadisticas.grupoMasTrabjado?.[1] || 0} días en la semana
          </p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Volumen semanal</h4>
          <p className="text-2xl font-bold text-white">
            {rutina.resumen.volumenSemanal}
          </p>
          <p className="text-xs text-gray-400">repeticiones totales</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Distribución semanal por grupo</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(rutina.resumen.distribucionGrupos).map(([grupo, cantidad]) => (
            <div
              key={grupo}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: `${iaClientService.getColorMusculo(grupo)}20` }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: iaClientService.getColorMusculo(grupo) }}
              ></div>
              <span className="text-white capitalize">{grupo}</span>
              <span className="text-gray-400">({cantidad})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente reutilizable para tarjetas de día actualizado con historial
const DiaCard = ({ dia }) => {
  // Verificar si es día de descanso
  const esDiaDescanso = !dia.ejercicios || dia.ejercicios.length === 0;

  if (esDiaDescanso) {
    // Renderizado especial para días de descanso
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-blue-400/50 transition-all duration-300">
        <div className="bg-gradient-to-r from-blue-800/50 to-indigo-800/50 p-4 lg:p-6 border-b border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg lg:text-xl font-bold text-white">
              {dia.dia}
            </h4>
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span>Día de Descanso</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-blue-300 text-xs lg:text-sm font-medium bg-blue-500/20">
              Recuperación
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <RiShieldCheckLine className="w-3 h-3 text-blue-400" />
              Descanso total
            </span>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <RiShieldCheckLine className="w-8 h-8 text-blue-400" />
            </div>
            
            <h5 className="text-xl font-bold text-white mb-2">Día de Descanso</h5>
            <p className="text-gray-400 text-sm mb-4 max-w-xs">
              Tu cuerpo necesita tiempo para recuperarse y crecer más fuerte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado normal para días de entrenamiento
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-yellow-400/50 transition-all duration-300 transform hover:scale-[1.01]">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 lg:p-6 border-b border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg lg:text-xl font-bold text-white">
            {dia.dia}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{dia.tipoEntrenamiento || 'Entrenamiento'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {dia.gruposMusculares && dia.gruposMusculares.slice(0, 3).map((grupo) => (
            <span
              key={grupo}
              className="px-2 lg:px-3 py-1 rounded-full text-white text-xs lg:text-sm font-medium"
              style={{
                backgroundColor: iaClientService.getColorMusculo(grupo),
              }}
            >
              {grupo}
            </span>
          ))}
          {dia.gruposMusculares && dia.gruposMusculares.length > 3 && (
            <span className="px-2 lg:px-3 py-1 rounded-full text-gray-300 text-xs lg:text-sm font-medium bg-gray-600">
              +{dia.gruposMusculares.length - 3} más
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <RiBarChart2Line className="w-3 h-3" />
            Vol: {dia.volumenTotal || 0}
          </span>
          <span className="flex items-center gap-1">
            <RiHeartPulseLine className="w-3 h-3" />
            {dia.gruposTrabajos || dia.gruposMusculares?.length || 0} grupos
          </span>
        </div>
      </div>

      {/* NUEVO: Indicador de intensidad ajustada por historial */}
      {dia.intensidadModificada && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 mx-4 lg:mx-6 mb-4">
          <div className="flex items-center gap-2">
            <RiInformationLine className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Intensidad ajustada</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Rutina modificada basándose en tu historial de entrenamientos
          </p>
        </div>
      )}
      
      <div className="p-4 lg:p-6">
        <div className="space-y-3 lg:space-y-4">
          {dia.ejercicios.map((ejercicio, ejIndex) => (
            <div
              key={ejercicio.id || `${dia.dia}-${ejIndex}`}
              className="flex items-center justify-between p-3 lg:p-4 bg-gray-700/50 rounded-xl border border-gray-600 hover:border-yellow-400/30 transition-all"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="font-semibold text-white text-sm lg:text-base truncate">
                  {ejercicio.nombre}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs lg:text-sm font-medium"
                    style={{ color: ejercicio.muscleColor }}
                  >
                    ({ejercicio.musculo})
                  </span>
                  {ejercicio.intensidad && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      ejercicio.intensidad === 'Alta' ? 'bg-red-500/20 text-red-400' :
                      ejercicio.intensidad === 'Media' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {ejercicio.intensidad}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-yellow-400 text-sm lg:text-lg">
                  {ejercicio.series} × {ejercicio.repeticiones}
                </div>
                <div className="text-xs text-gray-400">series × reps</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          Total: {dia.totalEjercicios || dia.ejercicios.length} ejercicios
        </div>
      </div>
    </div>
  );
};

export default RutinaIA;