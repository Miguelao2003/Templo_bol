from pydantic import BaseModel, Field, validator
from typing import Any, Dict, Optional, List
from enum import Enum

class ParteMusculo(str, Enum):
    pecho = "pecho"
    espalda = "espalda"
    hombro = "hombro"
    bicep = "bicep"
    tricep = "tricep"
    pierna = "pierna"
    abdomen = "abdomen"

class RutinaBase(BaseModel):
    nombres_ejercicios: List[str] = Field(..., min_items=1)
    partes_musculo: List[ParteMusculo] = Field(..., min_items=1)  # Array de arrays
    repeticiones: List[int] = Field(..., min_items=1)
    series: List[int] = Field(..., min_items=1)

    @validator('nombres_ejercicios')
    def validate_nombres_ejercicios(cls, v):
        if not v:
            raise ValueError("Debe especificar al menos un ejercicio")
        for nombre in v:
            if not nombre.strip():
                raise ValueError("Los nombres de ejercicios no pueden estar vacíos")
        return v
    
    @validator('partes_musculo')
    def validate_partes_musculo(cls, v, values):
        if not v:
            raise ValueError("Debe especificar al menos un grupo muscular")
        
        # Verificar que tenga la misma longitud que nombres_ejercicios
        nombres_ejercicios = values.get('nombres_ejercicios', [])
        if len(v) != len(nombres_ejercicios):
            raise ValueError("La cantidad de partes musculares debe coincidir con la cantidad de ejercicios")
        
        return v


    @validator('repeticiones', 'series')
    def validate_arrays_length_and_values(cls, v, values, field):
        if not v:
            raise ValueError(f"{field.name} debe tener al menos un valor")
        
        # Verificar valores positivos
        if any(val <= 0 for val in v):
            raise ValueError(f"Todos los valores de {field.name} deben ser mayores a 0")
        
        # Verificar que tenga la misma longitud que nombres_ejercicios
        nombres_ejercicios = values.get('nombres_ejercicios', [])
        if len(v) != len(nombres_ejercicios):
            raise ValueError(f"La cantidad de {field.name} debe coincidir con la cantidad de ejercicios")
        
        return v

class RutinaCreate(RutinaBase):
    id_entrenador: Optional[int] = Field(
        None, 
        description="Opcional para administradores. ID del entrenador de calistenia"
    )

class Rutina(RutinaBase):
    id_rutina: int
    id_usuario: int  # ID del creador (admin o entrenador)

    class Config:
        orm_mode = True

class RutinaUpdate(BaseModel):
    nombres_ejercicios: Optional[List[str]] = Field(None, min_items=1)
    partes_musculo: Optional[List[ParteMusculo]] = Field(None, min_items=1)
    repeticiones: Optional[List[int]] = Field(None, min_items=1)
    series: Optional[List[int]] = Field(None, min_items=1)
    id_entrenador: Optional[int] = Field(None, description="ID del entrenador (solo para administradores)")

    @validator('nombres_ejercicios')
    def validate_nombres_ejercicios(cls, v):
        if v is not None:
            if not v:
                raise ValueError("Debe especificar al menos un ejercicio")
            for nombre in v:
                if not nombre.strip():
                    raise ValueError("Los nombres de ejercicios no pueden estar vacíos")
        return v

    @validator('partes_musculo')
    def validate_partes_musculo(cls, v, values):
        if v is not None:
            nombres_ejercicios = values.get('nombres_ejercicios')
            if nombres_ejercicios and len(v) != len(nombres_ejercicios):
                raise ValueError("La cantidad de partes musculares debe coincidir con la cantidad de ejercicios")
        return v

    @validator('repeticiones', 'series')
    def validate_arrays(cls, v, values, field):
        if v is not None:
            if any(val <= 0 for val in v):
                raise ValueError(f"Todos los valores de {field.name} deben ser mayores a 0")
            
            nombres_ejercicios = values.get('nombres_ejercicios')
            if nombres_ejercicios and len(v) != len(nombres_ejercicios):
                raise ValueError(f"La cantidad de {field.name} debe coincidir con la cantidad de ejercicios")
        return v

class RutinaResponse(BaseModel):
    id_rutina: int
    nombres_ejercicios: List[str]
    partes_musculo: List[str]  # Como strings para la respuesta
    repeticiones: List[int]
    series: List[int]
    id_usuario: int
    entrenador: Optional[Dict[str, Any]] = None  # Opcional

    class Config:
        orm_mode = True