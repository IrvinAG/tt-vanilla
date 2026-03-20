from datetime import datetime, timezone
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import ProfesionalSalud
from app.schemas import ProfesionalCreate, ProfesionalUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def listar(db: Session) -> list[ProfesionalSalud]:
    return db.query(ProfesionalSalud).order_by(ProfesionalSalud.created_at.desc()).all()


def crear(datos: ProfesionalCreate, db: Session) -> ProfesionalSalud:
    existing = db.query(ProfesionalSalud).filter(
        (ProfesionalSalud.email == datos.email) | (ProfesionalSalud.cedula_profesional == datos.cedula_profesional)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email o cédula ya registrados")

    profesional = ProfesionalSalud(
        cedula_profesional=datos.cedula_profesional,
        nombre_completo=datos.nombre_completo,
        tipo_personal=datos.tipo_personal,
        email=datos.email,
        password_hash=pwd_context.hash(datos.password),
        rol=datos.rol,
    )
    db.add(profesional)
    db.commit()
    db.refresh(profesional)
    return profesional


def obtener(id: str, db: Session) -> ProfesionalSalud:
    profesional = db.query(ProfesionalSalud).filter(ProfesionalSalud.id == id).first()
    if not profesional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profesional no encontrado")
    return profesional


def actualizar(id: str, datos: ProfesionalUpdate, db: Session) -> ProfesionalSalud:
    profesional = obtener(id, db)
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profesional, key, value)
    profesional.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profesional)
    return profesional


def desactivar(id: str, db: Session) -> ProfesionalSalud:
    profesional = obtener(id, db)
    profesional.activo = False
    profesional.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profesional)
    return profesional
