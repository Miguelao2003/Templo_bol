from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.responses import JSONResponse
from fastapi import Response, Request
from fastapi.security import HTTPBearer


from app.crud.metricas_usuario import create_or_update_metrica_usuario
from app.database import get_db
from app.schemas.users import Token, User, UserCreate, UserLogin, UserLoginResponse, UserWithMetrics
from app.crud.users import authenticate_user, create_user, get_user_by_email
from app.utils.security import (
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user
)
from sqlalchemy.orm import joinedload
from app.models.users import Usuario

token_scheme = HTTPBearer()
router = APIRouter(tags=["auth"])

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Endpoint tradicional para OAuth2 compatible con frontends que usen el flujo estándar.
    Devuelve solo el token de acceso.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.correo,
            "rol": user.rol.value,
            "user_id": user.id_usuario
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=UserLoginResponse)
async def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db),
    request: Request = None
):
    user = authenticate_user(db, user_data.correo, user_data.contrasena)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada. Contacta al administrador.",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.correo,
            "rol": user.rol.value,
            "user_id": user.id_usuario
        },
        expires_delta=access_token_expires
    )
    
    # Mensaje de login exitoso
    login_message = f"Inicio de sesión exitoso: {user.nombre} ({user.correo})"
    print(login_message)  # Para ver en consola del servidor
    
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id_usuario": user.id_usuario,
            "nombre": user.nombre,
            "apellido_p": user.apellido_p,
            "apellido_m": user.apellido_m,
            "correo": user.correo,
            "rol": user.rol.value,
            "categoria": user.categoria.value if user.categoria else None
        },
        "message": login_message
    }
    
    return JSONResponse(content=response_data, status_code=status.HTTP_200_OK)

@router.post("/logout")
async def logout_user(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    token: str = Depends(token_scheme)
):
    # Mensaje de logout
    logout_message = f"Cierre de sesión: {current_user.nombre} ({current_user.correo})"
    print(logout_message)  # Para ver en consola del servidor
    
    # Aquí podrías invalidar el token si quisieras (depende de tu implementación JWT)
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": logout_message}
    )

@router.get("/me", response_model=UserWithMetrics)
async def read_users_me(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    user = (
        db.query(Usuario)
        .options(joinedload(Usuario.metricas))
        .filter(Usuario.id_usuario == current_user.id_usuario)
        .first()
    )
    return user




@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register_public_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registro público - siempre asigna rol 'cliente'
    """

    # Verificar si el correo ya existe
    if get_user_by_email(db, email=user.correo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado"
        )
    
    # Forzar rol cliente
    user_data = user.dict()
    user_data['rol'] = "cliente"
    
    created_user = create_user(db=db, user=UserCreate(**user_data))
    
    # Crear métricas si hay datos suficientes
    try:
        if created_user.peso and created_user.altura and created_user.edad and created_user.genero:
            create_or_update_metrica_usuario(db=db, id_usuario=created_user.id_usuario)
    except Exception as e:
        # Opcional: loggear error pero no bloquear registro
        print(f"Error al crear métricas para usuario público: {e}")

    return created_user
