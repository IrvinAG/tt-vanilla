from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_auditor_or_admin
from app.schemas import AuditCreate, AuditResponse
from app.services import audit as audit_service

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.post("/log", response_model=AuditResponse, status_code=201, description="Registra una entrada de auditoría (llamada interna)")
def registrar(datos: AuditCreate, db: Session = Depends(get_db)):
    return audit_service.registrar(datos, db)


@router.get("", response_model=list[AuditResponse], description="Consulta el log de auditoría con filtros y paginación")
def consultar(
    user_id: str | None = Query(None),
    patient_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_auditor_or_admin),
    db: Session = Depends(get_db),
):
    return audit_service.consultar(user_id, patient_id, page, limit, db)
