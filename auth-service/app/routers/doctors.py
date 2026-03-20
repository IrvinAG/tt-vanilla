from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_admin
from app.models import ProfesionalSalud
from app.schemas import ProfesionalCreate, ProfesionalUpdate, ProfesionalResponse
from app.services import doctors as doctors_service

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", response_model=list[ProfesionalResponse], description="Lista todos los profesionales de salud")
def listar(user: ProfesionalSalud = Depends(require_admin), db: Session = Depends(get_db)):
    return doctors_service.listar(db)


@router.post("", response_model=ProfesionalResponse, status_code=201, description="Registra un nuevo profesional")
def crear(datos: ProfesionalCreate, user: ProfesionalSalud = Depends(require_admin), db: Session = Depends(get_db)):
    return doctors_service.crear(datos, db)


@router.get("/{id}", response_model=ProfesionalResponse, description="Detalle de un profesional")
def obtener(id: str, user: ProfesionalSalud = Depends(require_admin), db: Session = Depends(get_db)):
    return doctors_service.obtener(id, db)


@router.put("/{id}", response_model=ProfesionalResponse, description="Actualiza datos de un profesional")
def actualizar(id: str, datos: ProfesionalUpdate, user: ProfesionalSalud = Depends(require_admin), db: Session = Depends(get_db)):
    return doctors_service.actualizar(id, datos, db)


@router.delete("/{id}", response_model=ProfesionalResponse, description="Desactiva un profesional (nunca borra)")
def desactivar(id: str, user: ProfesionalSalud = Depends(require_admin), db: Session = Depends(get_db)):
    return doctors_service.desactivar(id, db)
