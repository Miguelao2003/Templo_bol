from enum import Enum
from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.sql import func
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP
from app.database import Base
from sqlalchemy.orm import relationship

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

class Horario(Base):
    __tablename__ = "horario"

    id_horario = Column(Integer, primary_key=True, index=True)
    nombre_horario = Column(String(100), nullable=False, default="Clase sin nombre")
    id_entrenador = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    tipo = Column(SQLAlchemyEnum(TipoHorario), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    capacidad = Column(Integer, nullable=False)
    estado = Column(SQLAlchemyEnum(EstadoHorario), nullable=False, server_default="activo")
    descripcion = Column(Text)
    id_rutina = Column(Integer, ForeignKey('rutina.id_rutina'), nullable=True)
    nivel = Column(SQLAlchemyEnum(NivelHorario), nullable=False, server_default="principiante")
    
    entrenador = relationship("Usuario", back_populates="horarios")
    rutina = relationship("Rutina", back_populates="horarios")