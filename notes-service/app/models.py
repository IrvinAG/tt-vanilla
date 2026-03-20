import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, SmallInteger, Numeric, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class NotaMedica(Base):
    __tablename__ = "notas_medicas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    expediente_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    autor_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    tipo_nota: Mapped[str] = mapped_column(String(40), nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    somatometria: Mapped["Somatometria | None"] = relationship(back_populates="nota", uselist=False)
    antecedentes_familiares: Mapped[list["AntecedenteFamiliar"]] = relationship(back_populates="nota")
    antecedentes_no_patologicos: Mapped["AntecedenteNoPatologico | None"] = relationship(back_populates="nota", uselist=False)
    toxicomanias: Mapped[list["Toxicomania"]] = relationship(back_populates="nota")
    antecedentes_patologicos: Mapped[list["AntecedentePatologico"]] = relationship(back_populates="nota")
    padecimiento_actual: Mapped["PadecimientoActual | None"] = relationship(back_populates="nota", uselist=False)
    sintomas: Mapped[list["SintomaNota"]] = relationship(back_populates="nota")
    diagnosticos: Mapped[list["Diagnostico"]] = relationship(back_populates="nota")
    plan_terapeutico: Mapped["PlanTerapeutico | None"] = relationship(back_populates="nota", uselist=False)


class Somatometria(Base):
    __tablename__ = "somatometria"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), unique=True, nullable=False)
    peso_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    talla_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    tension_sistolica: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    tension_diastolica: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    frecuencia_cardiaca: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    temperatura_c: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="somatometria")


class AntecedenteFamiliar(Base):
    __tablename__ = "antecedentes_familiares"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), nullable=False)
    familiar: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(100), nullable=False)
    padecimiento: Mapped[str | None] = mapped_column(Text, nullable=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="antecedentes_familiares")


class AntecedenteNoPatologico(Base):
    __tablename__ = "antecedentes_no_patologicos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), unique=True, nullable=False)
    tipo_vivienda: Mapped[str | None] = mapped_column(String(50), nullable=True)
    servicios: Mapped[str | None] = mapped_column(String(100), nullable=True)
    num_habitaciones: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    num_convivientes: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    actividad_fisica: Mapped[str | None] = mapped_column(String(100), nullable=True)
    horas_sueno: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="antecedentes_no_patologicos")


class Toxicomania(Base):
    __tablename__ = "toxicomanias"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), nullable=False)
    sustancia: Mapped[str] = mapped_column(String(50), nullable=False)
    frecuencia: Mapped[str] = mapped_column(String(100), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="toxicomanias")


class AntecedentePatologico(Base):
    __tablename__ = "antecedentes_patologicos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_aproximada: Mapped[str | None] = mapped_column(String(50), nullable=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="antecedentes_patologicos")


class PadecimientoActual(Base):
    __tablename__ = "padecimiento_actual"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), unique=True, nullable=False)
    observaciones: Mapped[str] = mapped_column(Text, nullable=False)

    nota: Mapped["NotaMedica"] = relationship(back_populates="padecimiento_actual")


class SintomaNota(Base):
    __tablename__ = "sintomas_nota"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), nullable=False)
    sintoma: Mapped[str] = mapped_column(String(100), nullable=False)

    nota: Mapped["NotaMedica"] = relationship(back_populates="sintomas")


class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), nullable=False)
    sistema: Mapped[str] = mapped_column(String(20), nullable=False)
    cie10: Mapped[str] = mapped_column(String(10), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    es_principal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    nota: Mapped["NotaMedica"] = relationship(back_populates="diagnosticos")


class PlanTerapeutico(Base):
    __tablename__ = "plan_terapeutico"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nota_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notas_medicas.id"), unique=True, nullable=False)
    principio: Mapped[str] = mapped_column(Text, nullable=False)
    puntos_principales: Mapped[str] = mapped_column(Text, nullable=False)
    puntos_secundarios: Mapped[str | None] = mapped_column(Text, nullable=True)

    nota: Mapped["NotaMedica"] = relationship(back_populates="plan_terapeutico")
