from sqlalchemy.orm import Session
from app.models.horarios import Horario
from app.models.reservas import Reserva
from app.schemas.reservas import ReservaCreate, ReservaUpdate, EstadoReserva
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any

def validar_reserva(db: Session, reserva_data: dict):
    # Obtener el horario con su rutina asociada
    horario = db.execute(
        """SELECT h.tipo, h.capacidad, h.estado, h.fecha, h.hora_inicio, h.hora_fin, 
           h.id_rutina as horario_id_rutina, h.nivel, h.nombre_horario
           FROM horario h 
           WHERE h.id_horario = :id_horario""",
        {"id_horario": reserva_data["id_horario"]}
    ).first()
    
    if not horario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario no existe"
        )
    
    # Validar horario activo
    if horario.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede reservar en un horario inactivo"
        )
    
    # Validación tipo de reserva (powerplate vs calistenia)
    if horario.tipo == "powerplate":
        if not reserva_data.get("id_equipo"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las reservas de powerplate requieren un equipo"
            )
            
        # Validar que el equipo exista y esté activo
        equipo_existe = db.execute(
            "SELECT 1 FROM equipopowerplate WHERE id_equipo = :id_equipo AND estado = 'activo'",
            {"id_equipo": reserva_data["id_equipo"]}
        ).first()
        
        if not equipo_existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo especificado no existe o no está activo"
            )
            
        # Validar disponibilidad del equipo
        equipo_reservado = db.execute(
            """SELECT 1 FROM reserva r
            JOIN horario h ON r.id_horario = h.id_horario
            WHERE r.id_equipo = :id_equipo
            AND r.estado = 'confirmada'
            AND h.fecha = :fecha
            AND (
                (h.hora_inicio < :hora_fin AND h.hora_fin > :hora_inicio)
            )""",
            {
                "id_equipo": reserva_data["id_equipo"],
                "fecha": horario.fecha,
                "hora_inicio": horario.hora_inicio,
                "hora_fin": horario.hora_fin
            }
        ).first()
        
        if equipo_reservado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo ya está reservado en este horario"
            )
            
    elif horario.tipo == "calistenia":
        if reserva_data.get("id_equipo"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Las reservas de calistenia no deben incluir equipo"
            )
    
    # Validar capacidad del horario
    reservas_count = db.execute(
        "SELECT COUNT(*) FROM reserva WHERE id_horario = :id_horario AND estado = 'confirmada'",
        {"id_horario": reserva_data["id_horario"]}
    ).scalar()
    
    if reservas_count >= horario.capacidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario ha alcanzado su capacidad máxima"
        )
    
    # Validar que el usuario no tenga otra reserva en el mismo horario
    reserva_duplicada = db.execute(
        "SELECT 1 FROM reserva WHERE id_usuario = :id_usuario AND id_horario = :id_horario AND estado = 'confirmada'",
        {
            "id_usuario": reserva_data["id_usuario"],
            "id_horario": reserva_data["id_horario"]
        }
    ).first()
    
    if reserva_duplicada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes una reserva confirmada para este horario"
        )
    
    # Asignar la rutina del horario a la reserva
    reserva_data["id_rutina"] = horario.horario_id_rutina

def validar_disponibilidad_equipo(db: Session, id_equipo: int, id_horario: int):
    # Obtener información del horario que se quiere reservar
    horario_actual = db.execute(
        """SELECT fecha, hora_inicio, hora_fin 
        FROM horario 
        WHERE id_horario = :id_horario""",
        {"id_horario": id_horario}
    ).first()

    if not horario_actual:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El horario especificado no existe"
        )

    # Verificar si el equipo ya está reservado en horarios que se solapan
    reserva_existente = db.execute(
        """SELECT 1 FROM reserva r
        JOIN horario h ON r.id_horario = h.id_horario
        WHERE r.id_equipo = :id_equipo
        AND r.estado = 'confirmada'
        AND h.fecha = :fecha
        AND (
            (h.hora_inicio < :hora_fin AND h.hora_fin > :hora_inicio)
        )""",
        {
            "id_equipo": id_equipo,
            "fecha": horario_actual.fecha,
            "hora_inicio": horario_actual.hora_inicio,
            "hora_fin": horario_actual.hora_fin
        }
    ).first()

    if reserva_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El equipo ya está reservado en este horario"
        )

