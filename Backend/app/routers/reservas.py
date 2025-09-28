from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session
from typing import List
from app.crud.reservas import cancelar_reserva as cancelar_reserva_db, registrar_asistencia, parse_json_field
from app.models.users import Usuario
from app.utils.security import get_current_active_user
from app.models.reservas import Reserva
from app.database import get_db
from app.schemas.reservas import AsistenciaUpdate, ListaReservasDetalladas, ReservaConAsistencia, ReservaCreate, ReservaCreateResponse, ReservaDetallada, ReservaInDB, ReservaUpdate, ReservaWithDetails
from app.crud.reservas import (
    get_reservas_detalladas,
    create_reserva,
    get_reservas_con_detalles,
)

router = APIRouter()

@router.post("/", response_model=ReservaCreateResponse, status_code=status.HTTP_201_CREATED)
def crear_reserva(
    reserva: ReservaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    # Verificar roles permitidos
    if current_user.rol not in ["administrador", "cliente"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear reservas"
        )

    # Verificar si el cliente está intentando reservar para sí mismo
    if current_user.rol == "cliente" and reserva.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear reservas para ti mismo"
        )
    
    # Verificar que el usuario existe y tiene categoría
    usuario = db.execute(
        "SELECT categoria FROM usuario WHERE id_usuario = :id",
        {"id": reserva.id_usuario}
    ).first()
    
    if not usuario:
        raise HTTPException(400, detail="Usuario no existe")
    
    # Obtener tipo de horario
    horario = db.execute(
        "SELECT tipo FROM horario WHERE id_horario = :id",
        {"id": reserva.id_horario}
    ).first()
    
    if not horario:
        raise HTTPException(400, detail="Horario no existe")
    
    # Validar coincidencia categoría usuario - tipo horario
    if usuario.categoria != horario.tipo:
        raise HTTPException(
            400,
            detail=f"Usuario de categoría {usuario.categoria} no puede reservar horario de tipo {horario.tipo}"
        )
    
    # Convertir a dict y añadir estado por defecto
    reserva_data = reserva.dict()
    reserva_data["estado"] = "confirmada"
    
    # Crear reserva con validaciones
    return create_reserva(db=db, reserva=reserva_data, user_roles=[current_user.rol])

