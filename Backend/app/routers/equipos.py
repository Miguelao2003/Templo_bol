from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.schemas.users import User
from app.utils.security import get_current_active_user, get_current_user
from app.schemas.equipos import Equipo, EquipoCreate, EquipoUpdate
from app.crud.equipos import (
    get_equipo,
    get_equipo_by_nombre,
    get_equipos,
    create_equipo,
    search_equipos,
    update_equipo,
    set_estado_mantenimiento,
    set_estado_activo
)
from app.database import get_db


router = APIRouter()

# Función para verificar si el usuario es administrador
async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user

@router.post("/", response_model=Equipo, status_code=status.HTTP_201_CREATED)
def crear_equipo(
    equipo: EquipoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # Usar la dependencia de admin
):
    """
    Crea un nuevo equipo Powerplate (solo administradores)
    """
    db_equipo = get_equipo_by_nombre(db, nombre=equipo.nombre_equipo)
    if db_equipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un equipo con este nombre"
        )
    return create_equipo(db=db, equipo=equipo)

@router.get("/", response_model=List[Equipo])
def leer_equipos(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Requiere autenticación
):
    """
    Obtiene todos los equipos Powerplate (requiere autenticación)
    """
    return get_equipos(db, skip=skip, limit=limit)

@router.get("/buscar/", response_model=List[Equipo])
def buscar_equipos(
    db: Session = Depends(get_db),
    nombre: Optional[str] = None,
    estado: Optional[str] = None,
    especificaciones: Optional[str] = None,
    ultimo_mantenimiento_min: Optional[date] = None,
    ultimo_mantenimiento_max: Optional[date] = None,
    # ✅ Agregar estos parámetros:
    proximo_mantenimiento_min: Optional[date] = None,
    proximo_mantenimiento_max: Optional[date] = None,
):
    return search_equipos(
        db=db,
        nombre=nombre,
        estado=estado,
        especificaciones=especificaciones,
        ultimo_mantenimiento_min=ultimo_mantenimiento_min,
        ultimo_mantenimiento_max=ultimo_mantenimiento_max,
        # ✅ Pasar los nuevos parámetros:
        proximo_mantenimiento_min=proximo_mantenimiento_min,
        proximo_mantenimiento_max=proximo_mantenimiento_max,
    )

@router.get("/{equipo_id}", response_model=Equipo)
def leer_equipo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene un equipo Powerplate por su ID (acceso público)
    """
    db_equipo = get_equipo(db, equipo_id=equipo_id)
    if db_equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    return db_equipo
    

@router.put("/{equipo_id}", response_model=Equipo)
def actualizar_equipo(
    equipo_id: int,
    equipo: EquipoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Actualiza un equipo Powerplate (solo administradores)
    """
    db_equipo = get_equipo(db, equipo_id=equipo_id)
    if db_equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    return update_equipo(db=db, equipo_id=equipo_id, equipo_update=equipo)

@router.post("/{equipo_id}/mantenimiento", response_model=Equipo)
def poner_en_mantenimiento(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Cambia el estado de un equipo a 'mantenimiento' (solo administradores)
    """
    db_equipo = set_estado_mantenimiento(db, equipo_id=equipo_id)
    if db_equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    return db_equipo

@router.post("/{equipo_id}/activar", response_model=Equipo)
def poner_en_activo(
    equipo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Cambia el estado de un equipo a 'activo' (solo administradores)
    """
    db_equipo = set_estado_activo(db, equipo_id=equipo_id)
    if db_equipo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipo no encontrado"
        )
    return db_equipo