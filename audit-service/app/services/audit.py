from sqlalchemy.orm import Session
from app.models import AuditLog
from app.schemas import AuditCreate


def registrar(datos: AuditCreate, db: Session) -> AuditLog:
    log = AuditLog(
        user_id=datos.user_id,
        accion=datos.accion,
        recurso_tipo=datos.recurso_tipo,
        recurso_id=datos.recurso_id,
        ip_origen=datos.ip_origen,
        navegador=datos.navegador,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def consultar(
    user_id: str | None,
    patient_id: str | None,
    page: int,
    limit: int,
    db: Session,
) -> list[AuditLog]:
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if patient_id:
        query = query.filter(AuditLog.recurso_id == patient_id)
    offset = (page - 1) * limit
    return query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
