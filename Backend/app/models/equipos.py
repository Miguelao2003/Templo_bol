from sqlalchemy import Column, Integer, String, Date, Enum as SqlEnum, Text
from sqlalchemy.sql import expression
from app.database import Base
from app.enums import EstadoEquipo  # Importar desde enums.py

class EquipoPowerplate(Base):
    __tablename__ = "equipopowerplate"

    id_equipo = Column(Integer, primary_key=True, index=True)
    nombre_equipo = Column(String(100), nullable=False)
    estado = Column(SqlEnum(EstadoEquipo), nullable=False, server_default="activo")
    ultimo_mantenimiento = Column(Date)
    proximo_mantenimiento = Column(Date, server_default=expression.text("(ultimo_mantenimiento + INTERVAL '3 months')"))
    especificaciones_tecnicas = Column(Text)