from datetime import date, time, datetime
from pydantic import BaseModel, Field, validator, root_validator
from enum import Enum
from typing import List, Optional
from app.utils.fechas import get_dia_semana

class TipoHorario(str, Enum):
    powerplate = "powerplate"
    calistenia = "calistenia"

class EstadoHorario(str, Enum):
    activo = "activo"
    desactivado = "desactivado"

# Nuevo Enum para nivel
class NivelHorario(str, Enum):
    principiante = "principiante"
    intermedio = "intermedio"
    avanzado = "avanzado"

class HorarioBase(BaseModel):
    nombre_horario: str = Field(
        default="Clase sin nombre",
        min_length=3,
        max_length=100,
        description="Nombre descriptivo del horario"
    )
    id_entrenador: Optional[int] = Field(
        default=None,
        description="Obligatorio para admin, debe ser omitido para entrenadores"
    )
    id_rutina: Optional[int] = Field( 
        default=None,
        description="ID de la rutina asociada (opcional)"
    )
    tipo: TipoHorario
    fecha: date
    hora_inicio: time
    hora_fin: time
    capacidad: int
    descripcion: Optional[str] = None
    # Nuevo campo nivel con valor por defecto
    nivel: NivelHorario = Field(
        default=NivelHorario.principiante,
        description="Nivel de dificultad del horario"
    )

    @root_validator
    def validar_estructura_por_rol(cls, values):
        # Esta validación será complementada en el CRUD
        return values

    @validator('fecha')
    def fecha_no_pasada(cls, v):
        if v < date.today():
            raise ValueError("No se pueden crear horarios con fechas pasadas")
        return v

    @validator('hora_inicio')
    def validar_hora_inicio(cls, v, values):
        if 'fecha' in values:
            ahora = datetime.now()
            fecha_horario = datetime.combine(values['fecha'], v)
            
            if fecha_horario < ahora:
                raise ValueError("La hora de inicio debe ser futura")
        
        return v

    @validator('hora_fin')
    def hora_fin_mayor_inicio(cls, v, values):
        if 'hora_inicio' in values and v <= values['hora_inicio']:
            raise ValueError("La hora de fin debe ser mayor a la hora de inicio")
        
        if 'fecha' in values and 'hora_inicio' in values:
            hora_inicio = datetime.combine(values['fecha'], values['hora_inicio'])
            hora_fin = datetime.combine(values['fecha'], v)
            
            if hora_fin <= datetime.now() and hora_inicio.date() == date.today():
                raise ValueError("La hora de fin debe ser futura")
        
        return v

    @validator('capacidad')
    def capacidad_positiva(cls, v):
        if v <= 0:
            raise ValueError("La capacidad debe ser mayor a 0")
        return v

class HorarioCreate(HorarioBase):
    pass

class HorarioUpdate(BaseModel):
    nombre_horario: Optional[str] = None
    id_entrenador: Optional[int] = None
    id_rutina: Optional[int] = None
    tipo: Optional[TipoHorario] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    capacidad: Optional[int] = None
    estado: Optional[EstadoHorario] = None
    descripcion: Optional[str] = None
    # Nuevo campo nivel en update
    nivel: Optional[NivelHorario] = None

    @validator('fecha')
    def fecha_no_pasada(cls, v):
        if v and v < date.today():
            raise ValueError("No se pueden actualizar horarios con fechas pasadas")
        return v

class RutinaInfo(BaseModel):  # Esquema actualizado para información de rutina
    id_rutina: int
    nombre_ejercicio: List[str]  # Array de nombres de ejercicios
    partes_musculo: List[str]      # Array de partes musculares
    repeticiones: List[int]        # Array de repeticiones
    series: List[int]              # Array de series
    id_usuario: int               # ID del creador de la rutina

    class Config:
        orm_mode = True

    
class Horario(HorarioBase):
    id_horario: int
    estado: EstadoHorario
    dia_semana: str = None  # Campo calculado
    rutina: Optional[RutinaInfo] = None  # Nueva relación
    
    @validator('dia_semana', always=True)
    def calcular_dia_semana(cls, v, values):
        return get_dia_semana(values['fecha'])

    class Config:
        orm_mode = True

class HorarioFilter(BaseModel):
    id_horario: Optional[int] = None
    id_entrenador: Optional[int] = None
    nombre_entrenador: Optional[str] = None
    apellido_p: Optional[str] = None
    apellido_m: Optional[str] = None
    fecha: Optional[date] = None
    dia: Optional[str] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    capacidad: Optional[int] = None
    estado: Optional[EstadoHorario] = None
    # Nuevo campo nivel en filtros
    nivel: Optional[NivelHorario] = None

class EntrenadorInfo(BaseModel):
    id_usuario: int
    nombre: str
    apellido_p: str
    apellido_m: Optional[str] = None
    categoria: Optional[str] = None

    class Config:
        orm_mode = True

class HorarioOut(BaseModel):
    id_horario: int
    nombre_horario: str
    id_entrenador: Optional[int]
    tipo: TipoHorario
    fecha: date
    hora_inicio: time
    hora_fin: time
    capacidad: int
    descripcion: Optional[str]
    estado: EstadoHorario
    dia_semana: Optional[str] = None
    entrenador: Optional[EntrenadorInfo] = None
    rutina: Optional[RutinaInfo] = None
    # Nuevo campo nivel en output
    nivel: NivelHorario
    
    @validator('dia_semana', always=True)
    def calcular_dia_semana(cls, v, values):
        return get_dia_semana(values['fecha']) if 'fecha' in values else None

    class Config:
        orm_mode = True

class HorarioSearch(BaseModel):
    id_horario: Optional[int] = None
    nombre_horario: Optional[str] = None
    id_entrenador: Optional[int] = None
    tipo: Optional[TipoHorario] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    capacidad: Optional[int] = None
    estado: Optional[EstadoHorario] = None
    dia_semana: Optional[str] = None
    nombre_entrenador: Optional[str] = None
    apellido_entrenador: Optional[str] = None
    categoria_entrenador: Optional[str] = None
    # Nuevo campo nivel en búsqueda
    nivel: Optional[NivelHorario] = None