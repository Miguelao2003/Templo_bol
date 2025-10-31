from sqlalchemy.orm import Session
from app.models.rutina_ia import RutinaIA
from app.schemas.rutina_ia import RutinaIACreate
from datetime import datetime
from decimal import Decimal
import json

def create_rutina_ia(db: Session, rutina: RutinaIACreate):
    """Crear nueva rutina de IA"""
    try:
        # Convertir plan_semanal a JSON string si no lo es ya
        plan_semanal_json = rutina.plan_semanal
        if isinstance(plan_semanal_json, dict):
            plan_semanal_json = json.dumps(plan_semanal_json)
        
        # Convertir valores a los tipos correctos
        modelo_usado = getattr(rutina, 'modelo_usado', 'random_forest')
        precision = getattr(rutina, 'precision_modelo', Decimal('0.995'))
        
        # Asegurar que precision_modelo sea Decimal
        if not isinstance(precision, Decimal):
            precision = Decimal(str(precision))
        
        db_rutina = RutinaIA(
            usuario_id=rutina.usuario_id,
            modelo_usado=modelo_usado,
            precision_modelo=precision,
            plan_semanal=plan_semanal_json,
            nivel_usuario=rutina.nivel_usuario,
            edad_usuario=rutina.edad_usuario,
            peso_usuario=rutina.peso_usuario,
            altura_usuario=rutina.altura_usuario,
            objetivo_usuario=rutina.objetivo_usuario,
            genero_usuario=rutina.genero_usuario,
            tmb_usuario=rutina.tmb_usuario,
            imc_usuario=rutina.imc_usuario,
            activa=getattr(rutina, 'activa', True)
            # NO incluir fecha_generacion - lo maneja server_default=func.now()
            # NO incluir fecha_actualizacion - lo maneja el default del modelo
        )
        
        db.add(db_rutina)
        db.commit()
        db.refresh(db_rutina)
        
        print(f"✅ Rutina guardada exitosamente con ID: {db_rutina.id_rutina_ia}")
        return db_rutina
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error guardando rutina: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_rutinas_ia_by_user(db: Session, usuario_id: int, limit: int = 10):
    """Obtener rutinas de IA de un usuario"""
    return db.query(RutinaIA).filter(
        RutinaIA.usuario_id == usuario_id,
        RutinaIA.activa == True
    ).order_by(RutinaIA.fecha_generacion.desc()).limit(limit).all()

def get_rutina_ia_activa(db: Session, usuario_id: int):
    """Obtener la rutina activa más reciente de un usuario"""
    return db.query(RutinaIA).filter(
        RutinaIA.usuario_id == usuario_id,
        RutinaIA.activa == True
    ).order_by(RutinaIA.fecha_generacion.desc()).first()

def desactivar_rutinas_anteriores(db: Session, usuario_id: int):
    """Desactivar todas las rutinas anteriores de un usuario"""
    try:
        rutinas_anteriores = db.query(RutinaIA).filter(
            RutinaIA.usuario_id == usuario_id,
            RutinaIA.activa == True
        ).all()
        
        for rutina in rutinas_anteriores:
            rutina.activa = False
            rutina.fecha_actualizacion = datetime.now()
        
        db.commit()
        print(f"✅ Desactivadas {len(rutinas_anteriores)} rutinas anteriores del usuario {usuario_id}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error desactivando rutinas: {e}")
        raise

def get_rutina_ia_by_id(db: Session, rutina_id: int):
    """Obtener una rutina por su ID"""
    return db.query(RutinaIA).filter(RutinaIA.id_rutina_ia == rutina_id).first()