def create_reserva(db: Session, reserva: dict, user_roles: list):
    try:
        # Validaciones adicionales para clientes
        if "cliente" in user_roles:
            # Obtener categoría del cliente
            cliente_categoria = db.execute(
                "SELECT categoria FROM usuario WHERE id_usuario = :id_usuario",
                {"id_usuario": reserva["id_usuario"]}
            ).scalar()
            
            # Obtener tipo de horario
            horario_tipo = db.execute(
                "SELECT tipo FROM horario WHERE id_horario = :id_horario",
                {"id_horario": reserva["id_horario"]}
            ).scalar()
            
            # Validar coincidencia de categoría
            if cliente_categoria != horario_tipo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Tu categoría es {cliente_categoria} pero intentas reservar un horario de {horario_tipo}"
                )
            
            # Validar disponibilidad del equipo (solo para powerplate)
            if reserva.get("id_equipo"):
                validar_disponibilidad_equipo(db, reserva["id_equipo"], reserva["id_horario"])
        
        # Ejecutar todas las validaciones
        validar_reserva(db, reserva)
        
        # Crear la reserva
        db_reserva = Reserva(**reserva)
        db.add(db_reserva)
        db.commit()
        db.refresh(db_reserva)
        return db_reserva
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear reserva: {str(e)}"
        )

def parse_json_field(field_value):
    """Helper para parsear campos JSON de manera segura"""
    if isinstance(field_value, str):
        try:
            return json.loads(field_value)
        except:
            return []
    elif isinstance(field_value, list):
        return field_value
    else:
        return []
    
def get_rutina_nombre_from_ejercicios(ejercicios_json):
    """
    Convierte el JSON de ejercicios a un string legible para rutina_nombre
    """
    if not ejercicios_json:
        return "Sin rutina"
    
    if isinstance(ejercicios_json, list):
        if len(ejercicios_json) == 0:
            return "Sin rutina"
        elif len(ejercicios_json) == 1:
            return ejercicios_json[0]
        else:
            return f"{ejercicios_json[0]} + {len(ejercicios_json)-1} más"
    
    return str(ejercicios_json)


def get_reservas_detalladas(db: Session, usuario_id: Optional[int] = None):
    query = db.query(Reserva)\
        .options(
            joinedload(Reserva.usuario),
            joinedload(Reserva.horario).joinedload(Horario.entrenador),
            joinedload(Reserva.horario).joinedload(Horario.rutina),
            joinedload(Reserva.equipo)
        )\
        .order_by(Reserva.fecha_reserva.desc())

    if usuario_id:
        query = query.filter(Reserva.id_usuario == usuario_id)

    reservas = query.all()

    return [
        {
            "id_reserva": r.id_reserva,
            "estado": r.estado,
            "fecha_reserva": r.fecha_reserva,
            "comentarios": r.comentarios,
            "asistencia": r.asistencia,
            
            # Usuario
            "usuario_id": r.usuario.id_usuario,
            "usuario_nombre": r.usuario.nombre,
            "usuario_apellido_p": r.usuario.apellido_p,
            "usuario_apellido_m": r.usuario.apellido_m or "",
            "usuario_email": r.usuario.correo,
            
            # Horario
            "horario_id": r.horario.id_horario,
            "horario_nombre": r.horario.nombre_horario or "Clase sin nombre",
            "horario_fecha": r.horario.fecha,
            "horario_hora_inicio": r.horario.hora_inicio.strftime("%H:%M:%S"),
            "horario_hora_fin": r.horario.hora_fin.strftime("%H:%M:%S"),
            "horario_tipo": r.horario.tipo,
            "horario_nivel": r.horario.nivel,
            "horario_capacidad": r.horario.capacidad,
            "horario_descripcion": r.horario.descripcion,
            
            # Entrenador
            "entrenador_id": r.horario.entrenador.id_usuario,
            "entrenador_nombre": r.horario.entrenador.nombre,
            "entrenador_apellido_p": r.horario.entrenador.apellido_p,
            "entrenador_apellido_m": r.horario.entrenador.apellido_m or "",
            "entrenador_categoria": r.horario.entrenador.categoria or "",
            
            # Rutina - CORREGIDO
            "rutina_id": r.horario.rutina.id_rutina if r.horario.rutina else None,
            # ✅ CAMPO CALCULADO: Convertir nombre_ejercicio (JSON) a rutina_nombre (string)
            "rutina_nombre": get_rutina_nombre_from_ejercicios(
                r.horario.rutina.nombre_ejercicio if r.horario.rutina else None
            ),
            # ✅ CAMPOS JSON DIRECTOS
            "rutina_ejercicios": r.horario.rutina.nombre_ejercicio if r.horario.rutina else [],
            "rutina_partes_musculo": r.horario.rutina.partes_musculo if r.horario.rutina else [],
            "rutina_repeticiones": r.horario.rutina.repeticiones if r.horario.rutina else [],
            "rutina_series": r.horario.rutina.series if r.horario.rutina else [],
            
            # Equipo
            "equipo_id": r.equipo.id_equipo if r.equipo else None,
            "equipo_nombre": r.equipo.nombre_equipo if r.equipo else None,
            "equipo_descripcion": r.equipo.especificaciones_tecnicas if r.equipo else None,
        }
        for r in reservas
    ]

