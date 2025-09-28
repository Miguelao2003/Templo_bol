from __future__ import annotations
from fastapi import HTTPException, logger, status
from sqlalchemy.orm import Session
from sqlalchemy import String, or_, and_, extract
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, List
from app.utils.fechas import get_dia_semana
from app.models.horarios import Horario
from app.models.rutina import Rutina
from app.models.users import Usuario
from app.models.horarios import Horario as ModelHorario
from app.models.users import Usuario as ModelUsuario
from typing import List, Dict, Optional
from app.database import get_db 
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from app.schemas.horarios import (
    HorarioCreate,
    HorarioUpdate,
    HorarioFilter,
    HorarioSearch,
    TipoHorario,
    EstadoHorario,
    NivelHorario,  # Agregar el nuevo enum
)

def create_horario(db: Session, horario: HorarioCreate, user_rol: str, user_id: int):
    # 1. Validación básica de permisos
    if user_rol not in ["administrador", "entrenador"]:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para crear horarios"
        )

    # 2. Lógica mejorada de asignación de entrenador
    if user_rol == "entrenador":
        if horario.id_entrenador is not None and horario.id_entrenador != user_id:
            raise HTTPException(
                status_code=400,
                detail="No puedes especificar ID de entrenador. Se usará tu ID automáticamente"
            )
        entrenador_id = user_id
        necesita_validar_categoria = True
    else:  # Administrador
        if horario.id_entrenador is None:
            # Autoasignación como entrenador temporal
            entrenador_id = user_id
            necesita_validar_categoria = False
        else:
            # Asignación a otro entrenador
            entrenador_id = horario.id_entrenador
            necesita_validar_categoria = True

    # 3. Validar existencia del usuario asignado
    usuario_asignado = db.query(Usuario).filter(
        Usuario.id_usuario == entrenador_id
    ).first()

    if not usuario_asignado:
        raise HTTPException(
            status_code=404,
            detail="El usuario especificado no existe"
        )

    # 4. Validar rol y categoría (solo cuando es necesario)
    if necesita_validar_categoria:
        if usuario_asignado.rol != "entrenador":
            raise HTTPException(
                status_code=400,
                detail="El usuario especificado no es un entrenador"
            )
        
        if usuario_asignado.categoria != horario.tipo.value:
            raise HTTPException(
                status_code=400,
                detail=f"El entrenador es de categoría {usuario_asignado.categoria} y no puede asignarse a un horario de tipo {horario.tipo.value}"
            )

    # 4.5 Validar que la rutina exista si se proporciona
    if horario.id_rutina is not None:
        rutina = db.query(Rutina).filter(Rutina.id_rutina == horario.id_rutina).first()
        if not rutina:
            raise HTTPException(
                status_code=404,
                detail="La rutina especificada no existe"
            )
        # Opcional: Validar que la rutina pertenezca al entrenador si no es admin
        if user_rol == "entrenador" and rutina.id_usuario != user_id:
            raise HTTPException(
                status_code=403,
                detail="No puedes asignar rutinas que no son tuyas"
            )
        
        # Validar que el entrenador de la rutina coincida con el asignado al horario
        if user_rol == "administrador":
            if horario.id_entrenador is not None and rutina.id_usuario != horario.id_entrenador:
                raise HTTPException(
                    status_code=400,
                    detail=f"El entrenador asignado (ID: {horario.id_entrenador}) no es el creador de esta rutina (creada por ID: {rutina.id_usuario})"
                )

    # 5. Validaciones de tiempo (fechas y horas)
    ahora = datetime.now()
    hora_inicio = datetime.combine(horario.fecha, horario.hora_inicio)
    hora_fin = datetime.combine(horario.fecha, horario.hora_fin)
    
    if hora_inicio < ahora:
        raise HTTPException(
            status_code=400,
            detail=f"La hora de inicio debe ser futura. Hora actual: {ahora.strftime('%H:%M:%S')}"
        )
    
    if hora_fin < ahora:
        raise HTTPException(
            status_code=400,
            detail=f"La hora de fin debe ser futura. Hora actual: {ahora.strftime('%H:%M:%S')}"
        )

    if horario.fecha < date.today():
        raise HTTPException(
            status_code=400,
            detail="No se pueden crear horarios con fechas pasadas"
        )

    if horario.hora_fin <= horario.hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="La hora de fin debe ser mayor a la hora de inicio"
        )

    # 6. Creación del horario (asegurando que cargue las relaciones)
    try:
        db_horario = Horario(
            nombre_horario=horario.nombre_horario,
            id_rutina=horario.id_rutina,
            nivel=horario.nivel,  # Agregar el nuevo campo
            **horario.dict(exclude={'id_entrenador', 'nombre_horario', 'id_rutina', 'nivel'}),
            id_entrenador=entrenador_id
        )
        db.add(db_horario)
        db.commit()
        db.refresh(db_horario)
        
        # Obtener el horario con todas las relaciones cargadas
        db_horario_completo = db.query(Horario).options(
            joinedload(Horario.entrenador),
            joinedload(Horario.rutina)
        ).filter(Horario.id_horario == db_horario.id_horario).first()
        
        response_data = {
            "id_horario": db_horario_completo.id_horario,
            "nombre_horario": db_horario_completo.nombre_horario,
            "id_entrenador": db_horario_completo.id_entrenador,
            "id_rutina": db_horario_completo.id_rutina,
            "tipo": db_horario_completo.tipo.value,
            "fecha": db_horario_completo.fecha.isoformat(),
            "hora_inicio": db_horario_completo.hora_inicio.strftime("%H:%M:%S"),
            "hora_fin": db_horario_completo.hora_fin.strftime("%H:%M:%S"),
            "capacidad": db_horario_completo.capacidad,
            "estado": db_horario_completo.estado.value,
            "descripcion": db_horario_completo.descripcion,
            "nivel": db_horario_completo.nivel.value,  # Agregar nivel en la respuesta
            "dia_semana": get_dia_semana(db_horario_completo.fecha),
            "entrenador": {
                "id_usuario": db_horario_completo.entrenador.id_usuario,
                "nombre": db_horario_completo.entrenador.nombre,
                "apellido_p": db_horario_completo.entrenador.apellido_p,
                "apellido_m": db_horario_completo.entrenador.apellido_m,
                "categoria": db_horario_completo.entrenador.categoria.value if db_horario_completo.entrenador.categoria else None
            } if db_horario_completo.entrenador else None,
            "rutina": {
                "id_rutina": db_horario_completo.rutina.id_rutina,
                "nombre_ejercicio": db_horario_completo.rutina.nombre_ejercicio,  # Actualizado
                "partes_musculo": db_horario_completo.rutina.partes_musculo,
                "repeticiones": db_horario_completo.rutina.repeticiones,
                "series": db_horario_completo.rutina.series,
                "id_usuario": db_horario_completo.rutina.id_usuario  # Agregado
            } if db_horario_completo.rutina else None
        }
        
        return response_data
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear el horario: {str(e)}"
        )

