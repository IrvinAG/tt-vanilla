from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_medico
from app.schemas import PacienteCreate, PacienteUpdate, PacienteResponse
from app.services import patients as patients_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PacienteResponse, status_code=201, description="Alta de paciente + expediente clínico")
async def crear(datos: PacienteCreate, user: dict = Depends(require_medico), db: Session = Depends(get_db)):
    return await patients_service.crear(datos, user["id"], db)


@router.get("", response_model=list[PacienteResponse], description="Buscar pacientes por nombre o CURP")
async def listar(search: str | None = Query(None), user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return await patients_service.buscar(search, db)


@router.get("/{id}", response_model=PacienteResponse, description="Perfil completo de un paciente con expediente")
async def obtener(id: str, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return await patients_service.obtener(id, db)


@router.put("/{id}", response_model=PacienteResponse, description="Actualizar datos de un paciente")
async def actualizar(id: str, datos: PacienteUpdate, user: dict = Depends(require_medico), db: Session = Depends(get_db)):
    return await patients_service.actualizar(id, datos, user["id"], db)
