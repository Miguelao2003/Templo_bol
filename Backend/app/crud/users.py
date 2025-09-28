from sqlalchemy.orm import Session
from app.schemas.metricas_usuario import MetricaUsuarioCreate
from app.models.users import Usuario
from app.schemas.users import UserCreate, UserUpdate
from app.enums import UserCategory, UserRole
from passlib.context import CryptContext
from typing import Optional, List
from datetime import datetime
from sqlalchemy import or_, and_
from app.crud.metricas_usuario import create_metrica_usuario

def get_user_with_metrics(db: Session, user_id: int):
    return db.query(Usuario).filter(Usuario.id == user_id).first()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: int):
    return db.query(Usuario).filter(Usuario.id_usuario == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.correo == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Usuario).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    rol = user.rol.value if user.rol else "cliente"
    hashed_password = pwd_context.hash(user.contrasena)
    
    categoria_value = None
    if user.categoria:
        if isinstance(user.categoria, str):
            try:
                categoria_value = UserCategory(user.categoria.lower()).value
            except ValueError:
                pass
        elif isinstance(user.categoria, UserCategory):
            categoria_value = user.categoria.value
    
    db_user = Usuario(
        rol=rol,
        nombre=user.nombre,
        apellido_p=user.apellido_p,
        apellido_m=user.apellido_m,
        correo=user.correo,
        contrasena=hashed_password,
        peso=user.peso,
        altura=user.altura,
        edad=user.edad,
        categoria=categoria_value,
        genero=user.genero,
        objetivo=user.objetivo,
        nivel=user.nivel or "principiante",  # <-- NUEVO
        activo=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    if all([user.peso, user.altura, user.edad]):
        try:
            metrica_create = MetricaUsuarioCreate(id_usuario=db_user.id_usuario)
            create_metrica_usuario(
                db=db,
                metrica=metrica_create,
                peso=user.peso,
                altura=user.altura,
                edad=user.edad
            )
            db.refresh(db_user)
        except Exception as e:
            db.rollback()
            raise ValueError(f"Error al crear métricas: {str(e)}")
    
    return db_user

def search_users(
    db: Session,
    q: Optional[str] = None,
    rol: Optional[str] = None,
    nombre: Optional[str] = None,
    apellido_p: Optional[str] = None,
    apellido_m: Optional[str] = None,
    correo: Optional[str] = None,
    categoria: Optional[str] = None,
    edad: Optional[int] = None,
    edad_min: Optional[int] = None,
    edad_max: Optional[int] = None,
    peso_min: Optional[float] = None,
    peso_max: Optional[float] = None,
    altura_min: Optional[float] = None,
    altura_max: Optional[float] = None,
    fecha_registro_inicio: Optional[datetime] = None,
    fecha_registro_fin: Optional[datetime] = None,
    activo: Optional[bool] = None,
    genero: Optional[str] = None,
    objetivo: Optional[str] = None,
    nivel: Optional[str] = None,  # <-- NUEVO PARÁMETRO
    skip: int = 0,
    limit: int = 100
) -> List[Usuario]:
    query = db.query(Usuario)
    
    if q:
        search_term = f"%{q}%"
        query = query.filter(
            or_(
                Usuario.nombre.ilike(search_term),
                Usuario.apellido_p.ilike(search_term),
                Usuario.apellido_m.ilike(search_term),
                Usuario.correo.ilike(search_term),
                Usuario.rol.ilike(search_term),
                Usuario.categoria.ilike(search_term),
                Usuario.nivel.ilike(search_term)  # <-- AGREGADO A BÚSQUEDA
            )
        )
    
    if not q:
        text_filters = {
            "nombre": nombre,
            "apellido_p": apellido_p,
            "apellido_m": apellido_m,
            "correo": correo
        }
        
        for field, value in text_filters.items():
            if value:
                query = query.filter(getattr(Usuario, field).ilike(f"%{value}%"))
    
    if rol:
        query = query.filter(Usuario.rol == rol)
    if categoria:
        query = query.filter(Usuario.categoria == categoria)
    if activo is not None:
        query = query.filter(Usuario.activo == activo)
    if edad:
        query = query.filter(Usuario.edad == edad)
    if edad_min is not None:
        query = query.filter(Usuario.edad >= edad_min)
    if edad_max is not None:
        query = query.filter(Usuario.edad <= edad_max)
    if peso_min is not None:
        query = query.filter(Usuario.peso >= peso_min)
    if peso_max is not None:
        query = query.filter(Usuario.peso <= peso_max)
    if altura_min is not None:
        query = query.filter(Usuario.altura >= altura_min)
    if altura_max is not None:
        query = query.filter(Usuario.altura <= altura_max)
    if fecha_registro_inicio:
        query = query.filter(Usuario.fecha_registro >= fecha_registro_inicio)
    if fecha_registro_fin:
        query = query.filter(Usuario.fecha_registro <= fecha_registro_fin)

    # Filtros existentes
    if genero:
        query = query.filter(Usuario.genero == genero)
    if objetivo:
        query = query.filter(Usuario.objetivo == objetivo)
    
    # NUEVO FILTRO para nivel
    if nivel:
        query = query.filter(Usuario.nivel == nivel)
    
    return query.offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update: UserUpdate): 
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_update.dict(exclude_unset=True)
    
    metric_fields = {'peso', 'altura', 'edad', 'genero'}
    needs_metric_update = any(field in update_data for field in metric_fields)
    
    for key, value in update_data.items():
        if key == "categoria" and value is not None:
            setattr(db_user, key, value.value if hasattr(value, "value") else value)
        elif key == "rol" and value is not None:
            setattr(db_user, key, value.value if hasattr(value, "value") else value)
        else:
            setattr(db_user, key, value)

    db.commit()
    
    if needs_metric_update and all([db_user.peso, db_user.altura, db_user.edad, db_user.genero]):
        from app.crud.metricas_usuario import update_metrica_usuario
        try:
            update_metrica_usuario(
                db=db,
                id_usuario=user_id,
                genero=db_user.genero,
                peso=db_user.peso,
                altura=db_user.altura,
                edad=db_user.edad
            )
            db.refresh(db_user)
        except Exception as e:
            db.rollback()
            raise ValueError(f"Error al actualizar métricas: {str(e)}")
    
    return db_user

def deactivate_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    if not db_user.activo:
        return db_user
    
    db_user.activo = False
    db.commit()
    db.refresh(db_user)
    return db_user

def activate_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    if db_user.activo:
        return db_user
    
    db_user.activo = True
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, correo: str, password: str):
    user = get_user_by_email(db, correo)
    if not user:
        return False
    if not pwd_context.verify(password, user.contrasena):
        return False
    return user