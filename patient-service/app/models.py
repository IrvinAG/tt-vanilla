import uuid
from datetime import datetime, date
from sqlalchemy import String, Boolean, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    curp: Mapped[str] = mapped_column(String(18), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_materno: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=False)
    sexo: Mapped[str] = mapped_column(String(20), nullable=False)
    domicilio: Mapped[str | None] = mapped_column(Text, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ocupacion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    creado_por: Mapped[uuid.UUID] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    expediente: Mapped["ExpedienteClinico"] = relationship(back_populates="paciente", uselist=False)


class ExpedienteClinico(Base):
    __tablename__ = "expedientes_clinicos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    paciente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pacientes.id"), unique=True, nullable=False)
    fecha_apertura: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    establecimiento: Mapped[str] = mapped_column(String(200), nullable=False)
    medico_responsable_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    paciente: Mapped["Paciente"] = relationship(back_populates="expediente")