def get_reservas_con_detalles(db: Session, skip: int = 0, limit: int = 100) -> List[Reserva]:
    return (
        db.query(Reserva)
        .options(
            joinedload(Reserva.usuario),
            joinedload(Reserva.horario),
            joinedload(Reserva.equipo),
            joinedload(Reserva.rutina)
        )
        .order_by(Reserva.fecha_reserva.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def cancelar_reserva(db: Session, reserva_id: int, current_user_id: int, es_admin: bool):
    # Obtener reserva con todas las relaciones necesarias
    reserva = db.query(Reserva)\
        .options(
            joinedload(Reserva.horario),
            joinedload(Reserva.equipo)
        )\
        .filter(Reserva.id_reserva == reserva_id)\
        .first()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    # Validar permisos
    if not es_admin and reserva.id_usuario != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para cancelar esta reserva"
        )

    if reserva.estado == "cancelada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La reserva ya está cancelada"
        )

    # Liberar recursos
    resultado = {
        "horario_liberado": True,
        "equipo_liberado": False
    }

    # Si es powerplate, liberar el equipo
    if reserva.horario.tipo == "powerplate" and reserva.id_equipo:
        resultado["equipo_liberado"] = True

    # Actualizar estado de la reserva
    reserva.estado = "cancelada"
    
    db.commit()
    db.refresh(reserva)

    return {
        "reserva": reserva,
        **resultado
    }

def registrar_asistencia(
    db: Session,
    reserva_id: int,
    porcentaje: int,
    comentarios: Optional[str] = None,
    usuario_id: Optional[int] = None
):
    # Obtener la reserva con relaciones
    reserva = db.query(Reserva)\
        .options(
            joinedload(Reserva.horario),
            joinedload(Reserva.usuario)
        )\
        .filter(Reserva.id_reserva == reserva_id)\
        .first()

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada"
        )

    # Validar estado de la reserva
    if reserva.estado != 'confirmada':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede registrar asistencia a reservas confirmadas"
        )

    # Validar que el horario no sea futuro
    if reserva.horario.fecha > datetime.now().date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede registrar asistencia para horarios futuros"
        )

    # Actualizar datos
    reserva.asistencia = porcentaje
    reserva.comentarios = comentarios

    db.commit()
    db.refresh(reserva)
    
    return reserva

