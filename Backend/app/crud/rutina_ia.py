from sqlalchemy.orm import Session
from app.models.rutina_ia import RutinaIA
from app.schemas.rutina_ia import RutinaIACreate

def create_rutina_ia(db: Session, rutina_data: RutinaIACreate) -> RutinaIA:
    """Crear una nueva rutina generada por IA"""
    db_rutina = RutinaIA(**rutina_data.dict())
    db.add(db_rutina)
    db.commit()
    db.refresh(db_rutina)
    return db_rutina

def get_rutinas_ia_by_user(db: Session, usuario_id: int, limit: int = 10):
    """Obtener rutinas de IA de un usuario"""
    return db.query(RutinaIA).filter(
        RutinaIA.usuario_id == usuario_id,
        RutinaIA.activa == True
    ).order_by(RutinaIA.fecha_generacion.desc()).limit(limit).all()