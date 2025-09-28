import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerPublicUser } from "../../services/auth";
import { InputAuth } from "../../componentes/ui/ControlesFormulario/InputAuth";
import { SelectAuth } from "../../componentes/ui/ControlesFormulario/SelectAuth";
import { BotonAuth } from "../../componentes/ui/BotonAuth";
import {
  RiMailLine,
  RiLockLine,
  RiUserLine,
  RiBodyScanLine,
  RiRulerLine,
  RiCalendarLine,
  RiShieldUserLine,
  RiUserAddLine,
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiAwardLine,
} from "react-icons/ri";

const Registro = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    nombre: "",
    apellido_p: "",
    apellido_m: "",
    correo: "",
    contrasena: "",
    peso: "",
    altura: "",
    edad: "",
    genero: "Masculino",
    objetivo: "perdida de peso",
    categoria: "calistenia",
    nivel: "principiante",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = {
      nombre: "Nombre",
      apellido_p: "Apellido paterno",
      apellido_m: "Apellido materno",
      correo: "Correo electrónico",
      contrasena: "Contraseña",
      peso: "Peso",
      altura: "Altura",
      edad: "Edad",
      genero: "Género",
      objetivo: "Objetivo",
      nivel: "Nivel",
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !userData[field])
      .map(([_, name]) => name);

    if (missingFields.length > 0) {
      setError(
        `Los siguientes campos son obligatorios: ${missingFields.join(", ")}`
      );
      return false;
    }

    if (userData.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (isNaN(userData.peso) || userData.peso <= 0) {
      setError("El peso debe ser mayor a 0");
      return false;
    }

    if (isNaN(userData.altura) || userData.altura <= 0) {
      setError("La altura debe ser mayor a 0");
      return false;
    }

    const edad = parseInt(userData.edad);
    if (isNaN(edad) || edad < 15 || edad > 100) {
      setError("La edad debe estar entre 15 y 100 años");
      return false;
    }

    if (!["Masculino", "Femenino"].includes(userData.genero)) {
      setError("Seleccione un género válido");
      return false;
    }

    if (!["aumento de peso", "perdida de peso"].includes(userData.objetivo)) {
      setError("Seleccione un objetivo válido");
      return false;
    }

    if (!["principiante", "intermedio", "avanzado"].includes(userData.nivel)) {
      setError("Seleccione un nivel válido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    console.log("Datos a enviar al backend:", {
      ...userData,
      peso: parseFloat(userData.peso),
      altura: parseFloat(userData.altura),
      edad: parseInt(userData.edad),
    });

    try {
      await registerPublicUser(userData);
      navigate("/", {
        state: {
          success: "¡Registro exitoso! Por favor inicia sesión.",
          registeredEmail: userData.correo,
        },
      });
    } catch (error) {
      setError(error.message || "Ocurrió un error durante el registro");
    } finally {
      setIsLoading(false);
    }
  };

  const categoriaOptions = [
    { value: "calistenia", label: "Calistenia" },
    { value: "powerplate", label: "Powerplate" },
  ];

  const nivelOptions = [
    { value: "principiante", label: "Principiante" },
    { value: "intermedio", label: "Intermedio" },
    { value: "avanzado", label: "Avanzado" },
  ];

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStep1Valid = () => {
    return userData.nombre && userData.apellido_p && userData.correo && userData.contrasena;
  };

  const isStep2Valid = () => {
    return userData.peso && userData.altura && userData.edad;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent"></div>
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-yellow-500/8 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Card principal */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 md:p-10">
          
          {/* Header con logo */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-36 h-36 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-400/30 p-5">
                {!imageError ? (
                  <img 
                    src="/templo.png"
                    alt="Templo.bol Logo" 
                    className="w-full h-full object-contain rounded-full"
                    onError={() => setImageError(true)}
                    onLoad={() => console.log('Logo cargado en registro')}
                  />
                ) : (
                  <RiUserAddLine className="w-14 h-14 text-white" />
                )}
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/30 via-transparent to-yellow-400/30 rounded-full blur-xl"></div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              Únete a{" "}
              <span className="text-yellow-400 bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                Templo.Bol
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Comienza tu transformación hoy</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step <= currentStep 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/30' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {step < currentStep ? <RiCheckboxCircleLine className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                      step < currentStep ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gray-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Paso {currentStep} de 3 - {
                  currentStep === 1 ? 'Información Personal' : 
                  currentStep === 2 ? 'Datos Físicos' : 
                  'Objetivos y Preferencias'
                }
              </span>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Información Personal</h3>
                  <p className="text-gray-400 text-sm">Cuéntanos sobre ti</p>
                </div>
                
                <InputAuth
                  name="nombre"
                  value={userData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre(s)"
                  required
                  autoComplete="given-name"
                  icon={RiUserLine}
                />
                <InputAuth
                  name="apellido_p"
                  value={userData.apellido_p}
                  onChange={handleChange}
                  placeholder="Apellido paterno"
                  required
                  autoComplete="family-name"
                  icon={RiUserLine}
                />
                <InputAuth
                  name="apellido_m"
                  value={userData.apellido_m}
                  onChange={handleChange}
                  placeholder="Apellido materno"
                  autoComplete="additional-name"
                  icon={RiUserLine}
                />
                <InputAuth
                  type="email"
                  name="correo"
                  value={userData.correo}
                  onChange={handleChange}
                  placeholder="Correo electrónico"
                  required
                  autoComplete="email"
                  icon={RiMailLine}
                />
                <InputAuth
                  type="password"
                  name="contrasena"
                  value={userData.contrasena}
                  onChange={handleChange}
                  placeholder="Contraseña (mínimo 8 caracteres)"
                  required
                  autoComplete="new-password"
                  icon={RiLockLine}
                  showPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>
            )}

            {/* Step 2: Physical Data */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Datos Físicos</h3>
                  <p className="text-gray-400 text-sm">Para calcular tus métricas personalizadas</p>
                </div>
                
                <InputAuth
                  type="number"
                  name="peso"
                  value={userData.peso}
                  onChange={handleChange}
                  placeholder="Peso (kg)"
                  required
                  step="0.1"
                  min="30"
                  icon={RiBodyScanLine}
                />
                <InputAuth
                  type="number"
                  name="altura"
                  value={userData.altura}
                  onChange={handleChange}
                  placeholder="Altura (m) - ej: 1.75"
                  required
                  step="0.01"
                  min="1.30"
                  icon={RiRulerLine}
                />
                <InputAuth
                  type="number"
                  name="edad"
                  value={userData.edad}
                  onChange={handleChange}
                  placeholder="Edad"
                  required
                  min="15"
                  max="100"
                  icon={RiCalendarLine}
                />
                <SelectAuth
                  name="genero"
                  value={userData.genero}
                  onChange={handleChange}
                  options={[
                    { value: "Masculino", label: "Masculino" },
                    { value: "Femenino", label: "Femenino" },
                  ]}
                  icon={RiUserLine}
                />
              </div>
            )}

            {/* Step 3: Goals and Preferences */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Objetivos y Preferencias</h3>
                  <p className="text-gray-400 text-sm">Personaliza tu experiencia</p>
                </div>
                
                <SelectAuth
                  name="objetivo"
                  value={userData.objetivo}
                  onChange={handleChange}
                  options={[
                    { value: "perdida de peso", label: "Pérdida de peso" },
                    { value: "aumento de peso", label: "Aumento de masa muscular" },
                  ]}
                  icon={RiRulerLine}
                />
                <SelectAuth
                  name="categoria"
                  value={userData.categoria}
                  onChange={handleChange}
                  options={categoriaOptions}
                  icon={RiShieldUserLine}
                />
                
                <SelectAuth
                  name="nivel"
                  value={userData.nivel}
                  onChange={handleChange}
                  options={nivelOptions}
                  icon={RiAwardLine}
                />

                {/* Summary card */}
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 border border-yellow-400/30 rounded-xl backdrop-blur-sm">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <RiCheckboxCircleLine className="w-5 h-5" />
                    Resumen de tu perfil
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">Nombre:</span> <span className="text-white">{userData.nombre} {userData.apellido_p}</span></div>
                    <div><span className="text-gray-400">Email:</span> <span className="text-white">{userData.correo}</span></div>
                    <div><span className="text-gray-400">Edad:</span> <span className="text-white">{userData.edad} años</span></div>
                    <div><span className="text-gray-400">Género:</span> <span className="text-white">{userData.genero}</span></div>
                    <div><span className="text-gray-400">Peso:</span> <span className="text-white">{userData.peso} kg</span></div>
                    <div><span className="text-gray-400">Altura:</span> <span className="text-white">{userData.altura} m</span></div>
                    <div><span className="text-gray-400">Objetivo:</span> <span className="text-white">{userData.objetivo === "perdida de peso" ? "Pérdida de peso" : "Aumento de masa muscular"}</span></div>
                    <div><span className="text-gray-400">Nivel:</span> <span className="text-white capitalize">{userData.nivel}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-4 px-6 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white rounded-xl transition-all duration-300 backdrop-blur-sm font-medium flex items-center justify-center gap-2"
                >
                  <RiArrowLeftLine className="w-5 h-5" />
                  Anterior
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={(currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <RiArrowLeftLine className="w-5 h-5 rotate-180" />
                </button>
              ) : (
                <BotonAuth
                  type="submit"
                  loading={isLoading}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <div className="w-5 h-5 border-2 border-black/30 rounded-full animate-spin"></div>
                        <div className="w-5 h-5 border-2 border-t-black border-r-black rounded-full animate-spin absolute top-0 left-0"></div>
                      </div>
                      Registrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <RiUserAddLine className="w-5 h-5" />
                      Crear Cuenta
                    </span>
                  )}
                </BotonAuth>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes cuenta?{" "}
              <Link 
                to="/" 
                className="text-yellow-400 hover:text-yellow-300 font-medium hover:underline transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/20 backdrop-blur-sm rounded-full border border-gray-700/30">
            <RiShieldCheckLine className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">100% seguro y confidencial</span>
          </div>
        </div>
      </div>

      {/* Elementos decorativos adicionales */}
      <div className="absolute top-1/3 left-4 w-2 h-2 bg-yellow-400/60 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 right-8 w-1 h-1 bg-yellow-400/40 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-yellow-500/50 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
};

export default Registro;