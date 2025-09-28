from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime
from app.models.equipos import EquipoPowerplate
from app.schemas.equipos import EquipoCreate, EquipoUpdate
from app.enums import EstadoEquipo

def get_equipo(db: Session, equipo_id: int) -> Optional[EquipoPowerplate]:
    """Obtiene un equipo por su ID"""
    return db.query(EquipoPowerplate).filter(EquipoPowerplate.id_equipo == equipo_id).first()

def get_equipo_by_nombre(db: Session, nombre: str) -> Optional[EquipoPowerplate]:
    """Obtiene un equipo por su nombre exacto"""
    return db.query(EquipoPowerplate).filter(EquipoPowerplate.nombre_equipo == nombre).first()

def get_equipos(db: Session, skip: int = 0, limit: int = 100) -> List[EquipoPowerplate]:
    """Obtiene todos los equipos con paginación"""
    return db.query(EquipoPowerplate).offset(skip).limit(limit).all()

def create_equipo(db: Session, equipo: EquipoCreate):
    # Convertir fechas si es necesario
    ultimo_mantenimiento = None
    if equipo.ultimo_mantenimiento:
        if isinstance(equipo.ultimo_mantenimiento, str):
            ultimo_mantenimiento = datetime.strptime(equipo.ultimo_mantenimiento, "%Y-%m-%d").date()
        else:
            ultimo_mantenimiento = equipo.ultimo_mantenimiento
    
    # Crear instancia del equipo
    db_equipo = EquipoPowerplate(
        nombre_equipo=equipo.nombre_equipo,
        estado=equipo.estado,  # El enum se maneja automáticamente
        ultimo_mantenimiento=ultimo_mantenimiento,
        especificaciones_tecnicas=equipo.especificaciones_tecnicas
    )
    
    try:
        db.add(db_equipo)
        db.commit()
        db.refresh(db_equipo)
        return db_equipo
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear el equipo: {str(e)}"
        )

def search_equipos(
    db: Session,
    q: Optional[str] = None,
    nombre: Optional[str] = None,
    estado: Optional[str] = None,
    especificaciones: Optional[str] = None,
    ultimo_mantenimiento_min: Optional[datetime] = None,
    ultimo_mantenimiento_max: Optional[datetime] = None,
    # ✅ Agregar estos parámetros:
    proximo_mantenimiento_min: Optional[datetime] = None,
    proximo_mantenimiento_max: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
) -> List[EquipoPowerplate]:
    query = db.query(EquipoPowerplate)
    
    # Búsqueda general (q)
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                EquipoPowerplate.nombre_equipo.ilike(search_term),
                EquipoPowerplate.especificaciones_tecnicas.ilike(search_term)
            )
        )
    
    # Filtros individuales
    if nombre:
        query = query.filter(EquipoPowerplate.nombre_equipo.ilike(f"%{nombre}%"))
    if especificaciones:
        query = query.filter(EquipoPowerplate.especificaciones_tecnicas.ilike(f"%{especificaciones}%"))
    if estado:
        query = query.filter(EquipoPowerplate.estado == estado)
    
    # Filtros de rango de fechas - último mantenimiento
    if ultimo_mantenimiento_min:
        query = query.filter(EquipoPowerplate.ultimo_mantenimiento >= ultimo_mantenimiento_min)
    if ultimo_mantenimiento_max:
        query = query.filter(EquipoPowerplate.ultimo_mantenimiento <= ultimo_mantenimiento_max)
    
    # ✅ Filtros de rango de fechas - próximo mantenimiento
    if proximo_mantenimiento_min:
        query = query.filter(EquipoPowerplate.proximo_mantenimiento >= proximo_mantenimiento_min)
    if proximo_mantenimiento_max:
        query = query.filter(EquipoPowerplate.proximo_mantenimiento <= proximo_mantenimiento_max)
    
    return query.offset(skip).limit(limit).all()

def update_equipo(db: Session, equipo_id: int, equipo_update: EquipoUpdate) -> Optional[EquipoPowerplate]:
    """Actualiza un equipo existente"""
    db_equipo = get_equipo(db, equipo_id)
    if not db_equipo:
        return None
    
    update_data = equipo_update.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == "estado" and value is not None:
            setattr(db_equipo, key, value.value if hasattr(value, "value") else value)
        elif key == "ultimo_mantenimiento" and value is not None:
            if isinstance(value, str):
                setattr(db_equipo, key, datetime.strptime(value, "%Y-%m-%d").date())
            else:
                setattr(db_equipo, key, value)
        else:
            setattr(db_equipo, key, value)
    
    db.commit()
    db.refresh(db_equipo)
    return db_equipo

def set_estado_mantenimiento(db: Session, equipo_id: int) -> Optional[EquipoPowerplate]:
    """Pone un equipo en estado de mantenimiento"""
    db_equipo = get_equipo(db, equipo_id)
    if not db_equipo:
        return None
    
    if db_equipo.estado == EstadoEquipo.mantenimiento.value:
        return db_equipo  # Ya está en mantenimiento
    
    db_equipo.estado = EstadoEquipo.mantenimiento.value
    db_equipo.ultimo_mantenimiento = datetime.now().date()
    db.commit()
    db.refresh(db_equipo)
    return db_equipo

def set_estado_activo(db: Session, equipo_id: int) -> Optional[EquipoPowerplate]:
    """Pone un equipo en estado activo"""
    db_equipo = get_equipo(db, equipo_id)
    if not db_equipo:
        return None
    
    if db_equipo.estado == EstadoEquipo.activo.value:
        return db_equipo  # Ya está activo
    
    db_equipo.estado = EstadoEquipo.activo.value
    db.commit()
    db.refresh(db_equipo)
    return db_equipo