from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.enums import EstadoEquipo  # Importar desde enums.py

class EquipoBase(BaseModel):
    nombre_equipo: str
    estado: EstadoEquipo = EstadoEquipo.activo
    ultimo_mantenimiento: Optional[date] = None
    especificaciones_tecnicas: Optional[str] = None

class EquipoCreate(EquipoBase):
    pass

class EquipoUpdate(BaseModel):
    nombre_equipo: Optional[str] = None
    estado: Optional[EstadoEquipo] = None
    ultimo_mantenimiento: Optional[date] = None
    especificaciones_tecnicas: Optional[str] = None

class Equipo(EquipoBase):
    id_equipo: int
    proximo_mantenimiento: Optional[date] = None

    class Config:
        orm_mode = True
        use_enum_values = True  # Esta línea es crucial