def _build_horario_response(horarios):
    """Construye la respuesta estándar para horarios"""
    return [
        {
            "id_horario": h.id_horario,
            "nombre_horario": h.nombre_horario or "Clase sin nombre",
            "id_entrenador": h.id_entrenador,
            "id_rutina": h.id_rutina,
            "tipo": h.tipo.value,
            "fecha": h.fecha.isoformat(),
            "hora_inicio": h.hora_inicio.strftime("%H:%M:%S"),
            "hora_fin": h.hora_fin.strftime("%H:%M:%S"),
            "capacidad": h.capacidad,
            "estado": h.estado.value,
            "descripcion": h.descripcion,
            "nivel": h.nivel.value,  # Agregar nivel
            "dia_semana": get_dia_semana(h.fecha),
            "entrenador": {
                "id_usuario": h.entrenador.id_usuario,
                "nombre": h.entrenador.nombre,
                "apellido_p": h.entrenador.apellido_p,
                "apellido_m": h.entrenador.apellido_m,
                "categoria": h.entrenador.categoria.value if h.entrenador.categoria else None
            } if h.entrenador else None,
            "rutina": {
                "id_rutina": h.rutina.id_rutina,
                "nombre_ejercicio": h.rutina.nombre_ejercicio,  # Corregido: usar nombre_ejercicio
                "partes_musculo": h.rutina.partes_musculo,
                "repeticiones": h.rutina.repeticiones,
                "series": h.rutina.series,
                "id_usuario": h.rutina.id_usuario
            } if h.rutina else None
        }
        for h in horarios
    ]

