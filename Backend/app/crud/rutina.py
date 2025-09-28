from fastapi import HTTPException
from sqlalchemy import or_, and_
from sqlalchemy import String
from sqlalchemy.orm import Session
from app.enums import ParteMusculo
from app.models.users import Usuario
from app.schemas.users import User
from app.models.rutina import Rutina
from app.schemas.rutina import RutinaCreate, RutinaUpdate
from typing import Any, Dict, List, Optional, Union, cast
from sqlalchemy import func, cast, Text
from sqlalchemy.dialects.postgresql import JSONB


def create_rutina(
    db: Session, 
    rutina: RutinaCreate, 
    current_user: Union[Dict[str, Any], User]
) -> Rutina:
    """
    Crea una nueva rutina con validaciones robustas - VERSIÓN ARRAYS JSON
    """
    def get_user_attr(user, attr):
        if isinstance(user, dict):
            return user.get(attr)
        return getattr(user, attr, None)
    
    current_user_rol = get_user_attr(current_user, 'rol')
    current_user_categoria = get_user_attr(current_user, 'categoria')
    current_user_id = get_user_attr(current_user, 'id_usuario')
    
    if hasattr(current_user_rol, 'value'):
        current_user_rol = current_user_rol.value
    if hasattr(current_user_categoria, 'value'):
        current_user_categoria = current_user_categoria.value

    # Validación para el campo id_entrenador
    if rutina.id_entrenador:
        if current_user_rol != "administrador":
            raise ValueError("Solo administradores pueden asignar a otros entrenadores")
        
        entrenador = db.query(Usuario).filter(
            Usuario.id_usuario == rutina.id_entrenador,
            Usuario.rol == "entrenador",
            or_(
                Usuario.categoria == "calistenia",
                Usuario.categoria == "powerplate"
            ),
            Usuario.activo == True
        ).first()
        
        if not entrenador:
            raise ValueError("El ID debe corresponder a un entrenador de calistenia o powerplate activo y válido")
        
        id_usuario_asignado = rutina.id_entrenador
    else:
        if current_user_rol == "entrenador":
            if current_user_categoria not in ["calistenia", "powerplate"]:
                raise ValueError("Solo entrenadores de calistenia o powerplate pueden crear rutinas")
        elif current_user_rol != "administrador":
            raise ValueError("No tienes permisos para crear rutinas")
        
        id_usuario_asignado = current_user_id
    
    # CAMBIO PRINCIPAL: Convertir arrays de enums a arrays de strings
    # Si tienes múltiples músculos por ejercicio: List[List[ParteMusculo]]
    if isinstance(rutina.partes_musculo[0], list):
        partes_musculo = [[musculo.value for musculo in ejercicio_musculos] for ejercicio_musculos in rutina.partes_musculo]
    else:
        # Si tienes un músculo por ejercicio: List[ParteMusculo]
        partes_musculo = [musculo.value for musculo in rutina.partes_musculo]

    # Crear la rutina con arrays JSON
    db_rutina = Rutina(
        nombre_ejercicio=rutina.nombres_ejercicios,  # Array de strings
        partes_musculo=partes_musculo,               # Array de strings (o array de arrays)
        repeticiones=rutina.repeticiones,            # Array de integers
        series=rutina.series,                        # Array de integers
        id_usuario=id_usuario_asignado
    )
    
    db.add(db_rutina)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise ValueError(f"Error al crear la rutina: {str(e)}")
    
    db.refresh(db_rutina)
    return db_rutina

def get_rutina_with_entrenador(db: Session, rutina_id: int) -> Optional[Dict[str, Any]]:
    """Obtiene rutina con info del entrenador - VERSIÓN ARRAYS JSON"""
    rutina = db.query(Rutina).filter(
        Rutina.id_rutina == rutina_id
    ).first()
    
    if not rutina:
        return None
    
    entrenador = db.query(Usuario).filter(
        Usuario.id_usuario == rutina.id_usuario
    ).first()
    
    return {
        "id_rutina": rutina.id_rutina,
        "nombres_ejercicios": rutina.nombre_ejercicio,    # Array JSON
        "partes_musculo": rutina.partes_musculo,          # Array JSON
        "repeticiones": rutina.repeticiones,              # Array JSON
        "series": rutina.series,                          # Array JSON
        "id_usuario": rutina.id_usuario,
        "entrenador": {
            "id": entrenador.id_usuario,
            "nombre": entrenador.nombre,
            "apellido_p": entrenador.apellido_p,
            "apellido_m": entrenador.apellido_m,
            "rol": entrenador.rol,
            "categoria": entrenador.categoria
        } if entrenador else None
    }

