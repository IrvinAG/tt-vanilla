import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ── Create schemas ──

class SomatometriaCreate(BaseModel):
    peso_kg: float | None = None
    talla_cm: float | None = None
    tension_sistolica: int | None = None
    tension_diastolica: int | None = None
    frecuencia_cardiaca: int | None = None
    temperatura_c: float | None = None


class AntFamiliarCreate(BaseModel):
    familiar: str
    estado: str
    padecimiento: str | None = None


class AntNoPatCreate(BaseModel):
    tipo_vivienda: str | None = None
    servicios: str | None = None
    num_habitaciones: int | None = None
    num_convivientes: int | None = None
    actividad_fisica: str | None = None
    horas_sueno: int | None = None
    observaciones: str | None = None


class ToxicoCreate(BaseModel):
    sustancia: str
    frecuencia: str


class AntPatCreate(BaseModel):
    tipo: str
    descripcion: str
    fecha_aproximada: str | None = None


class PadecimientoCreate(BaseModel):
    observaciones: str


class DiagnosticoCreate(BaseModel):
    sistema: str
    cie10: str
    descripcion: str
    es_principal: bool = False


class PlanCreate(BaseModel):
    principio: str
    puntos_principales: str
    puntos_secundarios: str | None = None


class NotaCreate(BaseModel):
    expediente_id: uuid.UUID
    tipo_nota: str
    somatometria: SomatometriaCreate | None = None
    antecedentes_familiares: list[AntFamiliarCreate] = []
    antecedentes_no_patologicos: AntNoPatCreate | None = None
    toxicomanias: list[ToxicoCreate] = []
    antecedentes_patologicos: list[AntPatCreate] = []
    padecimiento_actual: PadecimientoCreate | None = None
    sintomas: list[str] = []
    diagnosticos: list[DiagnosticoCreate] = []
    plan_terapeutico: PlanCreate | None = None


# ── Response schemas ──

class SomatometriaResponse(BaseModel):
    id: uuid.UUID
    peso_kg: float | None = None
    talla_cm: float | None = None
    tension_sistolica: int | None = None
    tension_diastolica: int | None = None
    frecuencia_cardiaca: int | None = None
    temperatura_c: float | None = None
    imc: float | None = None

    model_config = ConfigDict(from_attributes=True)


class AntFamiliarResponse(BaseModel):
    id: uuid.UUID
    familiar: str
    estado: str
    padecimiento: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AntNoPatResponse(BaseModel):
    id: uuid.UUID
    tipo_vivienda: str | None = None
    servicios: str | None = None
    num_habitaciones: int | None = None
    num_convivientes: int | None = None
    actividad_fisica: str | None = None
    horas_sueno: int | None = None
    observaciones: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ToxicoResponse(BaseModel):
    id: uuid.UUID
    sustancia: str
    frecuencia: str
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class AntPatResponse(BaseModel):
    id: uuid.UUID
    tipo: str
    descripcion: str
    fecha_aproximada: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PadecimientoResponse(BaseModel):
    id: uuid.UUID
    observaciones: str

    model_config = ConfigDict(from_attributes=True)


class SintomaResponse(BaseModel):
    id: uuid.UUID
    sintoma: str

    model_config = ConfigDict(from_attributes=True)


class DiagnosticoResponse(BaseModel):
    id: uuid.UUID
    sistema: str
    cie10: str
    descripcion: str
    es_principal: bool

    model_config = ConfigDict(from_attributes=True)


class PlanResponse(BaseModel):
    id: uuid.UUID
    principio: str
    puntos_principales: str
    puntos_secundarios: str | None = None

    model_config = ConfigDict(from_attributes=True)


class NotaListResponse(BaseModel):
    id: uuid.UUID
    expediente_id: uuid.UUID
    autor_id: uuid.UUID
    tipo_nota: str
    fecha_registro: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotaDetailResponse(BaseModel):
    id: uuid.UUID
    expediente_id: uuid.UUID
    autor_id: uuid.UUID
    tipo_nota: str
    fecha_registro: datetime
    created_at: datetime
    somatometria: SomatometriaResponse | None = None
    antecedentes_familiares: list[AntFamiliarResponse] = []
    antecedentes_no_patologicos: AntNoPatResponse | None = None
    toxicomanias: list[ToxicoResponse] = []
    antecedentes_patologicos: list[AntPatResponse] = []
    padecimiento_actual: PadecimientoResponse | None = None
    sintomas: list[SintomaResponse] = []
    diagnosticos: list[DiagnosticoResponse] = []
    plan_terapeutico: PlanResponse | None = None

    model_config = ConfigDict(from_attributes=True)