def get_horarios(
    db: Session,
    user_rol: str,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
    """
    Obtiene horarios para administradores (todos) y entrenadores (solo los suyos)
    Sin filtros de fecha
    """
    try:
        query = db.query(Horario).options(joinedload(Horario.entrenador),
                                          joinedload(Horario.rutina))
        
        if user_rol == "entrenador":
            query = query.filter(Horario.id_entrenador == user_id)
        # Admin no necesita filtros
        
        horarios = query.order_by(
            Horario.fecha.asc(),
            Horario.hora_inicio.asc()
        ).offset(skip).limit(limit).all()

        return _build_horario_response(horarios)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener horarios: {str(e)}"
        )

def get_horarios_cliente(
    db: Session,
    user_rol: str,
    user_id: int,
    user_categoria: str,
    skip: int = 0,
    limit: int = 100
):
    try:
        hoy = datetime.now().date()

        # Semana actual (lunes a sábado)
        lunes_actual = hoy - timedelta(days=hoy.weekday())  # lunes de esta semana
        sabado_actual = lunes_actual + timedelta(days=5)    # sábado

        # 3 días de la próxima semana (lunes a miércoles)
        lunes_proxima = lunes_actual + timedelta(days=7)
        miercoles_proxima = lunes_proxima + timedelta(days=2)

        # Consulta base
        query = db.query(Horario).options(joinedload(Horario.entrenador),
                                          joinedload(Horario.rutina)).filter(
            or_(
                and_(Horario.fecha >= lunes_actual, Horario.fecha <= sabado_actual),
                and_(Horario.fecha >= lunes_proxima, Horario.fecha <= miercoles_proxima)
            )
        )

        # Filtros por rol
        if user_rol == "entrenador":
            query = query.filter(Horario.id_entrenador == user_id)
        elif user_rol == "cliente":
            query = query.filter(Horario.tipo == user_categoria)

        # Ordenar por fecha y hora
        horarios = query.order_by(
            Horario.fecha.asc(),
            Horario.hora_inicio.asc()
        ).offset(skip).limit(limit).all()

        # Eliminar domingos (0 = lunes, 6 = domingo)
        horarios = [h for h in horarios if h.fecha.weekday() != 6]

        return _build_horario_response(horarios)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener horarios: {str(e)}"
        )
    
def get_fechas_por_dia_semana(dia_semana: str):
    """Devuelve fechas para el día de la semana especificado (ej: 'Lunes')"""
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    try:
        dia_index = dias.index(dia_semana.capitalize())
    except ValueError:
        return []
    
    # Obtener todas las fechas futuras con ese día de la semana
    hoy = datetime.now().date()
    fechas = []
    for i in range(0, 30):  # Buscar en los próximos 30 días
        fecha = hoy + timedelta(days=i)
        if fecha.weekday() == dia_index:
            fechas.append(fecha)
    return fechas

def search_horarios(
    db: Session,
    search_params: HorarioSearch,
    user_rol: str,
    user_id: int,
    user_categoria: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    try:
        # Validar permisos según rol
        _validate_role_permissions(search_params, user_rol)
        
        # Consulta base con join al entrenador
        query = db.query(Horario).options(joinedload(Horario.entrenador),
                                          joinedload(Horario.rutina))
        
        # Aplicar filtros según rol
        query = _apply_role_filters(db, query, search_params, user_rol, user_id, user_categoria)
        
        # Ejecutar consulta
        horarios = query.order_by(
            Horario.fecha.asc(),
            Horario.hora_inicio.asc()
        ).offset(skip).limit(limit).all()
        
        if not horarios:
            raise HTTPException(
                status_code=404,
                detail=_get_no_results_message(user_rol, search_params)
            )
        
        return _build_horario_response(horarios)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en búsqueda: {str(e)}"
        )


