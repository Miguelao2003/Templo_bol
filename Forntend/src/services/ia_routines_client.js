// services/ia_routines_client.js - Service actualizado para manejar usuarios con datos completos

import { api } from './api';

class IAClientService {
  
  /**
   * ACTUALIZADO: Generar rutina personalizada para el usuario actual
   * @param {Object} user - Usuario desde localStorage/auth
   * @returns {Promise<Object>} Rutina personalizada
   */
  async generarRutinaUsuarioLogueado(user) {
    try {
      console.log('🎯 Generando rutina para usuario logueado:', user);
      
      // Validar que el usuario tenga los datos necesarios
      const validacion = this.validarDatosUsuario(user);
      if (!validacion.esValido) {
        throw new Error(`Datos incompletos: ${validacion.errores.join(', ')}`);
      }

      // Si tiene id_usuario, usar endpoint para usuario existente
      if (user.id_usuario) {
        console.log('📡 Usando endpoint para usuario registrado');
        const response = await api.post(`/ai/predict-routine-for-user/${user.id_usuario}`);
        
        return {
          success: true,
          data: this.formatearRutina(response.data),
          message: 'Rutina generada exitosamente usando tu perfil',
          sistemaDescanso: response.data.sistemaDescanso || true
        };
      } else {
        // Si no tiene id_usuario, usar datos del perfil directamente
        console.log('📡 Usando datos del perfil sin ID');
        const datosUsuario = {
          genero: this.normalizarGenero(user.genero),
          edad: parseInt(user.edad),
          peso: parseFloat(user.peso),
          altura: this.normalizarAltura(user.altura),
          objetivo: user.objetivo,
          nivel: user.nivel || 'intermedio'
        };
        
        return await this.generarRutinaPersonalizada(datosUsuario);
      }
    } catch (error) {
      console.error('❌ Error generando rutina:', error);
      throw {
        success: false,
        message: error.response?.data?.detail || error.message || 'Error al generar rutina',
        status: error.response?.status
      };
    }
  }

  /**
   * NUEVO: Validar que el usuario tenga todos los datos necesarios
   * @param {Object} user - Usuario a validar
   * @returns {Object} Resultado de validación
   */
  validarDatosUsuario(user) {
    const errores = [];
    
    if (!user.genero) errores.push('género');
    if (!user.edad || user.edad < 16 || user.edad > 80) errores.push('edad válida (16-80)');
    if (!user.peso || user.peso < 30 || user.peso > 200) errores.push('peso válido (30-200 kg)');
    if (!user.altura) errores.push('altura');
    if (!user.objetivo) errores.push('objetivo');
    
    return {
      esValido: errores.length === 0,
      errores,
      datosCompletos: errores.length === 0
    };
  }

  /**
   * NUEVO: Normalizar género para que coincida con el backend
   * @param {string} genero 
   * @returns {string}
   */
  normalizarGenero(genero) {
    if (!genero) return '';
    const g = genero.toLowerCase();
    if (g === 'masculino' || g === 'hombre') return 'Masculino';
    if (g === 'femenino' || g === 'mujer') return 'Femenino';
    return genero;
  }

  /**
   * NUEVO: Normalizar altura (asegurar que esté en el formato correcto)
   * @param {number|string} altura 
   * @returns {number}
   */
  normalizarAltura(altura) {
    if (!altura) return 0;
    const h = parseFloat(altura);
    if (h > 10) {
      return h / 100;
    }
    return h;
  }

  /**
   * Generar rutina para usuario no registrado o con datos específicos
   * @param {Object} datosUsuario - Datos del usuario
   * @returns {Promise<Object>} Rutina personalizada
   */
  async generarRutinaPersonalizada(datosUsuario) {
    try {
      console.log('🎯 Generando rutina personalizada:', datosUsuario);
      
      // Validar datos básicos
      this._validarDatos(datosUsuario);

      const params = new URLSearchParams();
      params.append('genero', datosUsuario.genero);
      params.append('edad', datosUsuario.edad.toString());
      params.append('peso', datosUsuario.peso.toString());
      params.append('altura', this.convertirAlturaAMetros(datosUsuario.altura).toString());
      params.append('objetivo', datosUsuario.objetivo);
      
      // Agregar nivel si está disponible
      if (datosUsuario.nivel) {
        params.append('nivel', datosUsuario.nivel);
      }

      const response = await api.post(`/ai/predict-routine?${params.toString()}`);
      
      return {
        success: true,
        data: this.formatearRutina(response.data),
        message: 'Rutina generada exitosamente',
        sistemaDescanso: true
      };
    } catch (error) {
      console.error('❌ Error generando rutina personalizada:', error);
      
      if (error.message && !error.response) {
        throw { success: false, message: error.message, status: 400 };
      }
      
      throw {
        success: false,
        message: error.response?.data?.detail || 'Error al generar rutina',
        status: error.response?.status
      };
    }
  }

