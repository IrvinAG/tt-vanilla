from fastapi import Depends, Header, HTTPException, status


def get_current_user(
    x_user_id: str = Header(..., alias="X-User-Id"),
    x_user_rol: str = Header(..., alias="X-User-Rol"),
) -> dict:
    return {"id": x_user_id, "rol": x_user_rol}


def require_auditor_or_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["rol"] not in ("admin", "auditor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin o auditor")
    return user
