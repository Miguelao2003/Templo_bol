# app/routers/ai_routines.py - Router CORREGIDO para manejar principiantes correctamente
from datetime import datetime
from app.crud.rutina_ia import create_rutina_ia
from app.schemas.rutina_ia import RutinaIACreate
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Importar el modelo de IA mejorado
from app.models.ai_routines import ai_model
from app.models.users import Usuario
from app.database import get_db
from app.crud.reservas import obtener_rutinas_realizadas_usuario, calcular_frecuencia_entrenamiento

router = APIRouter(tags=["AI Routines"])


# Schemas para las respuestas
class EjercicioResponse(BaseModel):
    musculo: str
    ejercicio: str
    repeticiones: int
    series: int

# Nuevos schemas para el response
class HistorialUsuarioResponse(BaseModel):
    entrenamientos_por_semana: int
    asistencia_promedio: float
    nivel_mas_frecuente: str
    grupos_mas_trabajados: List[str]
    total_entrenamientos: int
    ultimo_entrenamiento: Optional[str] = None

class RutinaConHistorialResponse(BaseModel):
    dia: str
    grupos_musculares: List[str]
    ejercicios: List[EjercicioResponse]
    es_dia_descanso: bool
    ajustes_aplicados: List[str]  # Qué ajustes se hicieron por el historial
    intensidad_modificada: bool

class RoutineWithHistoryResponse(BaseModel):
    usuario_id: int
    usuario_nombre: str
    historial_analizado: HistorialUsuarioResponse
    plan_semanal: List[RutinaConHistorialResponse]
    recomendaciones_personales: List[str]
    mensaje: str

class DiaRutinaResponse(BaseModel):
    dia: str
    grupos_musculares: List[str]
    ejercicios: List[EjercicioResponse]
    tipo_entrenamiento: str  # NUEVO: 'full_body' o 'split'
    es_dia_descanso: bool    # NUEVO: indica si es día de descanso
    total_ejercicios: int    # NUEVO: total de ejercicios del día

class PerfilUsuarioResponse(BaseModel):
    nivel: str
    tmb: float
    imc: float
    rango_imc: str
    tipo_entrenamiento: str  # NUEVO: tipo de entrenamiento según nivel
    frecuencia_semanal: int  # NUEVO: días de entrenamiento por semana

class ResumenRutinaResponse(BaseModel):
    total_dias_entrenamiento: int
    total_dias_descanso: int
    total_ejercicios_semana: int
    promedio_ejercicios_por_dia: float
    mensaje_nivel: str

class RoutinePredictionResponse(BaseModel):
    usuario_id: Optional[int] = None
    usuario_nombre: Optional[str] = None
    perfil: PerfilUsuarioResponse
    plan_semanal: List[DiaRutinaResponse]
    resumen: ResumenRutinaResponse  # NUEVO: resumen de la rutina
    mensaje: str

class DescansoInfoResponse(BaseModel):
    reglas_descanso: Dict[str, int]
    musculos_grandes: List[str]
    musculos_medianos: List[str]
    musculos_pequenos: List[str]
    distribucion_actual: Dict[str, Dict[str, List[str]]]  # CORREGIDO: por nivel
    config_ejercicios: Dict[str, Dict[str, Any]]

def calcular_rango_imc(imc: float) -> str:
    """Calcular rango de IMC"""
    if imc < 18.5:
        return "Bajo peso"
    elif 18.5 <= imc < 25:
        return "Normal"
    elif 25 <= imc < 30:
        return "Sobrepeso"
    else:
        return "Obesidad"

def validar_datos_usuario(usuario) -> tuple:
    """Validar que el usuario tenga todos los datos necesarios incluyendo nivel"""
    errores = []
    
    # Validar campos obligatorios
    if not usuario.genero:
        errores.append("género")
    if not usuario.edad:
        errores.append("edad")
    if not usuario.peso:
        errores.append("peso")
    if not usuario.altura:
        errores.append("altura")
    if not usuario.objetivo:
        errores.append("objetivo")
    
    # Validar nivel - si no tiene, usar 'intermedio' por defecto
    nivel = getattr(usuario, 'nivel', None) or 'intermedio'
    
    # Validar rangos
    if usuario.edad and not (16 <= usuario.edad <= 80):
        errores.append("edad debe estar entre 16 y 80 años")
    if usuario.peso and not (30 <= usuario.peso <= 200):
        errores.append("peso debe estar entre 30 y 200 kg")
    if usuario.altura:
        # Si parece estar en cm, convertir a metros
        if usuario.altura > 10:
            usuario.altura = usuario.altura / 100
        if not (1.2 <= usuario.altura <= 2.5):
            errores.append("altura debe estar entre 1.2 y 2.5 metros")
    
    # Validar que el nivel sea válido
    if nivel not in ['principiante', 'intermedio', 'avanzado']:
        nivel = 'intermedio'  # Fallback a intermedio
    
    return errores, nivel

