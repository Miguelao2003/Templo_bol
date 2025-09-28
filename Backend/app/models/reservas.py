from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class EstadoReserva(str):
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"

class Reserva(Base):
    __tablename__ = "reserva"

    id_reserva = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    id_horario = Column(Integer, ForeignKey("horario.id_horario", ondelete="CASCADE"), nullable=False)
    id_equipo = Column(Integer, ForeignKey("equipopowerplate.id_equipo", ondelete="SET NULL"))
    id_rutina = Column(Integer, ForeignKey("rutina.id_rutina", ondelete="SET NULL"))
    estado = Column(SQLEnum("confirmada", "cancelada", name="estado_reserva"), nullable=False, default="confirmada")
    fecha_reserva = Column(DateTime(timezone=True), server_default=func.now())
    asistencia = Column(Integer)
    comentarios = Column(Text)
    usuario = relationship("Usuario", back_populates="reservas")
    horario = relationship("Horario")
    equipo = relationship("EquipoPowerplate")
    rutina = relationship("Rutina")