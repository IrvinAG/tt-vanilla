import os
from fastapi import APIRouter, Depends, Header, Request, Response
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import ProfesionalSalud
from app.schemas import LoginRequest, TokenResponse, ProfesionalResponse
from app.services import auth as auth_service

SECRET_KEY = os.getenv("SECRET_KEY", "supersecreto")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse, description="Iniciar sesión con email y password")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(body.email, body.password, db)


@router.get("/me", response_model=ProfesionalResponse, description="Datos del profesional logueado")
def me(user: ProfesionalSalud = Depends(get_current_user)):
    return user


@router.post("/logout", description="Cerrar sesión (el cliente borra el token)")
def logout(user: ProfesionalSalud = Depends(get_current_user)):
    return {"message": "ok"}


@router.get("/validate-token", include_in_schema=False)
def validate_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Endpoint interno usado por nginx auth_request para validar JWT."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        response.status_code = 401
        return {"detail": "Token no proporcionado"}

    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user_rol = payload.get("rol")
        if not user_id or not user_rol:
            response.status_code = 401
            return {"detail": "Token inválido"}
    except JWTError:
        response.status_code = 401
        return {"detail": "Token inválido o expirado"}

    response.headers["X-User-Id"] = str(user_id)
    response.headers["X-User-Rol"] = str(user_rol)
    return {"status": "ok"}