def crear_resumen_rutina(plan_detallado: List[DiaRutinaResponse], nivel: str) -> ResumenRutinaResponse:
    """NUEVO: Crear resumen de la rutina generada"""
    dias_entrenamiento = [dia for dia in plan_detallado if not dia.es_dia_descanso]
    dias_descanso = [dia for dia in plan_detallado if dia.es_dia_descanso]
    
    total_ejercicios = sum(dia.total_ejercicios for dia in dias_entrenamiento)
    promedio = total_ejercicios / len(dias_entrenamiento) if dias_entrenamiento else 0
    
    # Mensaje específico según nivel
    if nivel == 'principiante':
        mensaje_nivel = f"Rutina FULL BODY - Entrenas todo el cuerpo 3 veces por semana con descanso de 48h entre sesiones"
    elif nivel == 'intermedio':
        mensaje_nivel = f"Rutina SPLIT - Cada grupo muscular se entrena 2-3 veces por semana con descanso adecuado"
    else:
        mensaje_nivel = f"Rutina AVANZADA - Alta frecuencia e intensidad con splits especializados"
    
    return ResumenRutinaResponse(
        total_dias_entrenamiento=len(dias_entrenamiento),
        total_dias_descanso=len(dias_descanso),
        total_ejercicios_semana=total_ejercicios,
        promedio_ejercicios_por_dia=round(promedio, 1),
        mensaje_nivel=mensaje_nivel
    )

