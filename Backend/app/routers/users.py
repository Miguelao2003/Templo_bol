from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.crud.metricas_usuario import create_or_update_metrica_usuario
from app.enums import UserCategory, UserRole
from app.schemas.users import User, UserCreate, UserUpdate, UserWithMetrics
from app.database import get_db
from app.crud.users import (
    activate_user, get_user, get_user_with_metrics, get_users, create_user, search_users,
    update_user, deactivate_user, get_user_by_email
)
from app.utils.security import get_current_active_user

router = APIRouter()

@router.post(
    "/",
    response_model=UserWithMetrics,
    status_code=status.HTTP_201_CREATED,
    response_description="Usuario creado con métricas calculadas"
)
def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol != UserRole.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear usuarios"
        )

    if get_user_by_email(db, email=user.correo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado"
        )
    
    created_user = create_user(db=db, user=user)
    
    if user.peso and user.altura and user.edad and user.genero:
        create_or_update_metrica_usuario(db=db, id_usuario=created_user.id_usuario)
        db.refresh(created_user)
    else:
        print("Usuario creado sin métricas por falta de datos.")

    return created_user

from app.crud.users import get_users, get_user
from app.models.metricas_usuario import MetricaUsuario
from app.schemas.users import UserWithMetrics

@router.get("/", response_model=List[UserWithMetrics])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol == UserRole.administrador:
        db_users = get_users(db, skip=skip, limit=limit)
    else:
        user = get_user(db, current_user.id_usuario)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        db_users = [user]

    return db_users

@router.get("/search/", response_model=List[User], summary="Búsqueda avanzada de usuarios", description="""
Endpoint de búsqueda avanzada exclusivo para administradores.

Permite filtrar usuarios por:
- Rol
- Nombre (búsqueda parcial)
- Apellidos (búsqueda parcial)
- Correo (búsqueda parcial)
- Categoría
- Edad
- Fecha de registro
- Estado activo/inactivo
- Género
- Objetivo
- Nivel de experiencia
""")
def advanced_user_search(
    rol: Optional[UserRole] = Query(None, description="Filtrar por rol de usuario"),
    nombre: Optional[str] = Query(None, description="Búsqueda por nombre (contiene texto)"),
    apellido_p: Optional[str] = Query(None, description="Búsqueda por apellido paterno (contiene texto)"),
    apellido_m: Optional[str] = Query(None, description="Búsqueda por apellido materno (contiene texto)"),
    correo: Optional[str] = Query(None, description="Búsqueda por correo (contiene texto)"),
    categoria: Optional[UserCategory] = Query(None, description="Filtrar por categoría"),
    edad: Optional[int] = Query(None, description="Filtrar por edad exacta"),
    edad_min: Optional[int] = Query(None, description="Edad mínima (rango)", ge=0, le=120),
    edad_max: Optional[int] = Query(None, description="Edad máxima (rango)", ge=0, le=120),
    fecha_registro_inicio: Optional[datetime] = Query(None, description="Fecha de registro inicial"),
    fecha_registro_fin: Optional[datetime] = Query(None, description="Fecha de registro final"),
    genero: Optional[str] = Query(None, description="Filtrar por género (Masculino o Femenino)"),
    objetivo: Optional[str] = Query(None, description="Filtrar por objetivo (aumento de peso o pérdida de peso)"),
    nivel: Optional[str] = Query(None, description="Filtrar por nivel (principiante, intermedio, avanzado)"),  # <-- NUEVO
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol != UserRole.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo administradores pueden realizar búsquedas"
        )

    if edad is not None and (edad_min is not None or edad_max is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use solo 'edad' o 'edad_min/edad_max', no ambos"
        )
    
    if fecha_registro_inicio and fecha_registro_fin and fecha_registro_inicio > fecha_registro_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de inicio no puede ser mayor que la fecha final"
        )

    search_params = {
        "rol": rol.value if rol else None,
        "nombre": nombre,
        "apellido_p": apellido_p,
        "apellido_m": apellido_m,
        "correo": correo,
        "categoria": categoria.value if categoria else None,
        "edad_min": edad if edad is not None else edad_min,
        "edad_max": edad if edad is not None else edad_max,
        "fecha_registro_inicio": fecha_registro_inicio,
        "fecha_registro_fin": fecha_registro_fin,
        "genero": genero,
        "objetivo": objetivo,
        "nivel": nivel,  # <-- NUEVO PARÁMETRO
        "activo": activo,
        "skip": skip,
        "limit": limit
    }

    db_users = search_users(db, **search_params)
    
    return [User.from_orm(user) for user in db_users]

@router.put(
    "/{user_id}",
    response_model=UserWithMetrics,
    response_description="Usuario actualizado con métricas recalculadas"
)
def update_user_data(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol != UserRole.administrador and current_user.id_usuario != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )

    db_user = update_user(db=db, user_id=user_id, user_update=user)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if (db_user.peso is not None and db_user.altura is not None and db_user.edad is not None and db_user.genero is not None):
        create_or_update_metrica_usuario(
            db=db,
            id_usuario=user_id
        )
        db.refresh(db_user)

    return db_user

@router.delete(
    "/{user_id}",
    response_model=User,
    responses={
        200: {"description": "Usuario desactivado exitosamente"},
        403: {"description": "Solo administradores pueden desactivar usuarios"},
        404: {"description": "Usuario no encontrado"},
        400: {"description": "No puedes desactivarte a ti mismo"}
    }
)
def deactivate_user_account(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol != UserRole.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden desactivar usuarios"
        )
    
    if current_user.id_usuario == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta"
        )
    
    db_user = deactivate_user(db=db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuario no encontrado"
        )
    
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder({
            "message": f"Usuario {db_user.correo} desactivado exitosamente",
            "user": User.from_orm(db_user)
        })
    )

@router.put(
    "/{user_id}/activate",
    response_model=User,
    responses={
        200: {"description": "Usuario activado exitosamente"},
        403: {"description": "Solo administradores pueden activar usuarios"},
        404: {"description": "Usuario no encontrado"},
    }
)
def activate_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.rol != UserRole.administrador:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden activar usuarios"
        )
    
    db_user = activate_user(db=db, user_id=user_id)
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return JSONResponse(
        status_code=200,
        content=jsonable_encoder({
            "message": f"Usuario {db_user.correo} activado exitosamente",
            "user": User.from_orm(db_user)
        })
    )