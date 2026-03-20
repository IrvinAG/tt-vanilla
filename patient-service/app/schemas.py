import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class PacienteCreate(BaseModel):
    curp: str
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    fecha_nacimiento: date
    sexo: str
    domicilio: str | None = None
    telefono: str | None = None
    ocupacion: str | None = None
    establecimiento: str


class PacienteUpdate(BaseModel):
    curp: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    ocupacion: str | None = None


class ExpedienteResponse(BaseModel):
    id: uuid.UUID
    paciente_id: uuid.UUID
    fecha_apertura: date
    establecimiento: str
    medico_responsable_id: uuid.UUID
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class PacienteResponse(BaseModel):
    id: uuid.UUID
    curp: str
    nombre: str
    apellido_paterno: str
    apellido_materno: str
    fecha_nacimiento: date
    sexo: str
    domicilio: str | None = None
    telefono: str | None = None
    ocupacion: str | None = None
    creado_por: uuid.UUID
    created_at: datetime
    updated_at: datetime
    expediente: ExpedienteResponse | None = None

    model_config = ConfigDict(from_attributes=True)
