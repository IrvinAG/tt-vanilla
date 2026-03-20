import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditCreate(BaseModel):
    user_id: uuid.UUID
    accion: str
    recurso_tipo: str
    recurso_id: uuid.UUID | None = None
    ip_origen: str | None = None
    navegador: str | None = None


class AuditResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    accion: str
    recurso_tipo: str
    recurso_id: uuid.UUID | None = None
    ip_origen: str | None = None
    navegador: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
