import os
from datetime import datetime, timezone
from fastapi import HTTPException, status
import httpx
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.models import Paciente, ExpedienteClinico
from app.schemas import PacienteCreate, PacienteUpdate

AUDIT_SERVICE_URL = os.getenv("AUDIT_SERVICE_URL", "http://audit-service:8004")


async def _notify_audit(user_id: str, accion: str, recurso_tipo: str, recurso_id: str | None = None):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{AUDIT_SERVICE_URL}/audit/log", json={
                "user_id": user_id,
                "accion": accion,
                "recurso_tipo": recurso_tipo,
                "recurso_id": recurso_id,
            }, timeout=5.0)
    except Exception:
        pass


async def crear(datos: PacienteCreate, creado_por: str, db: Session) -> Paciente:
    existing = db.query(Paciente).filter(Paciente.curp == datos.curp).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CURP ya registrado")

    paciente = Paciente(
        curp=datos.curp,
        nombre=datos.nombre,
        apellido_paterno=datos.apellido_paterno,
        apellido_materno=datos.apellido_materno,
        fecha_nacimiento=datos.fecha_nacimiento,
        sexo=datos.sexo,
        domicilio=datos.domicilio,
        telefono=datos.telefono,
        ocupacion=datos.ocupacion,
        creado_por=creado_por,
    )
    db.add(paciente)
    db.flush()

    expediente = ExpedienteClinico(
        paciente_id=paciente.id,
        establecimiento=datos.establecimiento,
        medico_responsable_id=creado_por,
    )
    db.add(expediente)
    db.commit()
    db.refresh(paciente)

    await _notify_audit(creado_por, "crear_paciente", "paciente", str(paciente.id))
    return paciente


async def buscar(search: str | None, db: Session) -> list[Paciente]:
    query = db.query(Paciente).options(joinedload(Paciente.expediente))
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Paciente.nombre.ilike(pattern),
                Paciente.apellido_paterno.ilike(pattern),
                Paciente.curp.ilike(pattern),
            )
        )
    return query.order_by(Paciente.created_at.desc()).limit(20).all()


async def obtener(id: str, db: Session) -> Paciente:
    paciente = db.query(Paciente).options(joinedload(Paciente.expediente)).filter(Paciente.id == id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
    return paciente


async def actualizar(id: str, datos: PacienteUpdate, creado_por: str, db: Session) -> Paciente:
    paciente = await obtener(id, db)
    update_data = datos.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(paciente, key, value)
    paciente.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(paciente)

    await _notify_audit(creado_por, "actualizar_paciente", "paciente", str(paciente.id))
    return paciente
