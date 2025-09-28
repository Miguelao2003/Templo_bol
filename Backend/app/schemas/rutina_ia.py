from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
from decimal import Decimal

class RutinaIACreate(BaseModel):
    usuario_id: int
    plan_semanal: Dict[str, Any]
    nivel_usuario: Optional[str] = None
    edad_usuario: Optional[int] = None
    peso_usuario: Optional[Decimal] = None
    altura_usuario: Optional[Decimal] = None
    objetivo_usuario: Optional[str] = None
    genero_usuario: Optional[str] = None
    tmb_usuario: Optional[Decimal] = None
    imc_usuario: Optional[Decimal] = None

class RutinaIAResponse(BaseModel):
    id_rutina_ia: int
    usuario_id: int
    modelo_usado: str
    fecha_generacion: datetime
    nivel_usuario: Optional[str]
    activa: bool
    
    class Config:
        from_attributes = True