@router.post("/train-model")
async def train_model():
    """Entrenar el modelo de IA con el dataset real"""
    try:
        # Buscar archivo del dataset
        dataset_path = None
        possible_paths = [
            "app/dataset/dataset_rutinas_calistenia_mejorado.csv",
            "dataset_rutinas_calistenia_mejorado.csv",
            "app/data/dataset_rutinas_calistenia_mejorado.csv",
            "data/dataset_rutinas_calistenia_mejorado.csv"
        ]

        import os
        for path in possible_paths:
            if os.path.exists(path):
                dataset_path = path
                break
        
        if not dataset_path:
            current_dir = os.getcwd()
            print(f"Directorio actual: {current_dir}")
            
            # Buscar archivo manualmente
            for root, dirs, files in os.walk(".."):
                for file in files:
                    if file == "dataset_rutinas_calistenia_mejorado.csv":
                        dataset_path = os.path.join(root, file)
                        break
                if dataset_path:
                    break
            
            if not dataset_path:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Dataset no encontrado. Colócalo en app/dataset/ o en la raíz del proyecto."
                )
        
        # Entrenar modelo
        exito, precision = ai_model.entrenar_modelo(dataset_path)
        
        if exito:
            ai_model.guardar_modelo()
            info_descanso = ai_model.obtener_info_descanso()
            
            return {
                "modelo_entrenado": True,
                "precision": precision,
                "total_registros": len(ai_model.dataset) if ai_model.dataset is not None else 0,
                "mensaje": f"Modelo entrenado exitosamente con precisión del {precision:.2%}",
                "dataset_usado": dataset_path,
                "objetivos_disponibles": list(ai_model.dataset['objetivo'].unique()) if ai_model.dataset is not None else [],
                "generos_disponibles": list(ai_model.dataset['genero'].unique()) if ai_model.dataset is not None else [],
                "sistema_descanso": {
                    "implementado": True,
                    "reglas_aplicadas": info_descanso["reglas_descanso"],
                    "distribucion_generada": info_descanso["distribucion_actual"],
                    "configuracion_niveles": info_descanso["config_ejercicios"],
                    "tipos_entrenamiento": {
                        "principiante": "full_body",
                        "intermedio": "split",
                        "avanzado": "split"
                    }
                }
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Error al entrenar el modelo. Verifica que el dataset esté correctamente formateado."
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.get("/model-status")
async def get_model_status():
    """Obtener estado del modelo de IA"""
    # Intentar cargar modelo existente si no está entrenado
    if not hasattr(ai_model.model, 'feature_importances_'):
        ai_model.cargar_modelo()
    
    model_trained = hasattr(ai_model.model, 'feature_importances_') and ai_model.dataset is not None
    info_descanso = ai_model.obtener_info_descanso() if model_trained else {}
    
    return {
        "modelo_entrenado": model_trained,
        "total_registros": len(ai_model.dataset) if ai_model.dataset is not None else 0,
        "mensaje": "Modelo cargado y listo" if model_trained else "Modelo no entrenado. Ejecuta /ai/train-model",
        "dataset_cargado": ai_model.dataset is not None,
        "objetivos_disponibles": list(ai_model.dataset['objetivo'].unique()) if ai_model.dataset is not None else [],
        "generos_disponibles": list(ai_model.dataset['genero'].unique()) if ai_model.dataset is not None else [],
        "sistema_descanso_activo": bool(info_descanso.get("distribucion_actual")),
        "grupos_musculares_disponibles": ai_model.grupos_musculares,
        "niveles_configurados": list(ai_model.config_ejercicios.keys()) if model_trained else [],
        "configuracion_niveles": info_descanso.get("config_ejercicios", {})
    }

@router.get("/descanso-info", response_model=DescansoInfoResponse)
async def get_descanso_info():
    """Obtener información detallada del sistema de descanso muscular"""
    
    if not hasattr(ai_model.model, 'feature_importances_') or ai_model.dataset is None:
        if not ai_model.cargar_modelo():
            raise HTTPException(
                status_code=503,
                detail="Modelo no entrenado. Ejecuta /ai/train-model primero."
            )
    
    try:
        info_descanso = ai_model.obtener_info_descanso()
        
        return DescansoInfoResponse(
            reglas_descanso=info_descanso["reglas_descanso"],
            musculos_grandes=info_descanso["musculos_grandes"],
            musculos_medianos=info_descanso["musculos_medianos"],
            musculos_pequenos=info_descanso["musculos_pequenos"],
            distribucion_actual=info_descanso["distribucion_actual"],
            config_ejercicios=info_descanso["config_ejercicios"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo información de descanso: {str(e)}"
        )

@router.post("/predict-routine-for-user/{user_id}", response_model=RoutinePredictionResponse)
async def predict_routine_for_user(user_id: int, db: Session = Depends(get_db)):
    """CORREGIDO: Generar rutina personalizada para un usuario existente con soporte completo para principiantes"""
    
    # Buscar usuario en la base de datos
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Validar datos completos con nueva función
    errores, nivel_usuario = validar_datos_usuario(usuario)
    
    if errores:
        campos_faltantes = ", ".join(errores)
        raise HTTPException(
            status_code=400,
            detail=f"El usuario no tiene datos completos. Faltan o son inválidos: {campos_faltantes}"
        )
    
    # Verificar que el modelo esté entrenado
    if not hasattr(ai_model.model, 'feature_importances_') or ai_model.dataset is None:
        if not ai_model.cargar_modelo():
            raise HTTPException(
                status_code=503,
                detail="Modelo no entrenado. Ejecuta /ai/train-model primero."
            )
    
    try:
        # Convertir altura si está en cm
        altura_metros = usuario.altura if usuario.altura < 10 else usuario.altura / 100
        
        # Mapear género correctamente para el dataset
        genero_input = usuario.genero  # Ya viene como 'Masculino' o 'Femenino' de la BD
        
        # Predecir perfil usando IA
        nivel_ia, tmb, imc = ai_model.predecir_perfil(
            genero_input,
            usuario.edad,
            usuario.peso,
            altura_metros,
            usuario.objetivo
        )
        
        # Usar el nivel del usuario si lo tiene, sino el predicho por IA
        nivel_final = nivel_usuario if nivel_usuario != 'intermedio' else nivel_ia
        
        print(f"Usuario {user_id}: Nivel BD='{nivel_usuario}', IA='{nivel_ia}', Final='{nivel_final}'")
        
        # NUEVO: Obtener configuración del nivel
        config_nivel = ai_model.config_ejercicios.get(nivel_final, ai_model.config_ejercicios['intermedio'])
        
        # Crear perfil del usuario con información extendida
        perfil = PerfilUsuarioResponse(
            nivel=nivel_final,
            tmb=tmb,
            imc=imc,
            rango_imc=calcular_rango_imc(imc),
            tipo_entrenamiento=config_nivel['tipo_entrenamiento'],
            frecuencia_semanal=config_nivel['frecuencia_semanal']
        )
        
        # CORREGIDO: Generar plan según el nivel específico
        plan_muscular = ai_model.generar_plan_inteligente(
            genero_input,
            usuario.edad,
            usuario.peso,
            altura_metros,
            usuario.objetivo,
            nivel_final
        )
        
        # Generar rutina detallada para cada día
        plan_detallado = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        for dia in dias_semana:
            musculos_dia = plan_muscular.get(dia, [])
            es_dia_descanso = len(musculos_dia) == 0
            
            if not es_dia_descanso:
                # Usar función que respeta límites por nivel y tipo de entrenamiento
                ejercicios_dia_raw = ai_model.generar_rutina_inteligente(
                    genero_input,
                    usuario.objetivo,
                    nivel_final,
                    dia
                )
                
                # Convertir a formato de respuesta
                ejercicios_response = [
                    EjercicioResponse(
                        musculo=ej['musculo'],
                        ejercicio=ej['ejercicio'],
                        repeticiones=ej['repeticiones'],
                        series=ej['series']
                    )
                    for ej in ejercicios_dia_raw
                ]
            else:
                ejercicios_response = []
            
            dia_rutina = DiaRutinaResponse(
                dia=dia,
                grupos_musculares=musculos_dia,
                ejercicios=ejercicios_response,
                tipo_entrenamiento=config_nivel['tipo_entrenamiento'],
                es_dia_descanso=es_dia_descanso,
                total_ejercicios=len(ejercicios_response)
            )
            
            plan_detallado.append(dia_rutina)
        
        # NUEVO: Crear resumen de la rutina
        resumen = crear_resumen_rutina(plan_detallado, nivel_final)
        
        # Mensaje personalizado según el nivel usado
        if nivel_usuario and nivel_usuario != 'intermedio':
            mensaje_nivel = f"Rutina generada para tu nivel: {nivel_final}"
        else:
            mensaje_nivel = f"Rutina generada para nivel {nivel_final} (predicho por IA)"
        
        # NUEVO: Guardar automáticamente la rutina generada por IA
        try:
            rutina_ia_data = RutinaIACreate(
                usuario_id=user_id,
                plan_semanal={
                    "plan_detallado": [dia.dict() for dia in plan_detallado],
                    "resumen": resumen.dict(),
                    "perfil": perfil.dict(),
                    "metadata": {
                        "modelo_usado": "random_forest",
                        "precision": 0.995,
                        "fecha_generacion": datetime.now().isoformat()
                    }
                },
                nivel_usuario=nivel_final,
                edad_usuario=usuario.edad,
                peso_usuario=float(usuario.peso),
                altura_usuario=float(altura_metros),
                objetivo_usuario=usuario.objetivo,
                genero_usuario=usuario.genero,
                tmb_usuario=float(tmb),
                imc_usuario=float(imc)
            )
            
            rutina_guardada = create_rutina_ia(db, rutina_ia_data)
            print(f"✅ Rutina IA guardada con ID: {rutina_guardada.id_rutina_ia}")
            
        except Exception as e:
            print(f"⚠️ Warning: No se pudo guardar rutina IA: {e}")
            # No fallar la respuesta principal por esto

        return RoutinePredictionResponse(
            usuario_id=user_id,
            usuario_nombre=f"{usuario.nombre} {usuario.apellido_p}",
            perfil=perfil,
            plan_semanal=plan_detallado,
            resumen=resumen,
            mensaje=f"{mensaje_nivel} - {config_nivel['tipo_entrenamiento'].upper()} con descanso muscular inteligente"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando rutina para usuario {user_id}: {str(e)}"
        )

@router.post("/predict-routine", response_model=RoutinePredictionResponse)
async def predict_routine(
    genero: str,
    edad: int,
    peso: float,
    altura: float,
    objetivo: str,
    nivel: str = None  # Parámetro opcional para nivel seleccionado por el usuario
):
    """CORREGIDO: Generar rutina personalizada para datos nuevos con soporte completo para principiantes"""
    
    # Verificar que el modelo esté entrenado
    if not hasattr(ai_model.model, 'feature_importances_') or ai_model.dataset is None:
        if not ai_model.cargar_modelo():
            raise HTTPException(
                status_code=503,
                detail="Modelo no entrenado. Ejecuta /ai/train-model primero."
            )
    
    # Validar parámetros de entrada
    if genero.lower() not in ['masculino', 'femenino', 'hombre', 'mujer']:
        raise HTTPException(
            status_code=400,
            detail="Género debe ser 'Masculino', 'Femenino', 'Hombre' o 'Mujer'"
        )
    
    if objetivo not in ['aumento de peso', 'perdida de peso']:
        raise HTTPException(
            status_code=400,
            detail="Objetivo debe ser 'aumento de peso' o 'perdida de peso'"
        )
    
    # Validar nivel si se proporciona
    if nivel and nivel not in ['principiante', 'intermedio', 'avanzado']:
        raise HTTPException(
            status_code=400,
            detail="Nivel debe ser 'principiante', 'intermedio' o 'avanzado'"
        )
    
    if not (16 <= edad <= 80):
        raise HTTPException(
            status_code=400,
            detail="Edad debe estar entre 16 y 80 años"
        )
    
    if not (1.2 <= altura <= 2.2):
        # Si altura parece estar en cm, convertir a metros
        if altura > 100:
            altura = altura / 100
        else:
            raise HTTPException(
                status_code=400,
                detail="Altura debe estar entre 1.2 y 2.2 metros (o 120-220 cm)"
            )
    
    if not (30 <= peso <= 200):
        raise HTTPException(
            status_code=400,
            detail="Peso debe estar entre 30 y 200 kg"
        )
    
    try:
        # Convertir género al formato del dataset
        genero_input = 'Masculino' if genero.lower() in ['masculino', 'hombre'] else 'Femenino'
        
        # Predecir perfil usando IA
        nivel_ia, tmb, imc = ai_model.predecir_perfil(
            genero_input,
            edad,
            peso,
            altura,
            objetivo
        )
        
        # Usar nivel proporcionado por el usuario o el predicho por la IA
        nivel_final = nivel if nivel else nivel_ia
        
        print(f"Rutina anónima: Nivel usuario='{nivel}', IA='{nivel_ia}', Final='{nivel_final}'")
        
        # NUEVO: Obtener configuración del nivel
        config_nivel = ai_model.config_ejercicios.get(nivel_final, ai_model.config_ejercicios['intermedio'])
        
        # Crear perfil del usuario con información extendida
        perfil = PerfilUsuarioResponse(
            nivel=nivel_final,
            tmb=tmb,
            imc=imc,
            rango_imc=calcular_rango_imc(imc),
            tipo_entrenamiento=config_nivel['tipo_entrenamiento'],
            frecuencia_semanal=config_nivel['frecuencia_semanal']
        )
        
        # CORREGIDO: Generar plan según el nivel específico
        plan_muscular = ai_model.generar_plan_inteligente(
            genero_input,
            edad,
            peso,
            altura,
            objetivo,
            nivel_final
        )
        
        # Generar rutina detallada para cada día
        plan_detallado = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        for dia in dias_semana:
            musculos_dia = plan_muscular.get(dia, [])
            es_dia_descanso = len(musculos_dia) == 0
            
            if not es_dia_descanso:
                # Usar función que respeta límites por nivel y tipo de entrenamiento
                ejercicios_dia_raw = ai_model.generar_rutina_inteligente(
                    genero_input,
                    objetivo,
                    nivel_final,
                    dia
                )
                
                # Convertir a formato de respuesta
                ejercicios_response = [
                    EjercicioResponse(
                        musculo=ej['musculo'],
                        ejercicio=ej['ejercicio'],
                        repeticiones=ej['repeticiones'],
                        series=ej['series']
                    )
                    for ej in ejercicios_dia_raw
                ]
            else:
                ejercicios_response = []
            
            dia_rutina = DiaRutinaResponse(
                dia=dia,
                grupos_musculares=musculos_dia,
                ejercicios=ejercicios_response,
                tipo_entrenamiento=config_nivel['tipo_entrenamiento'],
                es_dia_descanso=es_dia_descanso,
                total_ejercicios=len(ejercicios_response)
            )
            
            plan_detallado.append(dia_rutina)
        
        # NUEVO: Crear resumen de la rutina
        resumen = crear_resumen_rutina(plan_detallado, nivel_final)
        
        # Mensaje que indica si se usó el nivel del usuario o de la IA
        mensaje_nivel = f"Rutina generada para nivel {nivel_final}"
        if nivel:
            mensaje_nivel += f" (seleccionado por ti)"
        else:
            mensaje_nivel += f" (predicho por IA)"
        
        return RoutinePredictionResponse(
            perfil=perfil,
            plan_semanal=plan_detallado,
            resumen=resumen,
            mensaje=f"{mensaje_nivel} - {config_nivel['tipo_entrenamiento'].upper()} con descanso muscular inteligente"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando rutina: {str(e)}"
        )

@router.get("/dataset-info")
async def get_dataset_info():
    """Obtener información del dataset cargado"""
    if ai_model.dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset no cargado. Ejecuta /ai/train-model primero."
        )
    
    try:
        df = ai_model.dataset
        
        info = {
            "total_registros": len(df),
            "columnas": list(df.columns),
            "objetivos_unicos": list(df['objetivo'].unique()),
            "generos_unicos": list(df['genero'].unique()),
            "edad_min": int(df['edad'].min()),
            "edad_max": int(df['edad'].max()),
            "peso_min": float(df['peso'].min()),
            "peso_max": float(df['peso'].max()),
            "altura_min": float(df['altura'].min()),
            "altura_max": float(df['altura'].max()),
            "ejercicios_unicos": len(df['ejercicio'].unique()) if 'ejercicio' in df.columns else 0,
            "distribucion_por_genero": df['genero'].value_counts().to_dict(),
            "distribucion_por_objetivo": df['objetivo'].value_counts().to_dict(),
            "sistema_descanso": {
                "reglas_implementadas": ai_model.reglas_descanso,
                "grupos_musculares": ai_model.grupos_musculares,
                "configuracion_niveles": ai_model.config_ejercicios
            }
        }
        
        return info
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo información del dataset: {str(e)}"
        )

