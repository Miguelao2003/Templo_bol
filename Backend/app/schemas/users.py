from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from app.schemas.metricas_usuario import MetricaUsuarioInDB
from app.enums import UserRole, UserCategory

class UserBase(BaseModel):
    correo: EmailStr
    nombre: str = Field(..., min_length=1, max_length=50)
    apellido_p: str = Field(..., min_length=1, max_length=50)
    rol: Optional[UserRole] = Field(None, description="Solo para administradores")
    
class UserCreate(UserBase):
    contrasena: str = Field(..., min_length=8)
    apellido_m: Optional[str] = Field(None, max_length=50)
    peso: Optional[float] = Field(None, gt=0)
    altura: Optional[float] = Field(None, gt=0)
    edad: Optional[int] = Field(None, ge=15, le=100)
    genero: str = Field(..., regex="^(Masculino|Femenino)$")
    objetivo: str = Field(..., regex="^(aumento de peso|perdida de peso)$")
    nivel: Optional[str] = Field("principiante", regex="^(principiante|intermedio|avanzado)$")  # <-- NUEVO
    categoria: Optional[UserCategory] = None
    
    @validator('rol', 'categoria', pre=True)
    def convert_string_to_enum(cls, v, field):
        if v is None:
            return None
            
        if isinstance(v, str):
            v = v.lower().strip()
            try:
                enum_class = UserRole if field.name == 'rol' else UserCategory
                return enum_class(v)
            except ValueError:
                allowed_values = [e.value for e in (UserRole if field.name == 'rol' else UserCategory)]
                raise ValueError(
                    f"Valor inválido para {field.name}: '{v}'. "
                    f"Valores permitidos: {allowed_values}"
                )
        return v

    class Config:
        json_encoders = {
            UserRole: lambda v: v.value,
            UserCategory: lambda v: v.value
        }

class User(UserBase):
    id_usuario: int
    apellido_m: Optional[str]
    peso: Optional[float]
    altura: Optional[float]
    edad: Optional[int]
    genero: str
    objetivo: str
    nivel: str  # <-- NUEVO
    categoria: Optional[UserCategory]
    fecha_registro: datetime
    activo: bool

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UserRole: lambda v: v.value,
            UserCategory: lambda v: v.value
        }

class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=50)
    apellido_p: Optional[str] = Field(None, min_length=1, max_length=50)
    apellido_m: Optional[str] = Field(None, max_length=50)
    peso: Optional[float] = Field(None, gt=0)
    altura: Optional[float] = Field(None, gt=0)
    edad: Optional[int] = Field(None, ge=15, le=100)
    genero: Optional[str] = Field(None, regex="^(Masculino|Femenino)$")
    objetivo: Optional[str] = Field(None, regex="^(aumento de peso|perdida de peso)$")
    nivel: Optional[str] = Field(None, regex="^(principiante|intermedio|avanzado)$")  # <-- NUEVO
    categoria: Optional[UserCategory] = None
    activo: Optional[bool] = None

    @validator('categoria', pre=True)
    def validate_category(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return UserCategory(v.lower().strip())
            except ValueError:
                raise ValueError(
                    f"Categoría inválida. Valores permitidos: {[e.value for e in UserCategory]}"
                )
        return v

class UserWithMetrics(User):
    metricas: Optional[MetricaUsuarioInDB]

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    correo: Optional[str] = None

class UserLogin(BaseModel):
    correo: EmailStr
    contrasena: str

    class Config:
        schema_extra = {
            "example": {
                "correo": "usuario@ejemplo.com",
                "contrasena": "contraseñasegura"
            }
        }

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    message: str