@router.get("/admin/todas", response_model=ListaReservasDetalladas)
def obtener_todas_reservas_detalladas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver todas las reservas"
        )
    
    reservas = get_reservas_detalladas(db)[skip:skip + limit]
    total = len(get_reservas_detalladas(db))
    
    return {
        "reservas": reservas,
        "total": total,
        "pagina": (skip // limit) + 1,
        "por_pagina": limit
    }

@router.get("/mis-reservas/", response_model=ListaReservasDetalladas)
def obtener_mis_reservas_detalladas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    reservas = get_reservas_detalladas(db, usuario_id=current_user.id_usuario)[skip:skip + limit]
    total = len(get_reservas_detalladas(db, usuario_id=current_user.id_usuario))
    
    return {
        "reservas": reservas,
        "total": total,
        "pagina": (skip // limit) + 1,
        "por_pagina": limit
    }

@router.put("/{reserva_id}/cancelar", response_model=ReservaDetallada)
async def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    try:
        resultado = cancelar_reserva_db(
            db=db,
            reserva_id=reserva_id,
            current_user_id=current_user.id_usuario,
            es_admin=current_user.rol == "administrador"  # CORREGIDO
        )

        reserva = resultado["reserva"]
        usuario = reserva.usuario
        horario = reserva.horario
        rutina = reserva.rutina
        entrenador = horario.entrenador
        equipo = reserva.equipo

        return {
            "id_reserva": reserva.id_reserva,
            "estado": reserva.estado,
            "fecha_reserva": reserva.fecha_reserva,
            "comentarios": reserva.comentarios,
            "asistencia": reserva.asistencia,
            
            # Usuario
            "usuario_id": usuario.id_usuario,
            "usuario_nombre": usuario.nombre,
            "usuario_apellido_p": usuario.apellido_p,
            "usuario_apellido_m": usuario.apellido_m or "",
            "usuario_email": usuario.correo,

            # Horario - CON NIVEL
            "horario_id": horario.id_horario,
            "horario_nombre": horario.nombre_horario or "Clase sin nombre",
            "horario_fecha": horario.fecha,
            "horario_hora_inicio": horario.hora_inicio.strftime("%H:%M:%S"),
            "horario_hora_fin": horario.hora_fin.strftime("%H:%M:%S"),
            "horario_tipo": horario.tipo,
            "horario_nivel": horario.nivel,  # NUEVO
            "horario_capacidad": horario.capacidad,
            "horario_descripcion": horario.descripcion,

            # Entrenador
            "entrenador_id": entrenador.id_usuario,
            "entrenador_nombre": entrenador.nombre,
            "entrenador_apellido_p": entrenador.apellido_p,
            "entrenador_apellido_m": entrenador.apellido_m or "",
            "entrenador_categoria": entrenador.categoria,

            # Rutina - CON JSON
            "rutina_id": rutina.id_rutina if rutina else None,
            "rutina_ejercicios": parse_json_field(rutina.nombre_ejercicio) if rutina else [],
            "rutina_partes_musculo": parse_json_field(rutina.partes_musculo) if rutina else [],
            "rutina_repeticiones": parse_json_field(rutina.repeticiones) if rutina else [],
            "rutina_series": parse_json_field(rutina.series) if rutina else [],

            # Equipo
            "equipo_id": equipo.id_equipo if equipo else None,
            "equipo_nombre": equipo.nombre_equipo if equipo else None,
            "equipo_descripcion": equipo.descripcion if equipo else None,
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cancelar reserva: {str(e)}"
        )

@router.put("/{reserva_id}/asistencia", response_model=ReservaConAsistencia)
def registrar_asistencia_endpoint(
    reserva_id: int,
    datos_asistencia: AsistenciaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    # Verificar roles permitidos (admin o entrenador)
    if current_user.rol not in ["administrador", "entrenador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores y entrenadores pueden registrar asistencia"
        )

    try:
        reserva = registrar_asistencia(
            db=db,
            reserva_id=reserva_id,
            porcentaje=datos_asistencia.asistencia,
            comentarios=datos_asistencia.comentarios,
            usuario_id=current_user.id_usuario
        )

        # Convertir a respuesta detallada
        return {
            "id_reserva": reserva.id_reserva,
            "estado": reserva.estado,
            "asistencia": reserva.asistencia,
            "comentarios": reserva.comentarios,
            "fecha_reserva": reserva.fecha_reserva,
            
            # Usuario
            "usuario_id": reserva.usuario.id_usuario,
            "usuario_nombre": reserva.usuario.nombre,
            "usuario_apellido_p": reserva.usuario.apellido_p,
            "usuario_apellido_m": reserva.usuario.apellido_m or "",
            "usuario_email": reserva.usuario.correo,
            
            # Horario
            "horario_id": reserva.horario.id_horario,
            "horario_nombre": reserva.horario.nombre_horario or "Clase sin nombre",
            "horario_fecha": reserva.horario.fecha,
            "horario_hora_inicio": reserva.horario.hora_inicio.strftime("%H:%M:%S"),
            "horario_hora_fin": reserva.horario.hora_fin.strftime("%H:%M:%S"),
            "horario_tipo": reserva.horario.tipo,
            "horario_nivel": reserva.horario.nivel,  # NUEVO
            "horario_capacidad": reserva.horario.capacidad,
            "horario_descripcion": reserva.horario.descripcion,
            
            # Entrenador
            "entrenador_id": reserva.horario.entrenador.id_usuario,
            "entrenador_nombre": reserva.horario.entrenador.nombre,
            "entrenador_apellido_p": reserva.horario.entrenador.apellido_p,
            "entrenador_apellido_m": reserva.horario.entrenador.apellido_m or "",
            "entrenador_categoria": reserva.horario.entrenador.categoria,
            
            # Rutina
            "rutina_id": reserva.horario.rutina.id_rutina if reserva.horario.rutina else None,
            "rutina_ejercicios": parse_json_field(reserva.horario.rutina.nombre_ejercicio) if reserva.horario.rutina else [],
            "rutina_partes_musculo": parse_json_field(reserva.horario.rutina.partes_musculo) if reserva.horario.rutina else [],
            "rutina_repeticiones": parse_json_field(reserva.horario.rutina.repeticiones) if reserva.horario.rutina else [],
            "rutina_series": parse_json_field(reserva.horario.rutina.series) if reserva.horario.rutina else [],
            
            # Equipo
            "equipo_id": reserva.equipo.id_equipo if reserva.equipo else None,
            "equipo_nombre": reserva.equipo.nombre_equipo if reserva.equipo else None,
            "equipo_descripcion": reserva.equipo.descripcion if reserva.equipo else None,
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar asistencia: {str(e)}"
        )