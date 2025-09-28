# models/metrica_usuario.py
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class MetricaUsuario(Base):
    __tablename__ = "metrica_usuario"
    
    id_metrica = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    tmb = Column(Numeric(6, 2))  # Tasa Metabólica Basal
    imc = Column(Numeric(5, 2))  # Índice de Masa Corporal
    rango_imc = Column(String(20))  # Bajo peso, Normal, etc.
    grasa_corporal_estimada = Column(Numeric(5, 2))  # Estimada con IMC y edad
    peso_ideal = Column(Numeric(5, 2))  # Peso ideal estimado
    
    usuario = relationship("Usuario", back_populates="metricas")