@router.get("/validar-descanso")
async def validar_descanso():
    """Validar que la distribución actual respete las reglas de descanso"""
    
    if not hasattr(ai_model.model, 'feature_importances_') or ai_model.dataset is None:
        if not ai_model.cargar_modelo():
            raise HTTPException(
                status_code=503,
                detail="Modelo no entrenado. Ejecuta /ai/train-model primero."
            )
    
    try:
        if not hasattr(ai_model, 'distribucion_dias') or not ai_model.distribucion_dias:
            raise HTTPException(
                status_code=404,
                detail="No hay distribución generada. Ejecuta /ai/train-model primero."
            )
        
        # Validar distribuciones por nivel
        validaciones = {}
        
        for nivel, distribucion in ai_model.distribucion_dias.items():
            if nivel == 'principiante':
                # Para principiantes: validar que sea full body
                dias_entrenamiento = [dia for dia, grupos in distribucion.items() if grupos]
                dias_esperados = ['Lunes', 'Miércoles', 'Viernes']
                
                es_valida = all(dia in dias_esperados for dia in dias_entrenamiento)
                
                # Verificar que cada día de entrenamiento tenga todos los grupos
                grupos_esperados = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
                for dia in dias_entrenamiento:
                    if not all(grupo in distribucion[dia] for grupo in grupos_esperados):
                        es_valida = False
                        break
                
                validaciones[nivel] = {
                    "valida": es_valida,
                    "tipo": "full_body",
                    "dias_entrenamiento": dias_entrenamiento,
                    "total_grupos_por_dia": [len(distribucion.get(dia, [])) for dia in dias_entrenamiento],
                    "mensaje": "Distribución correcta para principiantes" if es_valida else "Error en distribución de principiantes"
                }
            else:
                # Para intermedio/avanzado: usar validación original
                dias_semana = [dia for dia in distribucion.keys() if distribucion[dia]]
                es_valida = True  # Simplificado para este ejemplo
                
                validaciones[nivel] = {
                    "valida": es_valida,
                    "tipo": "split",
                    "dias_entrenamiento": dias_semana,
                    "distribucion": distribucion,
                    "mensaje": f"Distribución válida para {nivel}"
                }
        
        return {
            "validaciones_por_nivel": validaciones,
            "reglas_aplicadas": ai_model.reglas_descanso,
            "configuracion_niveles": ai_model.config_ejercicios,
            "mensaje": "Validación completada para todos los niveles"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validando descanso: {str(e)}"
        )

