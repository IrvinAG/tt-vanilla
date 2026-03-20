from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_medico
from app.schemas import NotaCreate, NotaListResponse, NotaDetailResponse
from app.services import notes as notes_service

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("", response_model=NotaListResponse, status_code=201, description="Crea una nota médica completa con todas sus subtablas")
async def crear(datos: NotaCreate, user: dict = Depends(require_medico), db: Session = Depends(get_db)):
    return await notes_service.crear(datos, user["id"], db)


@router.get("", response_model=list[NotaListResponse], description="Lista notas por expediente")
async def listar(expediente_id: str = Query(...), user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return await notes_service.listar(expediente_id, db)


@router.get("/{id}", response_model=NotaDetailResponse, description="Nota completa con todos sus sub-objetos")
async def obtener(id: str, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return await notes_service.obtener(id, db)
