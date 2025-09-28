from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base
from sqlalchemy.orm import relationship
from typing import List

class Rutina(Base):
    __tablename__ = "rutina"

    id_rutina = Column(Integer, primary_key=True, index=True)
    nombre_ejercicio = Column(JSON, nullable=False)  # Array JSON de strings
    partes_musculo = Column(JSON, nullable=False)    # Array JSON de strings
    repeticiones = Column(JSON, nullable=False)      # Array JSON de integers
    series = Column(JSON, nullable=False)           # Array JSON de integers
    id_usuario = Column(Integer, ForeignKey('usuario.id_usuario'), nullable=False)
    
    horarios = relationship("Horario", back_populates="rutina")