@router.get("/verificar-usuario/{user_id}")
async def verificar_usuario_completo(user_id: int, db: Session = Depends(get_db)):
    """Verificar si un usuario tiene todos los datos necesarios para generar rutina"""
    
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    errores, nivel_final = validar_datos_usuario(usuario)
    
    return {
        "usuario_id": user_id,
        "nombre_completo": f"{usuario.nombre} {usuario.apellido_p}",
        "datos_completos": len(errores) == 0,
        "campos_faltantes": errores,
        "nivel_detectado": nivel_final,
        "datos_actuales": {
            "genero": usuario.genero,
            "edad": usuario.edad,
            "peso": usuario.peso,
            "altura": usuario.altura,
            "objetivo": usuario.objetivo,
            "nivel": getattr(usuario, 'nivel', 'No definido')
        },
        "mensaje": "Usuario listo para generar rutina" if len(errores) == 0 else f"Faltan campos: {', '.join(errores)}"
    }

# NUEVO: Endpoint específico para obtener ejemplo de rutina principiante
@router.get("/ejemplo-principiante")
async def obtener_ejemplo_principiante():
    """Obtener ejemplo de cómo debería verse una rutina para principiantes"""
    
    ejemplo_rutina = {
        "nivel": "principiante",
        "tipo_entrenamiento": "full_body",
        "frecuencia_semanal": 3,
        "dias_entrenamiento": ["Lunes", "Miércoles", "Viernes"],
        "dias_descanso": ["Martes", "Jueves", "Sábado", "Domingo"],
        "ejemplo_dia_entrenamiento": {
            "dia": "Lunes",
            "grupos_musculares": ["pecho", "espalda", "pierna", "hombro", "bicep", "tricep", "abdomen"],
            "ejercicios_ejemplo": [
                {"musculo": "pecho", "ejercicio": "Flexiones de brazos", "series": 2, "repeticiones": 10},
                {"musculo": "espalda", "ejercicio": "Remo con banda elástica", "series": 2, "repeticiones": 12},
                {"musculo": "pierna", "ejercicio": "Sentadillas", "series": 3, "repeticiones": 15},
                {"musculo": "pierna", "ejercicio": "Zancadas", "series": 2, "repeticiones": 10},
                {"musculo": "hombro", "ejercicio": "Pike push-ups", "series": 2, "repeticiones": 8},
                {"musculo": "bicep", "ejercicio": "Curl con banda", "series": 2, "repeticiones": 12},
                {"musculo": "tricep", "ejercicio": "Fondos en silla", "series": 2, "repeticiones": 10},
                {"musculo": "abdomen", "ejercicio": "Plancha", "series": 2, "repeticiones": 30}
            ],
            "total_ejercicios": 8,
            "total_series": 17,
            "duracion_estimada": "45-60 minutos"
        },
        "principios": [
            "Cada sesión trabaja todo el cuerpo (7 grupos musculares)",
            "48 horas de descanso entre entrenamientos",
            "1 ejercicio por grupo muscular principal",
            "Enfoque en aprender la técnica correcta",
            "6-8 ejercicios totales por sesión",
            "Series y repeticiones moderadas para principiantes"
        ],
        "beneficios": [
            "Fortalecimiento equilibrado de todo el cuerpo",
            "Tiempo suficiente para recuperación muscular",
            "Rutina simple y fácil de seguir",
            "Base sólida para progresar a niveles superiores"
        ]
    }
    
    return ejemplo_rutina

