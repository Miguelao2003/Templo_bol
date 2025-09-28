from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.schemas.users import User
from app.database import get_db
from app.models.users import Usuario
from app.crud.users import get_user_by_email
from app.models.users import UserRole

# Configuración
SECRET_KEY = "tu_clave_secreta_super_segura"  # Cambia esto en producción!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 2

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        correo: str = payload.get("sub")
        rol_str: str = payload.get("rol")  # Obtiene el string del rol
        if correo is None or rol_str is None:
            raise credentials_exception
        
        # Convierte el string del token al enum UserRole
        rol = UserRole(rol_str)  # ← Esto asegura que sea un enum válido
    except (JWTError, ValueError) as e:  # ValueError captura roles inválidos
        raise credentials_exception
    
    user = get_user_by_email(db, email=correo)
    if user is None:
        raise credentials_exception
    
    user.rol = rol  # Ahora rol es del tipo UserRole, no string
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user