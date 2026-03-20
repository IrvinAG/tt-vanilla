import os
from fastapi import HTTPException, status
import httpx
from sqlalchemy.orm import Session, joinedload
from app.models import (
    NotaMedica, Somatometria, AntecedenteFamiliar, AntecedenteNoPatologico,
    Toxicomania, AntecedentePatologico, PadecimientoActual, SintomaNota,
    Diagnostico, PlanTerapeutico,
)
from app.schemas import NotaCreate

PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://patient-service:8002")
AUDIT_SERVICE_URL = os.getenv("AUDIT_SERVICE_URL", "http://audit-service:8004")


async def _notify_audit(user_id: str, accion: str, recurso_tipo: str, recurso_id: str | None = None):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{AUDIT_SERVICE_URL}/audit/log", json={
                "user_id": user_id,
                "accion": accion,
                "recurso_tipo": recurso_tipo,
                "recurso_id": recurso_id,
            }, timeout=5.0)
    except Exception:
        pass


async def _verificar_expediente(expediente_id: str):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{PATIENT_SERVICE_URL}/patients?expediente_id={expediente_id}", timeout=5.0)
            if resp.status_code == 404:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expediente no encontrado")
    except httpx.HTTPError:
        pass


async def crear(datos: NotaCreate, autor_id: str, db: Session) -> NotaMedica:
    await _verificar_expediente(str(datos.expediente_id))

    nota = NotaMedica(
        expediente_id=datos.expediente_id,
        autor_id=autor_id,
        tipo_nota=datos.tipo_nota,
    )
    db.add(nota)
    db.flush()

    if datos.somatometria:
        s = datos.somatometria
        db.add(Somatometria(
            nota_id=nota.id,
            peso_kg=s.peso_kg,
            talla_cm=s.talla_cm,
            tension_sistolica=s.tension_sistolica,
            tension_diastolica=s.tension_diastolica,
            frecuencia_cardiaca=s.frecuencia_cardiaca,
            temperatura_c=s.temperatura_c,
        ))

    for af in datos.antecedentes_familiares:
        db.add(AntecedenteFamiliar(
            nota_id=nota.id,
            familiar=af.familiar,
            estado=af.estado,
            padecimiento=af.padecimiento,
        ))

    if datos.antecedentes_no_patologicos:
        anp = datos.antecedentes_no_patologicos
        db.add(AntecedenteNoPatologico(
            nota_id=nota.id,
            tipo_vivienda=anp.tipo_vivienda,
            servicios=anp.servicios,
            num_habitaciones=anp.num_habitaciones,
            num_convivientes=anp.num_convivientes,
            actividad_fisica=anp.actividad_fisica,
            horas_sueno=anp.horas_sueno,
            observaciones=anp.observaciones,
        ))

    for t in datos.toxicomanias:
        db.add(Toxicomania(
            nota_id=nota.id,
            sustancia=t.sustancia,
            frecuencia=t.frecuencia,
        ))

    for ap in datos.antecedentes_patologicos:
        db.add(AntecedentePatologico(
            nota_id=nota.id,
            tipo=ap.tipo,
            descripcion=ap.descripcion,
            fecha_aproximada=ap.fecha_aproximada,
        ))

    if datos.padecimiento_actual:
        db.add(PadecimientoActual(
            nota_id=nota.id,
            observaciones=datos.padecimiento_actual.observaciones,
        ))

    for sintoma_str in datos.sintomas:
        db.add(SintomaNota(
            nota_id=nota.id,
            sintoma=sintoma_str,
        ))

    for dx in datos.diagnosticos:
        db.add(Diagnostico(
            nota_id=nota.id,
            sistema=dx.sistema,
            cie10=dx.cie10,
            descripcion=dx.descripcion,
            es_principal=dx.es_principal,
        ))

    if datos.plan_terapeutico:
        pt = datos.plan_terapeutico
        db.add(PlanTerapeutico(
            nota_id=nota.id,
            principio=pt.principio,
            puntos_principales=pt.puntos_principales,
            puntos_secundarios=pt.puntos_secundarios,
        ))

    db.commit()
    db.refresh(nota)

    await _notify_audit(autor_id, "crear_nota", "nota", str(nota.id))
    return nota


async def listar(expediente_id: str, db: Session) -> list[NotaMedica]:
    query = db.query(NotaMedica)
    if expediente_id:
        query = query.filter(NotaMedica.expediente_id == expediente_id)
    return query.order_by(NotaMedica.fecha_registro.desc()).all()


def _calcular_imc(somatometria) -> float | None:
    if somatometria and somatometria.peso_kg and somatometria.talla_cm:
        talla_m = float(somatometria.talla_cm) / 100
        if talla_m > 0:
            return round(float(somatometria.peso_kg) / (talla_m ** 2), 2)
    return None


async def obtener(id: str, db: Session) -> dict:
    nota = db.query(NotaMedica).options(
        joinedload(NotaMedica.somatometria),
        joinedload(NotaMedica.antecedentes_familiares),
        joinedload(NotaMedica.antecedentes_no_patologicos),
        joinedload(NotaMedica.toxicomanias),
        joinedload(NotaMedica.antecedentes_patologicos),
        joinedload(NotaMedica.padecimiento_actual),
        joinedload(NotaMedica.sintomas),
        joinedload(NotaMedica.diagnosticos),
        joinedload(NotaMedica.plan_terapeutico),
    ).filter(NotaMedica.id == id).first()

    if not nota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada")

    result = {
        "id": nota.id,
        "expediente_id": nota.expediente_id,
        "autor_id": nota.autor_id,
        "tipo_nota": nota.tipo_nota,
        "fecha_registro": nota.fecha_registro,
        "created_at": nota.created_at,
        "somatometria": None,
        "antecedentes_familiares": nota.antecedentes_familiares,
        "antecedentes_no_patologicos": nota.antecedentes_no_patologicos,
        "toxicomanias": nota.toxicomanias,
        "antecedentes_patologicos": nota.antecedentes_patologicos,
        "padecimiento_actual": nota.padecimiento_actual,
        "sintomas": nota.sintomas,
        "diagnosticos": nota.diagnosticos,
        "plan_terapeutico": nota.plan_terapeutico,
    }

    if nota.somatometria:
        imc = _calcular_imc(nota.somatometria)
        result["somatometria"] = {
            "id": nota.somatometria.id,
            "peso_kg": float(nota.somatometria.peso_kg) if nota.somatometria.peso_kg else None,
            "talla_cm": float(nota.somatometria.talla_cm) if nota.somatometria.talla_cm else None,
            "tension_sistolica": nota.somatometria.tension_sistolica,
            "tension_diastolica": nota.somatometria.tension_diastolica,
            "frecuencia_cardiaca": nota.somatometria.frecuencia_cardiaca,
            "temperatura_c": float(nota.somatometria.temperatura_c) if nota.somatometria.temperatura_c else None,
            "imc": imc,
        }

    return result