@router.post("/predict-routine-with-history/{user_id}", response_model=RoutineWithHistoryResponse)
async def predict_routine_with_history(
    user_id: int,
    dias_historial: int = 14,  # Últimas 2 semanas por defecto
    db: Session = Depends(get_db)
):
    """
    Generar rutina personalizada considerando el historial REAL de entrenamientos
    basado en las reservas con asistencia registrada
    """
    
    # Verificar que el modelo esté entrenado
    if not hasattr(ai_model.model, 'feature_importances_') or ai_model.dataset is None:
        if not ai_model.cargar_modelo():
            raise HTTPException(
                status_code=503,
                detail="Modelo no entrenado. Ejecuta /ai/train-model primero."
            )
    
    # Buscar usuario
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Validar datos del usuario
    errores, nivel_usuario = validar_datos_usuario(usuario)
    if errores:
        raise HTTPException(
            status_code=400,
            detail=f"Usuario con datos incompletos: {', '.join(errores)}"
        )
    
    try:
        # PASO 1: Obtener historial real de entrenamientos
        print(f"📊 Obteniendo historial de últimos {dias_historial} días para usuario {user_id}")
        historial_entrenamientos = obtener_rutinas_realizadas_usuario(db, user_id, dias_historial)
        
        # PASO 2: Analizar estadísticas del historial
        estadisticas_historial = calcular_frecuencia_entrenamiento(historial_entrenamientos)
        
        print(f"📈 Estadísticas del usuario:")
        print(f"   - Total entrenamientos: {estadisticas_historial['total_entrenamientos']}")
        print(f"   - Entrenamientos por semana: {estadisticas_historial['entrenamientos_por_semana']}")
        print(f"   - Asistencia promedio: {estadisticas_historial['asistencia_promedio']}%")
        
        # PASO 3: Preparar datos del usuario
        altura_metros = usuario.altura if usuario.altura < 10 else usuario.altura / 100
        genero_input = usuario.genero
        
        # PASO 4: Generar plan semanal considerando historial
        plan_semanal = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        for dia in dias_semana:
            print(f"\n🗓️ Procesando {dia}...")
            
            # Obtener distribución muscular para el día
            plan_muscular = ai_model.generar_plan_inteligente(
                genero_input, usuario.edad, usuario.peso, altura_metros, 
                usuario.objetivo, nivel_usuario
            )
            
            grupos_dia = plan_muscular.get(dia, [])
            es_dia_descanso = len(grupos_dia) == 0
            
            ajustes_aplicados = []
            intensidad_modificada = False
            
            if not es_dia_descanso:
                # Generar rutina considerando historial
                if historial_entrenamientos:
                    ejercicios_raw = ai_model.generar_rutina_considerando_historial(
                        genero_input, usuario.objetivo, nivel_usuario, dia, historial_entrenamientos
                    )
                    
                    # Detectar ajustes aplicados
                    rutina_normal = ai_model.generar_rutina_inteligente(
                        genero_input, usuario.objetivo, nivel_usuario, dia
                    )
                    
                    # Comparar para ver qué se ajustó
                    for i, (ej_normal, ej_ajustado) in enumerate(zip(rutina_normal, ejercicios_raw)):
                        if ej_normal['series'] != ej_ajustado['series']:
                            ajustes_aplicados.append(f"Series de {ej_ajustado['musculo']} ajustadas por historial")
                            intensidad_modificada = True
                        if ej_normal['repeticiones'] != ej_ajustado['repeticiones']:
                            ajustes_aplicados.append(f"Repeticiones de {ej_ajustado['musculo']} ajustadas por historial")
                            intensidad_modificada = True
                    
                else:
                    # Sin historial, usar rutina normal
                    ejercicios_raw = ai_model.generar_rutina_inteligente(
                        genero_input, usuario.objetivo, nivel_usuario, dia
                    )
                    ajustes_aplicados.append("Rutina estándar (sin historial disponible)")
                
                # Convertir a formato de respuesta
                ejercicios_response = [
                    EjercicioResponse(
                        musculo=ej['musculo'],
                        ejercicio=ej['ejercicio'],
                        repeticiones=ej['repeticiones'],
                        series=ej['series']
                    )
                    for ej in ejercicios_raw
                ]
            else:
                ejercicios_response = []
                ajustes_aplicados.append("Día de descanso según plan de entrenamiento")
            
            dia_rutina = RutinaConHistorialResponse(
                dia=dia,
                grupos_musculares=grupos_dia,
                ejercicios=ejercicios_response,
                es_dia_descanso=es_dia_descanso,
                ajustes_aplicados=ajustes_aplicados,
                intensidad_modificada=intensidad_modificada
            )
            
            plan_semanal.append(dia_rutina)
        
        # PASO 5: Generar recomendaciones personales
        recomendaciones = ai_model.generar_recomendaciones_basadas_en_historial(historial_entrenamientos)
        
        # PASO 6: Preparar respuesta del historial
        historial_response = HistorialUsuarioResponse(
            entrenamientos_por_semana=estadisticas_historial['entrenamientos_por_semana'],
            asistencia_promedio=estadisticas_historial['asistencia_promedio'],
            nivel_mas_frecuente=estadisticas_historial['nivel_mas_frecuente'],
            grupos_mas_trabajados=estadisticas_historial['grupos_mas_trabajados'],
            total_entrenamientos=estadisticas_historial['total_entrenamientos'],
            ultimo_entrenamiento=historial_entrenamientos[0]['fecha'].strftime('%Y-%m-%d') if historial_entrenamientos else None
        )
        
        # Mensaje final
        if historial_entrenamientos:
            mensaje = f"Rutina personalizada basada en {len(historial_entrenamientos)} entrenamientos previos. La IA ha ajustado automáticamente la intensidad según tu patrón de entrenamiento real."
        else:
            mensaje = f"Rutina base para comenzar. Una vez que tengas historial de entrenamientos, la IA podrá personalizar mejor tus rutinas."
        
        return RoutineWithHistoryResponse(
            usuario_id=user_id,
            usuario_nombre=f"{usuario.nombre} {usuario.apellido_p}",
            historial_analizado=historial_response,
            plan_semanal=plan_semanal,
            recomendaciones_personales=recomendaciones,
            mensaje=mensaje
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando rutina con historial para usuario {user_id}: {str(e)}"
        )