def list_rutinas(
    db: Session, 
    current_user: Union[Dict[str, Any], User],
    skip: int = 0, 
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Lista rutinas con diferentes privilegios - VERSIÓN ARRAYS JSON
    """
    def get_user_attr(user, attr):
        if isinstance(user, dict):
            return user.get(attr)
        return getattr(user, attr, None)
    
    current_user_rol = get_user_attr(current_user, 'rol')
    current_user_id = get_user_attr(current_user, 'id_usuario')
    
    if hasattr(current_user_rol, 'value'):
        current_user_rol = current_user_rol.value

    query = db.query(Rutina)
    
    if current_user_rol != "administrador":
        query = query.filter(Rutina.id_usuario == current_user_id)
    
    rutinas = query.offset(skip).limit(limit).all()
    result = []
    
    for rutina in rutinas:
        entrenador = db.query(Usuario).filter(
            Usuario.id_usuario == rutina.id_usuario
        ).first()
        
        result.append({
            "id_rutina": rutina.id_rutina,
            "nombres_ejercicios": rutina.nombre_ejercicio,    # Array JSON
            "partes_musculo": rutina.partes_musculo,          # Array JSON
            "repeticiones": rutina.repeticiones,              # Array JSON
            "series": rutina.series,                          # Array JSON
            "id_usuario": rutina.id_usuario,
            "entrenador": entrenador_info(entrenador) if entrenador else None
        })
    
    return result

def search_rutinas(
    db: Session,
    current_user: Union[Dict[str, Any], object],
    search_term: str,
    skip: int = 0,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Busca rutinas - BÚSQUEDA EXACTA (DEBE CONTENER TODOS LOS TÉRMINOS)
    """
    def get_user_attr(user, attr):
        if isinstance(user, dict):
            return user.get(attr)
        return getattr(user, attr, None)
    
    current_user_rol = get_user_attr(current_user, 'rol')
    current_user_id = get_user_attr(current_user, 'id_usuario')
    
    if hasattr(current_user_rol, 'value'):
        current_user_rol = current_user_rol.value

    query = db.query(Rutina)
    
    if current_user_rol != "administrador":
        query = query.filter(Rutina.id_usuario == current_user_id)
    
    all_rutinas = query.all()
    
    # Dividir el término de búsqueda en palabras individuales
    palabras_busqueda = [palabra.lower() for palabra in search_term.split()]
    
    # Filtramos en memoria - DEBE CONTENER TODAS las palabras
    rutinas_filtradas = []
    
    for rutina in all_rutinas:
        # Verificar si la rutina contiene TODOS los términos buscados
        contiene_todos = True
        
        # Para cada palabra de búsqueda, verificar si existe en algún campo
        for palabra in palabras_busqueda:
            palabra_encontrada = False
            
            # Buscar en nombres de ejercicios
            if rutina.nombre_ejercicio:
                for ejercicio in rutina.nombre_ejercicio:
                    if palabra in str(ejercicio).lower():
                        palabra_encontrada = True
                        break
            
            # Si no se encontró en ejercicios, buscar en músculos
            if not palabra_encontrada and rutina.partes_musculo:
                for musculo in rutina.partes_musculo:
                    if palabra in str(musculo).lower():
                        palabra_encontrada = True
                        break
            
            # Si no se encontró en músculos, buscar en números (solo si la palabra es numérica)
            if not palabra_encontrada and palabra.isdigit():
                if rutina.repeticiones:
                    for repeticion in rutina.repeticiones:
                        if palabra == str(repeticion):
                            palabra_encontrada = True
                            break
                
                if not palabra_encontrada and rutina.series:
                    for serie in rutina.series:
                        if palabra == str(serie):
                            palabra_encontrada = True
                            break
            
            # Si alguna palabra no se encontró, esta rutina no califica
            if not palabra_encontrada:
                contiene_todos = False
                break
        
        # Si contiene todos los términos, agregar a resultados
        if contiene_todos:
            rutinas_filtradas.append(rutina)
    
    # Aplicar paginación
    rutinas_paginadas = rutinas_filtradas[skip:skip + limit]
    
    result = []
    for rutina in rutinas_paginadas:
        entrenador = db.query(Usuario).filter(
            Usuario.id_usuario == rutina.id_usuario
        ).first()
        
        result.append({
            "id_rutina": rutina.id_rutina,
            "nombres_ejercicios": rutina.nombre_ejercicio,
            "partes_musculo": rutina.partes_musculo,
            "repeticiones": rutina.repeticiones,
            "series": rutina.series,
            "id_usuario": rutina.id_usuario,
            "entrenador": entrenador_info(entrenador) if entrenador else None
        })
    
    return result

def update_rutina(
    db: Session, 
    rutina_id: int, 
    rutina_data: RutinaUpdate,
    current_user: Union[Dict[str, Any], User]
) -> Optional[Dict[str, Any]]:
    """
    Actualiza una rutina con validación de permisos - VERSIÓN ARRAYS JSON
    """
    try:
        def get_user_attr(user, attr):
            if isinstance(user, dict):
                return user.get(attr)
            return getattr(user, attr, None)
        
        current_user_rol = get_user_attr(current_user, 'rol')
        current_user_id = get_user_attr(current_user, 'id_usuario')
        
        if hasattr(current_user_rol, 'value'):
            current_user_rol = current_user_rol.value

        db_rutina = db.query(Rutina).filter(
            Rutina.id_rutina == rutina_id
        ).first()
        
        if not db_rutina:
            raise HTTPException(status_code=404, detail="Rutina no encontrada")
        
        if current_user_rol != "administrador" and db_rutina.id_usuario != current_user_id:
            raise ValueError("No tienes permisos para modificar esta rutina")
        
        update_data = rutina_data.dict(exclude_unset=True)
        
        # CAMBIO PRINCIPAL: Mejorar el manejo de id_entrenador
        if "id_entrenador" in update_data:
            if current_user_rol != "administrador":
                raise ValueError("Solo administradores pueden cambiar el entrenador asignado")
            
            # Si id_entrenador es None, asignar al usuario actual (administrador)
            if update_data["id_entrenador"] is None:
                db_rutina.id_usuario = current_user_id
                print(f"DEBUG: Asignando rutina al admin actual: {current_user_id}")
            else:
                # Validar que el entrenador existe y es válido
                usuario_destino = db.query(Usuario).filter(
                    Usuario.id_usuario == update_data["id_entrenador"],
                    Usuario.activo == True,
                    or_(
                        and_(
                            Usuario.rol == "entrenador",
                            or_(
                                Usuario.categoria == "calistenia",
                                Usuario.categoria == "powerplate"
                            )
                        ),
                        Usuario.rol == "administrador"
                    )
                ).first()
        
                if not usuario_destino:
                    raise ValueError("El ID debe corresponder a un entrenador activo válido o un administrador")
        
                db_rutina.id_usuario = update_data["id_entrenador"]
                print(f"DEBUG: Asignando rutina a entrenador: {update_data['id_entrenador']}")
            
            # Remover id_entrenador de update_data ya que lo manejamos manualmente
            del update_data["id_entrenador"]
        
        # CAMBIO: Manejo especial para partes_musculo con arrays
        if "partes_musculo" in update_data:
            if isinstance(update_data["partes_musculo"][0], list):
                # Multiple músculos por ejercicio
                update_data["partes_musculo"] = [
                    [musculo.value for musculo in ejercicio_musculos] 
                    for ejercicio_musculos in update_data["partes_musculo"]
                ]
            else:
                # Un músculo por ejercicio
                update_data["partes_musculo"] = [
                    musculo.value for musculo in update_data["partes_musculo"]
                ]
        
        # CAMBIO: Mapear nombres_ejercicios a nombre_ejercicio (campo de base de datos)
        if "nombres_ejercicios" in update_data:
            update_data["nombre_ejercicio"] = update_data["nombres_ejercicios"]
            del update_data["nombres_ejercicios"]
        
        # Actualizar solo los campos que vinieron en la petición
        for field, value in update_data.items():
            setattr(db_rutina, field, value)
        
        # DEBUG: Imprimir valores antes del commit
        print(f"DEBUG: ID Usuario final en rutina: {db_rutina.id_usuario}")
        print(f"DEBUG: Usuario actual: {current_user_id}, Rol: {current_user_rol}")
        
        db.commit()
        db.refresh(db_rutina)
        
        # Obtener el entrenador actual
        entrenador = db.query(Usuario).filter(
            Usuario.id_usuario == db_rutina.id_usuario
        ).first()
        
        return {
            "id_rutina": db_rutina.id_rutina,
            "nombres_ejercicios": db_rutina.nombre_ejercicio,
            "partes_musculo": db_rutina.partes_musculo,
            "repeticiones": db_rutina.repeticiones,
            "series": db_rutina.series,
            "id_usuario": db_rutina.id_usuario,
            "entrenador": entrenador_info(entrenador) if entrenador else None
        }
        
    except ValueError as e:
        print(f"DEBUG: ValueError en update_rutina: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"DEBUG: Exception en update_rutina: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al actualizar la rutina: {str(e)}"
        )

def delete_rutina(
    db: Session, 
    rutina_id: int,
    current_user: Union[Dict[str, Any], User]
) -> bool:
    """
    Elimina una rutina con validación de permisos - SIN CAMBIOS
    """
    def get_user_attr(user, attr):
        if isinstance(user, dict):
            return user.get(attr)
        return getattr(user, attr, None)
    
    current_user_rol = get_user_attr(current_user, 'rol')
    current_user_id = get_user_attr(current_user, 'id_usuario')
    
    if hasattr(current_user_rol, 'value'):
        current_user_rol = current_user_rol.value

    db_rutina = db.query(Rutina).filter(
        Rutina.id_rutina == rutina_id
    ).first()
    
    if not db_rutina:
        return False
    
    if current_user_rol != "administrador" and db_rutina.id_usuario != current_user_id:
        raise ValueError("No tienes permisos para eliminar esta rutina")
    
    db.delete(db_rutina)
    db.commit()
    return True

def entrenador_info(entrenador: Usuario) -> Dict[str, Any]:
    """Helper para formatear info del entrenador - SIN CAMBIOS"""
    return {
        "id": entrenador.id_usuario,
        "nombre": entrenador.nombre,
        "apellido_p": entrenador.apellido_p,
        "apellido_m": entrenador.apellido_m,
        "rol": entrenador.rol,
        "categoria": entrenador.categoria
    }