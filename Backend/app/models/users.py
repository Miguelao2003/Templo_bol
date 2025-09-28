from sqlalchemy import Column, Integer, String, Float, Boolean, Enum as SQLAlchemyEnum, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base
from app.enums import UserRole, UserCategory
from sqlalchemy.orm import relationship 
from app.models.metricas_usuario import MetricaUsuario

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    rol = Column(SQLAlchemyEnum(UserRole, name="rol_usuario"), nullable=False)
    nombre = Column(String(50), nullable=False)
    apellido_p = Column(String(50), nullable=False)
    apellido_m = Column(String(50))
    correo = Column(String(100), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    peso = Column(Float)
    altura = Column(Float)
    edad = Column(Integer)
    genero = Column(String(10), nullable=False)
    objetivo = Column(String(20), nullable=False)
    nivel = Column(String(20), default='principiante')  # <-- NUEVO CAMPO
    categoria = Column(SQLAlchemyEnum(UserCategory, name="categoria_usuario"))
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    activo = Column(Boolean, default=True)
    horarios = relationship("Horario", back_populates="entrenador")
    reservas = relationship("Reserva", back_populates="usuario")
    metricas = relationship("MetricaUsuario", back_populates="usuario", cascade="all, delete-orphan", uselist=False)
    rutinas_ia = relationship("RutinaIA", back_populates="usuario")