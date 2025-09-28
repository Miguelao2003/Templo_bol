from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Union, Any
from enum import Enum
import json

class EstadoReserva(str, Enum):
    confirmada = "confirmada"
    cancelada = "cancelada"

class NivelHorario(str, Enum):
    principiante = "principiante"
    intermedio = "intermedio"
    avanzado = "avanzado"

class TipoHorario(str, Enum):
    powerplate = "powerplate"
    calistenia = "calistenia"

class ReservaBase(BaseModel):
    id_usuario: int
    id_horario: int
    id_equipo: Optional[int] = None
    comentarios: Optional[str] = None

class ReservaCreate(ReservaBase):
    pass

class ReservaCreateResponse(ReservaBase):
    id_reserva: int
    estado: EstadoReserva
    fecha_reserva: datetime
    id_rutina: Optional[int] = None

    class Config:
        orm_mode = True

class ReservaUpdate(BaseModel):
    estado: Optional[EstadoReserva] = None
    asistencia: Optional[int] = Field(None, ge=0, le=100)
    comentarios: Optional[str] = None

class ReservaInDB(ReservaBase):
    id_reserva: int
    fecha_reserva: datetime
    id_rutina: Optional[int] = None
    estado: EstadoReserva

    class Config:
        orm_mode = True

class ReservaWithDetails(ReservaInDB):
    nombre_usuario: str
    email_usuario: str
    nombre_horario: str
    tipo_horario: str
    nivel_horario: str  # 🆕 NUEVO: Nivel del horario
    nombre_equipo: Optional[str] = None
    nombre_rutina: Optional[str] = None
    nombre_entrenador: str

# Schema mejorado para detalles completos de reserva
class ReservaDetallada(BaseModel):
    id_reserva: int
    estado: str
    fecha_reserva: datetime
    comentarios: Optional[str] = None
    asistencia: Optional[int] = None
    
    # Detalles del usuario
    usuario_id: int
    usuario_nombre: str
    usuario_apellido_p: str
    usuario_apellido_m: Optional[str] = None
    usuario_email: str
    
    # Detalles del horario - MEJORADOS
    horario_id: int
    horario_nombre: str
    horario_fecha: date
    horario_hora_inicio: str
    horario_hora_fin: str
    horario_tipo: TipoHorario
    horario_nivel: NivelHorario
    horario_capacidad: int
    horario_descripcion: Optional[str] = None
    
    # Detalles del entrenador
    entrenador_id: int
    entrenador_nombre: str
    entrenador_apellido_p: str
    entrenador_apellido_m: Optional[str] = None
    entrenador_categoria: str
    
    # Detalles de la rutina - MEJORADOS PARA JSON
    rutina_id: Optional[int] = None
    rutina_nombre: str = "Sin rutina"  # ✅ CAMBIO: Valor por defecto
    rutina_ejercicios: List[str] = []
    rutina_partes_musculo: List[str] = []
    rutina_repeticiones: List[int] = []
    rutina_series: List[int] = []
    
    # Detalles del equipo (solo para powerplate)
    equipo_id: Optional[int] = None
    equipo_nombre: Optional[str] = None
    equipo_descripcion: Optional[str] = None
    
    # ✅ Validator simple para rutina_nombre
    @validator('rutina_nombre', pre=True)
    def parse_rutina_nombre(cls, v):
        if v is None:
            return "Sin rutina"
        return str(v)
    
    # Validadores para manejar JSON
    @validator('rutina_ejercicios', pre=True)
    def parse_ejercicios(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v if isinstance(v, list) else []
    
    @validator('rutina_partes_musculo', pre=True)
    def parse_partes_musculo(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v if isinstance(v, list) else []
    
    @validator('rutina_repeticiones', pre=True)
    def parse_repeticiones(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v if isinstance(v, list) else []
    
    @validator('rutina_series', pre=True)
    def parse_series(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v if isinstance(v, list) else []

    class Config:
        orm_mode = True

class ListaReservasDetalladas(BaseModel):
    reservas: List[ReservaDetallada]
    total: int
    pagina: int = 1
    por_pagina: int = 10

class AsistenciaUpdate(BaseModel):
    asistencia: int = Field(..., ge=0, le=100, description="Porcentaje de asistencia (0-100)")
    comentarios: Optional[str] = None

class ReservaConAsistencia(ReservaDetallada):
    asistencia: Optional[int] = None
    comentarios_asistencia: Optional[str] = None

# 🆕 NUEVO: Schema para estadísticas de reservas
class EstadisticasReserva(BaseModel):
    total_reservas: int
    reservas_confirmadas: int
    reservas_canceladas: int
    reservas_por_tipo: dict
    reservas_por_nivel: dict
    reservas_por_mes: dict

# 🆕 NUEVO: Schema para filtros de búsqueda
class FiltrosReserva(BaseModel):
    estado: Optional[EstadoReserva] = None
    tipo_horario: Optional[TipoHorario] = None
    nivel_horario: Optional[NivelHorario] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    id_entrenador: Optional[int] = None
    id_usuario: Optional[int] = None