def _validate_role_permissions(search_params: HorarioSearch, user_rol: str):
    """Valida que el usuario solo use campos permitidos para su rol"""
    if user_rol == "administrador":
        return  # Admin puede usar todos los campos
    
    forbidden_fields = []
    
    if user_rol == "entrenador":
        forbidden_fields = [
            (search_params.id_entrenador, "id_entrenador"),
            (search_params.tipo, "tipo"),
            (getattr(search_params, 'nombre_entrenador', None), "nombre_entrenador"),
            (getattr(search_params, 'apellido_entrenador', None), "apellido_entrenador"),
            (getattr(search_params, 'categoria_entrenador', None), "categoria_entrenador")
        ]
    elif user_rol == "cliente":
        # Permitir fecha y estado para clientes
        forbidden_fields = [
            (search_params.id_horario, "id_horario"),
            (search_params.id_entrenador, "id_entrenador"),
            (search_params.tipo, "tipo"),
            # Removido: (search_params.fecha, "fecha"),
            (search_params.hora_fin, "hora_fin"),
            # Removido: (search_params.estado, "estado"),
            (getattr(search_params, 'nombre_entrenador', None), "nombre_entrenador"),
            (getattr(search_params, 'apellido_entrenador', None), "apellido_entrenador"),
            (getattr(search_params, 'categoria_entrenador', None), "categoria_entrenador")
        ]
    
    used_forbidden_fields = [field_name for field_value, field_name in forbidden_fields if field_value is not None]
    
    if used_forbidden_fields:
        raise HTTPException(
            status_code=403,
            detail=f"No tienes permiso para filtrar por estos campos: {', '.join(used_forbidden_fields)}"
        )


def _apply_role_filters(db: Session, query, search_params: HorarioSearch, user_rol: str, user_id: int, user_categoria: Optional[str]):
    """Aplica los filtros según el rol del usuario"""
    
    # Filtro base por rol
    if user_rol == "entrenador":
        query = query.filter(Horario.id_entrenador == user_id)
    elif user_rol == "cliente":
        query = query.filter(Horario.tipo == user_categoria)
    
    # Campos comunes a todos los roles
    if search_params.nombre_horario:
        query = query.filter(Horario.nombre_horario.ilike(f"%{search_params.nombre_horario}%"))
    if search_params.hora_inicio:
        query = query.filter(Horario.hora_inicio >= search_params.hora_inicio)
    if search_params.capacidad:
        query = query.filter(Horario.capacidad == search_params.capacidad)
    if search_params.dia_semana:
        query = query.filter(Horario.fecha.in_(get_fechas_por_dia_semana(search_params.dia_semana)))
    # Agregar filtro por nivel
    if search_params.nivel:
        query = query.filter(Horario.nivel == search_params.nivel)
    
    # Campos de fecha y estado ahora permitidos para clientes
    if search_params.fecha:
        query = query.filter(Horario.fecha == search_params.fecha)
    if search_params.estado:
        query = query.filter(Horario.estado == search_params.estado)
    
    # Manejo especial para búsqueda por ID de horario (entrenador)
    if user_rol == "entrenador" and search_params.id_horario:
        horario_existente = db.query(Horario).filter(
            Horario.id_horario == search_params.id_horario,
            Horario.id_entrenador == user_id
        ).first()
        
        if not horario_existente:
            raise HTTPException(
                status_code=404,
                detail="No se encontró el horario o no tienes permiso para verlo"
            )
        return query.filter(Horario.id_horario == search_params.id_horario)
    
    # Filtros específicos para administrador
    if user_rol == "administrador":
        if search_params.id_horario:
            query = query.filter(Horario.id_horario == search_params.id_horario)
        if search_params.id_entrenador:
            query = query.filter(Horario.id_entrenador == search_params.id_entrenador)
        if search_params.tipo:
            query = query.filter(Horario.tipo == search_params.tipo)
        if search_params.hora_fin:
            query = query.filter(Horario.hora_fin <= search_params.hora_fin)
        if hasattr(search_params, 'nombre_entrenador') and search_params.nombre_entrenador:
            query = query.join(Usuario).filter(Usuario.nombre.ilike(f"%{search_params.nombre_entrenador}%"))
        if hasattr(search_params, 'apellido_entrenador') and search_params.apellido_entrenador:
            query = query.join(Usuario).filter(Usuario.apellido_p.ilike(f"%{search_params.apellido_entrenador}%"))
        if hasattr(search_params, 'categoria_entrenador') and search_params.categoria_entrenador:
            query = query.join(Usuario).filter(Usuario.categoria == search_params.categoria_entrenador)
    
    # Filtros adicionales para entrenador (hora_fin ya se maneja arriba)
    elif user_rol == "entrenador":
        if search_params.hora_fin:
            query = query.filter(Horario.hora_fin <= search_params.hora_fin)
    
    return query

