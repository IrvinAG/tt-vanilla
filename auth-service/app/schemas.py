import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfesionalCreate(BaseModel):
    cedula_profesional: str
    nombre_completo: str
    tipo_personal: str
    email: EmailStr
    password: str
    rol: str = "medico"


class ProfesionalUpdate(BaseModel):
    nombre_completo: str | None = None
    tipo_personal: str | None = None
    rol: str | None = None
    activo: bool | None = None


class ProfesionalResponse(BaseModel):
    id: uuid.UUID
    cedula_profesional: str
    nombre_completo: str
    tipo_personal: str
    email: str
    rol: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
