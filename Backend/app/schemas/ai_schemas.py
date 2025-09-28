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

class DiaRutinaResponse(BaseModel):
    dia: str
    grupos_musculares: List[str]
    ejercicios: List[EjercicioResponse]

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

class ModelStatusResponse(BaseModel):
    modelo_entrenado: bool
    precision: Optional[float] = None
    total_registros: Optional[int] = None
    mensaje: str