def _get_no_results_message(user_rol: str, search_params: HorarioSearch) -> str:
    if user_rol == "entrenador" and search_params.id_horario:
        return "No se encontró el horario o no tienes permiso para verlo"
    
    messages = {
        "administrador": "No se encontraron horarios con los criterios especificados",
        "entrenador": "No tienes horarios que coincidan con la búsqueda",
        "cliente": "No hay horarios disponibles para tu categoría con estos filtros"
    }
    return messages.get(user_rol, "No se encontraron resultados")

def update_horario(
    db: Session,
    horario_id: int,
    horario_update: HorarioUpdate,
    user_id: int,
    user_rol: str,
    user_categoria: Optional[str] = None
):
    try:
        # Obtener el horario existente con relaciones
        horario = (db.query(ModelHorario)
            .options(
                joinedload(ModelHorario.entrenador),
                joinedload(ModelHorario.rutina)
            )
            .filter(ModelHorario.id_horario == horario_id)
            .first()
        )

        if not horario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Horario no encontrado"
            )

        # Validaciones para entrenador
        if user_rol == "entrenador":
            # Verificar que el horario pertenezca al entrenador
            if horario.id_entrenador != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No puedes actualizar horarios de otros entrenadores"
                )
            
            # Validar que no intente cambiar campos no permitidos
            if horario_update.tipo is not None and horario_update.tipo != horario.tipo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No puedes cambiar el tipo de horario"
                )
            
            # Entrenadores no pueden cambiar el entrenador asignado
            if horario_update.id_entrenador is not None:
                raise HTTPException(
                    status_code=403,
                    detail="No puedes cambiar el entrenador asignado"
                )

        # Validaciones para admin
        elif user_rol == "administrador":
            # Si está asignando un nuevo entrenador, validar
            if horario_update.id_entrenador is not None:
                nuevo_usuario = db.query(ModelUsuario).filter(
                    ModelUsuario.id_usuario == horario_update.id_entrenador,
                    ModelUsuario.rol.in_(["entrenador", "administrador"])
                ).first()
                
                if not nuevo_usuario:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="El ID proporcionado no corresponde a un entrenador o administrador válido"
                    )
                
                # Solo validar categoría si NO es administrador
                if nuevo_usuario.rol != "administrador":
                    # Validar que la categoría del entrenador coincida con el tipo de horario
                    if (horario_update.tipo or horario.tipo) == TipoHorario.powerplate:
                        if nuevo_usuario.categoria != "powerplate":
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="El entrenador asignado no tiene la categoría powerplate"
                            )
                    elif (horario_update.tipo or horario.tipo) == TipoHorario.calistenia:
                        if nuevo_usuario.categoria != "calistenia":
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="El entrenador asignado no tiene la categoría calistenia"
                            )
                
                # Actualizar el entrenador del horario
                horario.id_entrenador = horario_update.id_entrenador
                # Si tiene rutina asociada, actualizar también el dueño de la rutina
                if horario.rutina:
                    horario.rutina.id_usuario = horario_update.id_entrenador
                    db.add(horario.rutina)
        
            # Validar rutina si se está actualizando
            if horario_update.id_rutina is not None:
                rutina = db.query(Rutina).filter(Rutina.id_rutina == horario_update.id_rutina).first()
                if not rutina:
                    raise HTTPException(
                        status_code=404,
                        detail="La rutina especificada no existe"
                    )
            
                # Validar permisos sobre la rutina
                if user_rol == "entrenador" and rutina.id_usuario != user_id:
                    raise HTTPException(
                        status_code=403,
                        detail="No puedes asignar rutinas que no son tuyas"
                    )

        # Actualizar campos permitidos
        update_data = horario_update.dict(exclude_unset=True, exclude={"id_entrenador"})
        
        # Restricción para entrenador - solo campos permitidos
        if user_rol == "entrenador":
            allowed_fields = {
                "nombre_horario", "fecha", "hora_inicio", 
                "hora_fin", "capacidad", "estado", "descripcion",
                "id_rutina", "nivel"  # Agregar nivel a los campos permitidos
            }
            for field in update_data:
                if field not in allowed_fields:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"No tienes permiso para actualizar el campo {field}"
                    )

        # Aplicar actualizaciones
        for field, value in update_data.items():
            setattr(horario, field, value)

        # Validar consistencia de fechas/horas
        _validate_horario_times(horario)

        db.commit()
        db.refresh(horario)
        return horario

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar horario: {str(e)}"
        )