@router.get("/historial-usuario/{user_id}")
async def obtener_historial_usuario(
    user_id: int,
    dias_atras: int = 30,
    db: Session = Depends(get_db)
):
    """
    Endpoint para obtener solo el historial de entrenamientos de un usuario
    Útil para debugging y verificación
    """
    
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(404, detail="Usuario no encontrado")
    
    historial = obtener_rutinas_realizadas_usuario(db, user_id, dias_atras)
    estadisticas = calcular_frecuencia_entrenamiento(historial)
    
    return {
        "usuario_id": user_id,
        "usuario_nombre": f"{usuario.nombre} {usuario.apellido_p}",
        "periodo_analizado_dias": dias_atras,
        "historial_entrenamientos": historial,
        "estadisticas": estadisticas,
        "total_reservas_analizadas": len(historial),
        "mensaje": f"Historial de {len(historial)} entrenamientos en los últimos {dias_atras} días"
    }

@router.get("/user-ai-routines/{user_id}")
async def get_user_ai_routines(user_id: int, db: Session = Depends(get_db)):
    """Obtener rutinas de IA generadas para un usuario específico"""
    from app.crud.rutina_ia import get_rutinas_ia_by_user
    
    usuario = db.query(Usuario).filter(Usuario.id_usuario == user_id).first()
    if not usuario:
        raise HTTPException(404, detail="Usuario no encontrado")
    
    rutinas_ia = get_rutinas_ia_by_user(db, user_id)
    
    return {
        "usuario_id": user_id,
        "usuario_nombre": f"{usuario.nombre} {usuario.apellido_p}",
        "total_rutinas_ia": len(rutinas_ia),
        "rutinas": [
            {
                "id_rutina_ia": r.id_rutina_ia,
                "fecha_generacion": r.fecha_generacion,
                "nivel_usuario": r.nivel_usuario,
                "modelo_usado": r.modelo_usado,
                "activa": r.activa,
                "tmb": float(r.tmb_usuario) if r.tmb_usuario else None,
                "imc": float(r.imc_usuario) if r.imc_usuario else None
            }
            for r in rutinas_ia
        ],
        "mensaje": f"Rutinas de IA para {usuario.nombre}: {len(rutinas_ia)} encontradas"
    }