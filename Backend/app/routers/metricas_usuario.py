from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.metricas_usuario import (
    MetricaUsuarioBase,
    MetricaUsuarioCreate,
    MetricaUsuarioInDB,
    MetricaUsuarioUpdate
)
from app.crud.metricas_usuario import (
    create_or_update_metrica_usuario,
    get_metrica_usuario,
    update_metrica_usuario,
    delete_metrica_usuario
)
from app.crud.users import get_user
from app.models.users import Usuario

router = APIRouter(
    prefix="/metricas-usuario",
    tags=["metricas-usuario"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{id_usuario}", response_model=MetricaUsuarioInDB)
def read_metrica_usuario(id_usuario: int, db: Session = Depends(get_db)):
    db_metrica = get_metrica_usuario(db, id_usuario=id_usuario)
    if db_metrica is None:
        raise HTTPException(status_code=404, detail="Métricas no encontradas")
    return db_metrica

@router.post("/", response_model=MetricaUsuarioInDB)
def create_metricas_for_usuario(metrica: MetricaUsuarioCreate, db: Session = Depends(get_db)):
    # Verificar que el usuario existe
    db_usuario = get_user(db, usuario_id=metrica.id_usuario)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar si ya existen métricas para este usuario
    existing_metrics = get_metrica_usuario(db, id_usuario=metrica.id_usuario)
    if existing_metrics:
        raise HTTPException(status_code=400, detail="El usuario ya tiene métricas registradas")
    
    return create_or_update_metrica_usuario(
        db=db,
        metrica=metrica,
        genero=db_usuario.genero,
        peso=db_usuario.peso,
        altura=db_usuario.altura,
        edad=db_usuario.edad
    )

@router.put("/{id_usuario}", response_model=MetricaUsuarioInDB)
def update_metricas_for_usuario(id_usuario: int, db: Session = Depends(get_db)):
    # Verificar que el usuario existe
    db_usuario = get_user(db, usuario_id=id_usuario)
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return update_metrica_usuario(
        db=db,
        id_usuario=id_usuario,
        genero=db_usuario.genero,
        peso=db_usuario.peso,
        altura=db_usuario.altura,
        edad=db_usuario.edad
    )

@router.delete("/{id_usuario}", response_model=dict)
def delete_metricas_usuario(id_usuario: int, db: Session = Depends(get_db)):
    success = delete_metrica_usuario(db, id_usuario=id_usuario)
    if not success:
        raise HTTPException(status_code=404, detail="Métricas no encontradas")
    return {"message": "Métricas eliminadas correctamente"}