def _validate_horario_times(horario: ModelHorario):
    """Valida que las fechas y horas sean consistentes"""
    from datetime import datetime, date
    
    # Validar fecha no pasada
    if horario.fecha < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede asignar una fecha pasada"
        )
    
    # Validar hora fin > hora inicio
    if horario.hora_fin <= horario.hora_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La hora de fin debe ser mayor a la hora de inicio"
        )
    
    # Validar que no sea en el pasado si es hoy
    if horario.fecha == date.today():
        now = datetime.now().time()
        if horario.hora_inicio < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La hora de inicio debe ser futura para horarios de hoy"
            )

def delete_horario(db: Session, horario_id: int, user_id: int, user_rol: str):
    """
    Elimina permanentemente un horario
    - Admin: puede eliminar cualquier horario
    - Entrenador: solo puede eliminar sus propios horarios
    """
    horario = db.query(ModelHorario).filter(ModelHorario.id_horario == horario_id).first()
    
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )
    
    # Entrenadores solo pueden eliminar sus horarios
    if user_rol == "entrenador" and horario.id_entrenador != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes eliminar tus propios horarios"
        )
    
    try:
        # Verificar si hay reservas asociadas
        #if horario.reservas:  # Asumiendo que tienes una relación 'reservas' en el modelo
            #raise HTTPException(
                #status_code=status.HTTP_400_BAD_REQUEST,
                #detail="No se puede eliminar un horario con reservas activas"
            #)
        
        db.delete(horario)
        db.commit()
        return {"message": "Horario eliminado permanentemente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar horario: {str(e)}"
        )

def toggle_horario_status(
    db: Session, 
    horario_id: int, 
    user_id: int, 
    user_rol: str,
    nuevo_estado: EstadoHorario
):
    """
    Activa/desactiva un horario (admin y entrenadores)
    - Entrenadores solo pueden modificar sus propios horarios
    """
    horario = db.query(ModelHorario).filter(ModelHorario.id_horario == horario_id).first()
    
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario no encontrado"
        )
    
    # Entrenadores solo pueden modificar sus horarios
    if user_rol == "entrenador" and horario.id_entrenador != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar horarios de otros entrenadores"
        )
    
    try:
        horario.estado = nuevo_estado
        db.commit()
        db.refresh(horario)
        return horario
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cambiar estado del horario: {str(e)}"
        )