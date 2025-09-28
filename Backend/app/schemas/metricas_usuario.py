from pydantic import BaseModel, Field, validator
from typing import Optional
from enum import Enum

class RangoIMC(str, Enum):
    BAJO_PESO = "Bajo peso"
    NORMAL = "Normal"
    SOBREPESO = "Sobrepeso"
    OBESIDAD = "Obesidad"

class MetricaUsuarioBase(BaseModel):
    id_usuario: int
    tmb: Optional[float] = Field(None, example=1500.0, description="Tasa Metabólica Basal en kcal")
    imc: Optional[float] = Field(None, example=22.5, description="Índice de Masa Corporal")
    rango_imc: Optional[RangoIMC] = Field(None, example="Normal", description="Clasificación según OMS")
    grasa_corporal_estimada: Optional[float] = Field(None, example=18.5, description="Porcentaje estimado")
    peso_ideal: Optional[float] = Field(None, example=70.5, description="Peso ideal en kg")

    @validator('imc')
    def round_imc(cls, v):
        return round(v, 2) if v else None

    @validator('tmb', 'grasa_corporal_estimada', 'peso_ideal')
    def round_numbers(cls, v):
        return round(v, 1) if v else None

class MetricaUsuarioCreate(BaseModel):
    id_usuario: int = Field(..., description="ID del usuario asociado")

class MetricaUsuarioUpdate(BaseModel):
    tmb: Optional[float]
    imc: Optional[float]
    rango_imc: Optional[RangoIMC]
    grasa_corporal_estimada: Optional[float]
    peso_ideal: Optional[float]

class MetricaUsuarioInDB(MetricaUsuarioBase):
    id_metrica: int

    class Config:
        orm_mode = True
        json_encoders = {
            RangoIMC: lambda v: v.value
        }
class MetricaUsuarioWithGenero(MetricaUsuarioBase):
    genero: str = Field(..., description="Género del usuario (obtenido de la tabla Usuario)")
    
    class Config:
        orm_mode = True