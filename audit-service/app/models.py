import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    accion: Mapped[str] = mapped_column(String(50), nullable=False)
    recurso_tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    recurso_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    ip_origen: Mapped[str | None] = mapped_column(String(45), nullable=True)
    navegador: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
