from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.database import get_db
from app.models.horarios import EstadoHorario, NivelHorario, Horario as HorarioModel  # Agregar NivelHorario
from app.schemas.horarios import Horario, HorarioCreate, HorarioOut, HorarioSearch, HorarioUpdate, HorarioFilter
from app.crud.horarios import (
    create_horario,
    get_dia_semana,
    get_horarios,
    get_horarios_cliente,
    search_horarios,
    toggle_horario_status,
    update_horario,
    delete_horario
)
from app.utils.security import get_current_active_user, get_current_user
from app.models.users import Usuario
router = APIRouter()

@router.post("/", response_model=Horario)
def crear_horario(
    horario: HorarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return create_horario(db, horario, current_user.rol, current_user.id_usuario)

@router.get("/", response_model=List[HorarioOut])
def listar_horarios(
    vista_semanal: bool = False,  # Nuevo parámetro para elegir vista
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if vista_semanal:
        return get_horarios_cliente(
            db=db,
            user_rol=current_user.rol.value,
            user_id=current_user.id_usuario,
            user_categoria=current_user.categoria.value if current_user.rol == "cliente" else None,
            skip=skip,
            limit=limit
        )
    else:
        if current_user.rol == "cliente":
            raise HTTPException(
                status_code=403,
                detail="Los clientes deben usar vista_semanal=true"
            )
        return get_horarios(
            db=db,
            user_rol=current_user.rol.value,
            user_id=current_user.id_usuario,
            skip=skip,
            limit=limit
        )

@router.post("/buscar/", response_model=List[HorarioOut])
def buscar_horarios(
    search_params: HorarioSearch,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    return search_horarios(
        db=db,
        search_params=search_params,
        user_rol=current_user.rol.value,
        user_id=current_user.id_usuario,
        user_categoria=current_user.categoria.value if current_user.rol == "cliente" else None,
        skip=skip,
        limit=limit
    )

@router.put("/{horario_id}", response_model=HorarioOut)
def update_horario_endpoint(
    horario_id: int,
    horario_update: HorarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Actualiza un horario existente.
    
    - **Administrador**: Puede actualizar todos los campos y asignar entrenadores
    - **Entrenador**: Solo puede actualizar sus propios horarios (campos limitados)
    - **Nivel**: Se puede especificar principiante, intermedio o avanzado
    """
    return update_horario(
        db=db,
        horario_id=horario_id,
        horario_update=horario_update,
        user_id=current_user.id_usuario,
        user_rol=current_user.rol,
        user_categoria=current_user.categoria if current_user.rol == "entrenador" else None
    )

@router.delete("/{horario_id}", responses={
    200: {"description": "Horario eliminado"},
    403: {"description": "No tienes permisos para eliminar este horario"},
    404: {"description": "Horario no encontrado"},
    400: {"description": "No se puede eliminar horario con reservas activas"}
})
def delete_horario_endpoint(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Elimina permanentemente un horario
    - Administradores: pueden eliminar cualquier horario
    - Entrenadores: solo pueden eliminar sus propios horarios
    """
    return delete_horario(
        db=db,
        horario_id=horario_id,
        user_id=current_user.id_usuario,
        user_rol=current_user.rol
    )

@router.patch("/{horario_id}/desactivar", response_model=HorarioOut)
def desactivar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Desactiva un horario (Admin y Entrenadores)
    - Entrenadores solo pueden desactivar sus propios horarios
    """
    return toggle_horario_status(
        db=db,
        horario_id=horario_id,
        user_id=current_user.id_usuario,
        user_rol=current_user.rol,
        nuevo_estado=EstadoHorario.desactivado
    )

@router.patch("/{horario_id}/activar", response_model=HorarioOut)
def activar_horario(
    horario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Activa un horario (Admin y Entrenadores)
    - Entrenadores solo pueden activar sus propios horarios
    """
    return toggle_horario_status(
        db=db,
        horario_id=horario_id,
        user_id=current_user.id_usuario,
        user_rol=current_user.rol,
        nuevo_estado=EstadoHorario.activo
    )