def obtener_rutinas_realizadas_usuario(db: Session, user_id: int, dias_atras: int = 7) -> List[Dict[str, Any]]:
    """
    Obtener rutinas que el usuario realmente realizó basándose en reservas confirmadas
    con asistencia registrada
    """
    desde = datetime.now() - timedelta(days=dias_atras)
    
    # Consultar reservas con asistencia registrada
    reservas_realizadas = db.execute("""
        SELECT 
            r.fecha_reserva,
            r.asistencia,
            h.nivel as horario_nivel,
            ru.partes_musculo,
            ru.nombre_ejercicio,
            ru.repeticiones,
            ru.series
        FROM reserva r
        JOIN horario h ON r.id_horario = h.id_horario
        LEFT JOIN rutina ru ON r.id_rutina = ru.id_rutina
        WHERE r.id_usuario = :user_id
        AND r.asistencia IS NOT NULL
        AND r.asistencia > 0
        AND r.fecha_reserva >= :desde
        AND r.estado = 'confirmada'
        ORDER BY r.fecha_reserva DESC
    """, {
        "user_id": user_id,
        "desde": desde
    }).fetchall()
    
    historial_rutinas = []
    for reserva in reservas_realizadas:
        # Calcular días desde el entrenamiento
        dias_desde = (datetime.now() - reserva.fecha_reserva).days
        
        # Generar nombre de rutina a partir de los ejercicios
        ejercicios_lista = parse_json_field(reserva.nombre_ejercicio) if reserva.nombre_ejercicio else []
        nombre_rutina = "Rutina sin nombre"
        if ejercicios_lista and len(ejercicios_lista) > 0:
            if len(ejercicios_lista) == 1:
                nombre_rutina = ejercicios_lista[0]
            else:
                nombre_rutina = f"{ejercicios_lista[0]} + {len(ejercicios_lista)-1} más"
        
        rutina_data = {
            'fecha': reserva.fecha_reserva,
            'dias_desde': dias_desde,
            'nivel': reserva.horario_nivel,
            'asistencia': reserva.asistencia,
            'grupos_musculares': parse_json_field(reserva.partes_musculo) if reserva.partes_musculo else [],
            'ejercicios': ejercicios_lista,
            'repeticiones': parse_json_field(reserva.repeticiones) if reserva.repeticiones else [],
            'series': parse_json_field(reserva.series) if reserva.series else [],
            'nombre_rutina': nombre_rutina  # Generado dinámicamente
        }
        historial_rutinas.append(rutina_data)
    
    return historial_rutinas

def analizar_grupos_musculares_recientes(historial: List[Dict[str, Any]], dias_limite: int = 2) -> Dict[str, int]:
    """
    Analizar qué grupos musculares trabajó recientemente el usuario
    Retorna: {grupo_muscular: dias_desde_ultimo_entrenamiento}
    """
    grupos_trabajados = {}
    
    for rutina in historial:
        if rutina['dias_desde'] <= dias_limite:
            for grupo in rutina['grupos_musculares']:
                if grupo not in grupos_trabajados or rutina['dias_desde'] < grupos_trabajados[grupo]:
                    grupos_trabajados[grupo] = rutina['dias_desde']
    
    return grupos_trabajados

def calcular_frecuencia_entrenamiento(historial: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcular estadísticas de frecuencia de entrenamiento del usuario
    """
    if not historial:
        return {
            'entrenamientos_por_semana': 0,
            'asistencia_promedio': 0,
            'nivel_mas_frecuente': 'intermedio',
            'grupos_mas_trabajados': []
        }
    
    # Calcular entrenamientos por semana (últimos 7 días)
    entrenamientos_semana = len([r for r in historial if r['dias_desde'] <= 7])
    
    # Asistencia promedio
    asistencia_promedio = sum(r['asistencia'] for r in historial) / len(historial)
    
    # Nivel más frecuente
    niveles = [r['nivel'] for r in historial]
    nivel_mas_frecuente = max(set(niveles), key=niveles.count) if niveles else 'intermedio'
    
    # Grupos musculares más trabajados
    todos_grupos = []
    for rutina in historial:
        todos_grupos.extend(rutina['grupos_musculares'])
    
    from collections import Counter
    grupos_counter = Counter(todos_grupos)
    grupos_mas_trabajados = [grupo for grupo, _ in grupos_counter.most_common(5)]
    
    return {
        'entrenamientos_por_semana': entrenamientos_semana,
        'asistencia_promedio': round(asistencia_promedio, 1),
        'nivel_mas_frecuente': nivel_mas_frecuente,
        'grupos_mas_trabajados': grupos_mas_trabajados,
        'total_entrenamientos': len(historial)
    }