  /**
   * NUEVO: Verificar si un usuario específico tiene datos completos
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async verificarUsuarioCompleto(userId) {
    try {
      const response = await api.get(`/ai/verificar-usuario/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error verificando usuario:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al verificar usuario'
      };
    }
  }

  /**
   * Obtener información del sistema de descanso muscular
   * @returns {Promise<Object>}
   */
  async obtenerInfoDescanso() {
    try {
      const response = await api.get('/ai/descanso-info');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error obteniendo info de descanso:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al obtener información de descanso'
      };
    }
  }

  /**
   * Validar que la distribución actual respete el descanso
   * @returns {Promise<Object>}
   */
  async validarDescansoActual() {
    try {
      const response = await api.get('/ai/validar-descanso');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error validando descanso:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al validar descanso'
      };
    }
  }

  /**
   * Verificar si el sistema está listo (modelo entrenado)
   * @returns {Promise<Object>} - Información completa del estado
   */
  async verificarSistemaListo() {
    try {
      const response = await api.get('/ai/model-status');
      return {
        listo: response.data.modelo_entrenado && response.data.dataset_cargado,
        info: response.data,
        sistemaDescansoActivo: response.data.sistema_descanso_activo || false,
        nivelesDisponibles: response.data.niveles_configurados || [],
        gruposMusculares: response.data.grupos_musculares_disponibles || []
      };
    } catch (error) {
      console.error('❌ Error verificando sistema:', error);
      return {
        listo: false,
        info: null,
        sistemaDescansoActivo: false,
        error: error.message
      };
    }
  }

  /**
   * Formatear rutina para mostrar en la interfaz
   * @param {Object} rutina - Rutina del backend
   * @returns {Object} Rutina formateada para UI
   */
  formatearRutina(rutina) {
    return {
      // Información del usuario
      perfil: {
        nombre: rutina.usuario_nombre || 'Usuario',
        nivel: rutina.perfil.nivel,
        tmb: Math.round(rutina.perfil.tmb),
        imc: parseFloat(rutina.perfil.imc.toFixed(1)),
        rangoImc: rutina.perfil.rango_imc,
        colorImc: this.getColorIMC(rutina.perfil.rango_imc),
        nivelEmoji: this.getEmojiNivel(rutina.perfil.nivel),
        nivelDescripcion: this.getDescripcionNivel(rutina.perfil.nivel)
      },

      // Plan semanal formateado
      planSemanal: rutina.plan_semanal.map(dia => ({
        dia: dia.dia,
        gruposMusculares: dia.grupos_musculares,
        ejercicios: dia.ejercicios.map(ejercicio => ({
          id: `${dia.dia}-${ejercicio.ejercicio}`,
          musculo: ejercicio.musculo,
          nombre: ejercicio.ejercicio,
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
          descripcion: `${ejercicio.series} series × ${ejercicio.repeticiones} reps`,
          muscleColor: this.getColorMusculo(ejercicio.musculo),
          intensidad: this.calcularIntensidad(ejercicio.series, ejercicio.repeticiones),
          volumen: ejercicio.series * ejercicio.repeticiones
        })),
        totalEjercicios: dia.ejercicios.length,
        diaIndex: this.getDiaIndex(dia.dia),
        gruposTrabajos: dia.grupos_musculares.length,
        volumenTotal: dia.ejercicios.reduce((total, ej) => total + (ej.series * ej.repeticiones), 0),
        tipoEntrenamiento: this.clasificarTipoEntrenamiento(dia.grupos_musculares)
      })),

      // Resumen mejorado
      resumen: {
        mensaje: rutina.mensaje,
        totalDias: rutina.plan_semanal.length,
        totalEjercicios: rutina.plan_semanal.reduce((total, dia) => total + dia.ejercicios.length, 0),
        gruposUnicos: [...new Set(rutina.plan_semanal.flatMap(dia => dia.grupos_musculares))].length,
        volumenSemanal: rutina.plan_semanal.reduce((total, dia) => 
          total + dia.ejercicios.reduce((subtotal, ej) => subtotal + (ej.series * ej.repeticiones), 0), 0
        ),
        distribucionGrupos: this.analizarDistribucionGrupos(rutina.plan_semanal),
        sistemaDescanso: true,
        recomendacionesDescanso: this.generarRecomendacionesDescanso(rutina.plan_semanal)
      }
    };
  }

  /**
   * Calcular intensidad del ejercicio
   * @param {number} series 
   * @param {number} repeticiones 
   * @returns {string}
   */
  calcularIntensidad(series, repeticiones) {
    const volumen = series * repeticiones;
    if (volumen >= 60) return 'Alta';
    if (volumen >= 30) return 'Media';
    return 'Baja';
  }

  /**
   * Clasificar tipo de entrenamiento del día
   * @param {Array} grupos 
   * @returns {string}
   */
  clasificarTipoEntrenamiento(grupos) {
    const musculosGrandes = ['pecho', 'espalda', 'pierna'];
    const gruposGrandes = grupos.filter(g => musculosGrandes.includes(g));
    
    if (gruposGrandes.length >= 2) return 'Entrenamiento Intenso';
    if (gruposGrandes.length === 1) return 'Entrenamiento Balanceado';
    return 'Entrenamiento de Detalle';
  }

  /**
   * Analizar distribución de grupos musculares
   * @param {Array} planSemanal 
   * @returns {Object}
   */
  analizarDistribucionGrupos(planSemanal) {
    const conteoGrupos = {};
    
    planSemanal.forEach(dia => {
      dia.grupos_musculares.forEach(grupo => {
        conteoGrupos[grupo] = (conteoGrupos[grupo] || 0) + 1;
      });
    });

    return conteoGrupos;
  }

  /**
   * Generar recomendaciones de descanso
   * @param {Array} planSemanal 
   * @returns {Array}
   */
  generarRecomendacionesDescanso(planSemanal) {
    const recomendaciones = [
      'El sistema respeta automáticamente los tiempos de descanso muscular',
      'Músculos grandes (pecho, espalda, pierna) descansan 48-72h',
      'Músculos pequeños (bicep, tricep) descansan 24-48h',
      'Puedes entrenar abdomen diariamente si lo deseas'
    ];

    const gruposUsados = [...new Set(planSemanal.flatMap(dia => dia.grupos_musculares))];
    
    if (gruposUsados.includes('pecho') && gruposUsados.includes('tricep')) {
      recomendaciones.push('Pecho y tricep están distribuidos correctamente para evitar sobreentrenamiento');
    }

    return recomendaciones;
  }

  /**
   * Obtener descripción del nivel
   * @param {string} nivel 
   * @returns {string}
   */
  getDescripcionNivel(nivel) {
    const descripciones = {
      'principiante': 'Enfoque en movimientos básicos y forma correcta',
      'intermedio': 'Combinación equilibrada de fuerza y resistencia',
      'avanzado': 'Entrenamiento intenso con técnicas avanzadas'
    };
    return descripciones[nivel] || 'Nivel personalizado';
  }

  /**
   * Validar datos de entrada
   * @private
   */
  _validarDatos(datos) {
    const { genero, edad, peso, altura, objetivo } = datos;

    if (!genero || !['Masculino', 'Femenino'].includes(genero)) {
      throw new Error('Selecciona un género válido');
    }

    if (!edad || edad < 16 || edad > 80) {
      throw new Error('La edad debe estar entre 16 y 80 años');
    }

    if (!peso || peso < 30 || peso > 200) {
      throw new Error('El peso debe estar entre 30 y 200 kg');
    }

    if (!altura || (altura < 1.2 && altura < 120)) {
      throw new Error('Ingresa una altura válida');
    }

    if (!objetivo || !['aumento de peso', 'perdida de peso'].includes(objetivo)) {
      throw new Error('Selecciona un objetivo válido');
    }
  }

  /**
   * Convertir altura a metros si viene en cm
   * @param {number} altura
   * @returns {number}
   */
  convertirAlturaAMetros(altura) {
    return altura > 10 ? altura / 100 : altura;
  }

  /**
   * Obtener color según IMC
   * @param {string} rangoImc
   * @returns {string}
   */
  getColorIMC(rangoImc) {
    const colores = {
      'Bajo peso': '#ff9800',
      'Normal': '#4caf50', 
      'Sobrepeso': '#ff5722',
      'Obesidad': '#f44336'
    };
    return colores[rangoImc] || '#757575';
  }

  /**
   * Obtener color por grupo muscular
   * @param {string} musculo
   * @returns {string}
   */
  getColorMusculo(musculo) {
    const colores = {
      'pecho': '#e91e63',
      'espalda': '#2196f3', 
      'pierna': '#4caf50',
      'bicep': '#ff9800',
      'tricep': '#ff5722',
      'hombro': '#9c27b0',
      'abdomen': '#795548',
      'bicep_tricep': '#ff9800'
    };
    return colores[musculo] || '#607d8b';
  }

  /**
   * Obtener índice numérico del día
   * @param {string} dia
   * @returns {number}
   */
  getDiaIndex(dia) {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias.indexOf(dia);
  }

  /**
   * Obtener opciones para formularios
   * @returns {Object}
   */
  getOpcionesFormulario() {
    return {
      generos: [
        { value: 'Masculino', label: '👨 Masculino' },
        { value: 'Femenino', label: '👩 Femenino' }
      ],
      objetivos: [
        { value: 'aumento de peso', label: '💪 Ganar masa muscular' },
        { value: 'perdida de peso', label: '🔥 Perder peso' }
      ],
      niveles: [
        { value: 'principiante', label: '🌱 Principiante' },
        { value: 'intermedio', label: '🔥 Intermedio' },
        { value: 'avanzado', label: '💪 Avanzado' }
      ]
    };
  }

  /**
   * Formatear TMB para mostrar
   * @param {number} tmb
   * @returns {string}
   */
  formatearTMB(tmb) {
    return `${Math.round(tmb)} kcal/día`;
  }

  /**
   * Obtener emoji para nivel
   * @param {string} nivel
   * @returns {string}
   */
  getEmojiNivel(nivel) {
    const emojis = {
      'principiante': '🌱',
      'intermedio': '🔥', 
      'avanzado': '💪'
    };
    return emojis[nivel] || '⭐';
  }

  /**
   * Formatear información del sistema de descanso para mostrar
   * @param {Object} infoDescanso 
   * @returns {Object}
   */
  formatearInfoDescanso(infoDescanso) {
    return {
      reglas: Object.entries(infoDescanso.reglas_descanso).map(([musculo, dias]) => ({
        musculo,
        dias,
        descripcion: dias === 0 ? 'Puede entrenarse diario' : `${dias} día${dias > 1 ? 's' : ''} de descanso`,
        color: this.getColorMusculo(musculo)
      })),
      
      clasificacion: {
        grandes: infoDescanso.musculos_grandes.map(m => ({
          nombre: m,
          color: this.getColorMusculo(m),
          descripcion: 'Músculo grande - 48-72h descanso'
        })),
        medianos: infoDescanso.musculos_medianos.map(m => ({
          nombre: m,
          color: this.getColorMusculo(m),
          descripcion: 'Músculo mediano - 24-48h descanso'
        })),
        pequenos: infoDescanso.musculos_pequenos.map(m => ({
          nombre: m,
          color: this.getColorMusculo(m),
          descripcion: 'Músculo pequeño - 24-48h descanso'
        }))
      },

      configuracionNiveles: Object.entries(infoDescanso.config_ejercicios).map(([nivel, config]) => ({
        nivel,
        emoji: this.getEmojiNivel(nivel),
        ejerciciosPorDia: `${config.total_dia[0]}-${config.total_dia[1]}`,
        ejerciciosPorGrupo: `${config.por_grupo[0]}-${config.por_grupo[1]}`,
        descripcion: this.getDescripcionNivel(nivel)
      }))
    };
  }

  /**
   * Obtener estadísticas de la rutina actual
   * @param {Object} rutina 
   * @returns {Object}
   */
  obtenerEstadisticasRutina(rutina) {
    const stats = {
      diasActivosPorSemana: rutina.planSemanal.length,
      promedioEjerciciosPorDia: rutina.resumen.totalEjercicios / rutina.planSemanal.length,
      grupoMasTrabjado: null,
      distribucionCarga: {},
      recomendaciones: rutina.resumen.recomendacionesDescanso || []
    };

    // Encontrar el grupo más trabajado
    const distribucion = rutina.resumen.distribucionGrupos;
    stats.grupoMasTrabjado = Object.entries(distribucion)
      .sort(([,a], [,b]) => b - a)[0];

    // Calcular distribución de carga
    rutina.planSemanal.forEach(dia => {
      const carga = dia.volumenTotal;
      if (carga >= 100) stats.distribucionCarga.alta = (stats.distribucionCarga.alta || 0) + 1;
      else if (carga >= 50) stats.distribucionCarga.media = (stats.distribucionCarga.media || 0) + 1;
      else stats.distribucionCarga.baja = (stats.distribucionCarga.baja || 0) + 1;
    });

    return stats;
  }
    // Agregar estos métodos a tu ia_routines_client.js existente

  /**
   * NUEVO: Generar rutina considerando historial real de entrenamientos
   * @param {number} userId - ID del usuario
   * @param {number} diasHistorial - Días de historial a considerar (default: 14)
   * @returns {Promise<Object>} Rutina con ajustes por historial
   */
  async generarRutinaConHistorial(userId, diasHistorial = 14) {
    try {
      console.log(`🧠 Generando rutina con historial para usuario ${userId}`);
      
      const response = await api.post(`/ai/predict-routine-with-history/${userId}?dias_historial=${diasHistorial}`);
      
      return {
        success: true,
        data: this.formatearRutinaConHistorial(response.data),
        message: 'Rutina generada considerando tu historial de entrenamientos',
        historialUsado: true
      };
    } catch (error) {
      console.error('❌ Error generando rutina con historial:', error);
      throw {
        success: false,
        message: error.response?.data?.detail || 'Error al generar rutina con historial',
        status: error.response?.status
      };
    }
  }

  /**
   * NUEVO: Obtener historial de entrenamientos del usuario
   * @param {number} userId - ID del usuario
   * @param {number} diasAtras - Días hacia atrás a consultar
   * @returns {Promise<Object>} Historial de entrenamientos
   */
  async obtenerHistorialUsuario(userId, diasAtras = 30) {
    try {
      const response = await api.get(`/ai/historial-usuario/${userId}?dias_atras=${diasAtras}`);
      
      return {
        success: true,
        data: response.data,
        historialEncontrado: response.data.total_reservas_analizadas > 0
      };
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return {
        success: false,
        message: error.response?.data?.detail || 'Error al obtener historial',
        historialEncontrado: false
      };
    }
  }

  /**
   * NUEVO: Formatear rutina con información de historial
   * @param {Object} rutinaConHistorial - Rutina del backend con historial
   * @returns {Object} Rutina formateada para UI
   */
  formatearRutinaConHistorial(rutinaConHistorial) {
    const rutinaBase = this.formatearRutina(rutinaConHistorial);
    
    // Agregar información específica del historial
    return {
      ...rutinaBase,
      
      // Información del historial analizado
      historial: {
        entrenamientosPorSemana: rutinaConHistorial.historial_analizado.entrenamientos_por_semana,
        asistenciaPromedio: rutinaConHistorial.historial_analizado.asistencia_promedio,
        nivelMasFrecuente: rutinaConHistorial.historial_analizado.nivel_mas_frecuente,
        gruposMasTrabajados: rutinaConHistorial.historial_analizado.grupos_mas_trabajados,
        totalEntrenamientos: rutinaConHistorial.historial_analizado.total_entrenamientos,
        ultimoEntrenamiento: rutinaConHistorial.historial_analizado.ultimo_entrenamiento
      },
      
      // Plan semanal con información de ajustes
      planSemanal: rutinaConHistorial.plan_semanal.map(dia => ({
        ...this.formatearDiaConAjustes(dia),
        diaIndex: this.getDiaIndex(dia.dia)
      })),
      
      // Recomendaciones personales basadas en historial
      recomendacionesPersonales: rutinaConHistorial.recomendaciones_personales || [],
      
      // Resumen mejorado con historial
      resumen: {
        ...rutinaBase.resumen,
        mensaje: rutinaConHistorial.mensaje,
        historialConsiderado: true,
        diasAnalizados: rutinaConHistorial.historial_analizado.total_entrenamientos > 0,
        ajustesAplicados: this.contarAjustesAplicados(rutinaConHistorial.plan_semanal)
      }
    };
  }

  /**
   * NUEVO: Formatear día con información de ajustes por historial
   * @param {Object} dia - Día del plan semanal
   * @returns {Object} Día formateado con ajustes
   */
  formatearDiaConAjustes(dia) {
    return {
      dia: dia.dia,
      gruposMusculares: dia.grupos_musculares,
      ejercicios: dia.ejercicios.map(ejercicio => ({
        id: `${dia.dia}-${ejercicio.ejercicio}`,
        musculo: ejercicio.musculo,
        nombre: ejercicio.ejercicio,
        series: ejercicio.series,
        repeticiones: ejercicio.repeticiones,
        descripcion: `${ejercicio.series} series × ${ejercicio.repeticiones} reps`,
        muscleColor: this.getColorMusculo(ejercicio.musculo),
        intensidad: this.calcularIntensidad(ejercicio.series, ejercicio.repeticiones),
        volumen: ejercicio.series * ejercicio.repeticiones
      })),
      totalEjercicios: dia.ejercicios.length,
      esDiaDescanso: dia.es_dia_descanso,
      ajustesAplicados: dia.ajustes_aplicados || [],
      intensidadModificada: dia.intensidad_modificada || false,
      tipoEntrenamiento: this.clasificarTipoEntrenamiento(dia.grupos_musculares),
      volumenTotal: dia.ejercicios.reduce((total, ej) => total + (ej.series * ej.repeticiones), 0)
    };
  }

  /**
   * NUEVO: Contar ajustes aplicados en toda la rutina
   * @param {Array} planSemanal - Plan semanal completo
   * @returns {number} Número total de ajustes aplicados
   */
  contarAjustesAplicados(planSemanal) {
    return planSemanal.reduce((total, dia) => {
      return total + (dia.ajustes_aplicados ? dia.ajustes_aplicados.length : 0);
    }, 0);
  }

  /**
   * ACTUALIZADO: Generar rutina para usuario logueado (ahora con opción de historial)
   * @param {Object} user - Usuario desde localStorage/auth
   * @param {boolean} usarHistorial - Si usar historial de entrenamientos
   * @returns {Promise<Object>} Rutina personalizada
   */
  async generarRutinaUsuarioLogueado(user, usarHistorial = true) {
    try {
      console.log('🎯 Generando rutina para usuario logueado:', user);
      
      // Validar que el usuario tenga los datos necesarios
      const validacion = this.validarDatosUsuario(user);
      if (!validacion.esValido) {
        throw new Error(`Datos incompletos: ${validacion.errores.join(', ')}`);
      }

      // Si tiene id_usuario, intentar usar historial primero
      if (user.id_usuario && usarHistorial) {
        try {
          console.log('📡 Intentando generar rutina con historial...');
          const resultadoHistorial = await this.generarRutinaConHistorial(user.id_usuario);
          
          // Si tiene historial, usar esa rutina
          if (resultadoHistorial.success && resultadoHistorial.data.historial.totalEntrenamientos > 0) {
            return {
              ...resultadoHistorial,
              message: 'Rutina generada considerando tu historial de entrenamientos'
            };
          }
        } catch (errorHistorial) {
          console.warn('⚠️ No se pudo usar historial, usando rutina estándar:', errorHistorial);
        }
      }

      // Fallback: usar endpoint estándar
      console.log('📡 Usando endpoint estándar para usuario registrado');
      const response = await api.post(`/ai/predict-routine-for-user/${user.id_usuario}`);
      
      return {
        success: true,
        data: this.formatearRutina(response.data),
        message: 'Rutina generada usando tu perfil (sin historial disponible)',
        sistemaDescanso: response.data.sistemaDescanso || true,
        historialUsado: false
      };

    } catch (error) {
      console.error('❌ Error generando rutina:', error);
      throw {
        success: false,
        message: error.response?.data?.detail || error.message || 'Error al generar rutina',
        status: error.response?.status
      };
    }
  }
}

// Exportar instancia singleton
const iaClientService = new IAClientService();
export default iaClientService;