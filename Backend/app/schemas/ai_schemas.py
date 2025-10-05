# app/schemas/ai_schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RoutinePredictionRequest(BaseModel):
    genero: str  # "Masculino" o "Femenino"
    edad: int
    peso: float
    altura: float  # en metros
    objetivo: str  # "aumento de peso" o "perdida de peso"

class EjercicioResponse(BaseModel):
    musculo: str
    ejercicio: str
    repeticiones: int
    series: int

# app/schemas/rutina_ia.py

class DiaRutinaResponse(BaseModel):
    dia: str  # "Jueves (03/10)"
    fecha_real: Optional[str] = None  # "2025-10-03" formato ISO
    grupos_musculares: List[str]
    ejercicios: List[EjercicioResponse]
    tipo_entrenamiento: str
    es_dia_descanso: bool
    total_ejercicios: int

class PerfilUsuarioResponse(BaseModel):
    nivel: str
    tmb: float
    imc: float
    rango_imc: str

class RoutinePredictionResponse(BaseModel):
    usuario_id: Optional[int] = None
    perfil: PerfilUsuarioResponse
    plan_semanal: List[DiaRutinaResponse]
    mensaje: str

    # NUEVO: Indicar si se usó análisis de rendimiento
    analisis_rendimiento_aplicado: bool = False
    estadisticas_rendimiento: Optional[Dict[str, Any]] = None

class ModelStatusResponse(BaseModel):
    modelo_entrenado: bool
    precision: Optional[float] = None
    total_registros: Optional[int] = None
    mensaje: str
