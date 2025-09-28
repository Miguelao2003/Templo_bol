from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Union

from app.database import get_db
from app.schemas.rutina import (
    Rutina, RutinaCreate, RutinaResponse, RutinaUpdate  # Asegúrate de usar los schemas actualizados
)
from app.crud.rutina import (
    create_rutina, 
    get_rutina_with_entrenador,
    list_rutinas,
    search_rutinas,
    update_rutina, 
    delete_rutina
)
from app.utils.security import get_current_active_user
from app.schemas.users import User

router = APIRouter()

def get_user_dict(user: Union[User, Dict[str, Any]]) -> Dict[str, Any]:
    """Helper function para convertir user a dict de forma consistente"""
    if isinstance(user, dict):
        return user
    
    # Si es un objeto User, convertir a dict
    if hasattr(user, 'dict'):
        return user.dict()
    
    # Fallback manual
    return {
        'id_usuario': getattr(user, 'id_usuario', None),
        'rol': getattr(user, 'rol', None),
        'categoria': getattr(user, 'categoria', None),
        'activo': getattr(user, 'activo', None)
    }

@router.post("/", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def crear_rutina(
    rutina: RutinaCreate,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Crea una nueva rutina de calistenia con múltiples ejercicios.
    - Administradores pueden asignar rutinas a otros entrenadores
    - Entrenadores solo pueden crear rutinas para sí mismos
    
    Ejemplo de datos:
    {
        "nombres_ejercicios": ["Dominadas comando", "Muscle ups", "Push ups"],
        "series": [3, 4, 3],
        "repeticiones": [15, 10, 20],
        "partes_musculo": ["bicep", "espalda", "pecho"],
        "id_entrenador": null
    }
    """
    try:
        user_dict = get_user_dict(current_user)
        nueva_rutina = create_rutina(db=db, rutina=rutina, current_user=user_dict)
        return get_rutina_with_entrenador(db, nueva_rutina.id_rutina)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al crear la rutina: {str(e)}"
        )

@router.get("/", response_model=List[Dict[str, Any]])
def leer_rutinas(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Lista rutinas con diferentes privilegios.
    
    Respuesta ejemplo:
    [
        {
            "id_rutina": 1,
            "nombres_ejercicios": ["Dominadas comando", "Muscle ups"],
            "series": [3, 4],
            "repeticiones": [15, 10],
            "partes_musculo": ["bicep", "espalda"],
            "id_usuario": 5,
            "entrenador": { ... }
        }
    ]
    """
    user_dict = get_user_dict(current_user)
    return list_rutinas(db=db, current_user=user_dict, skip=skip, limit=limit)

@router.get("/buscar/", response_model=List[Dict[str, Any]])
def buscar_rutinas(
    termino: str = "",  # Hacer opcional con valor por defecto
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Busca rutinas según privilegios.
    Permite buscar por nombre de ejercicio, parte muscular o entrenador.
    """
    try:
        user_dict = get_user_dict(current_user)
        
        # Si no hay término, devolver rutinas vacías o todas
        if not termino.strip():
            return []
        
        return search_rutinas(
            db=db,
            current_user=user_dict,
            search_term=termino,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la búsqueda: {str(e)}"
        )

@router.get("/{rutina_id}", response_model=Dict[str, Any])
def leer_rutina(
    rutina_id: int,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Obtiene los detalles de una rutina específica con información del entrenador.
    
    Respuesta ejemplo:
    {
        "id_rutina": 1,
        "nombres_ejercicios": ["Dominadas comando", "Muscle ups"],
        "series": [3, 4],
        "repeticiones": [15, 10],
        "partes_musculo": ["bicep", "espalda"],
        "id_usuario": 5,
        "entrenador": { ... }
    }
    """
    rutina = get_rutina_with_entrenador(db, rutina_id)
    if not rutina:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    
    # CAMBIO: Acceso consistente a los atributos del usuario
    user_dict = get_user_dict(current_user)
    user_rol = user_dict.get('rol')
    user_id = user_dict.get('id_usuario')
    
    if user_rol != "administrador" and rutina["id_usuario"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta rutina"
        )
    
    return rutina

@router.put("/{rutina_id}", response_model=Dict[str, Any])
def actualizar_rutina(
    rutina_id: int,
    rutina: RutinaUpdate,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Actualiza una rutina existente.
    
    Ejemplo de datos para actualización:
    {
        "nombres_ejercicios": ["Dominadas comando", "Push ups", "Flexiones"],
        "series": [4, 3, 3],
        "repeticiones": [12, 15, 20],
        "partes_musculo": ["bicep", "pecho", "pecho"]
    }
    """
    try:
        user_dict = get_user_dict(current_user)
        
        return update_rutina(
            db=db,
            rutina_id=rutina_id,
            rutina_data=rutina,
            current_user=user_dict
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en el servidor: {str(e)}"
        )

@router.delete("/{rutina_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_rutina(
    rutina_id: int,
    db: Session = Depends(get_db),
    current_user: Union[User, Dict[str, Any]] = Depends(get_current_active_user)
):
    """
    Elimina una rutina completa.
    """
    try:
        user_dict = get_user_dict(current_user)
        
        success = delete_rutina(
            db=db,
            rutina_id=rutina_id,
            current_user=user_dict
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Rutina no encontrada")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar rutina: {str(e)}"
        )