from sqlalchemy import Column, Integer, String, DateTime, Boolean, DECIMAL, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class RutinaIA(Base):
    __tablename__ = "rutina_ia"
    
    id_rutina_ia = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    modelo_usado = Column(String(50), nullable=False, default="random_forest")
    precision_modelo = Column(DECIMAL(5,3), default=0.995)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Rutina completa en JSON
    plan_semanal = Column(JSON, nullable=False)
    
    # Metadatos del usuario al momento de generación
    nivel_usuario = Column(String(20))
    edad_usuario = Column(Integer)
    peso_usuario = Column(DECIMAL(5,2))
    altura_usuario = Column(DECIMAL(5,2))
    objetivo_usuario = Column(String(50))
    genero_usuario = Column(String(20))
    
    # Métricas calculadas
    tmb_usuario = Column(DECIMAL(7,2))
    imc_usuario = Column(DECIMAL(5,2))
    
    # Control
    activa = Column(Boolean, default=True)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relación con Usuario
    usuario = relationship("Usuario", back_populates="rutinas_ia")