import os
import time
import uuid
from datetime import datetime, timezone

from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

AUTH_DB_URL = os.getenv("AUTH_DB_URL", "postgresql://auth_user:auth_pass@auth-db:5432/auth_db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS = [
    {
        "cedula_profesional": "ADMIN001",
        "nombre_completo": "Administrador del Sistema",
        "tipo_personal": "Administrador",
        "email": "admin@clinica.com",
        "password": "CambiarEsto2024!",
        "rol": "admin",
    },
    {
        "cedula_profesional": "AUDIT001",
        "nombre_completo": "Auditor del Sistema",
        "tipo_personal": "Auditor",
        "email": "auditor@clinica.com",
        "password": "Auditor2024!",
        "rol": "auditor",
    },
    {
        "cedula_profesional": "5941640",
        "nombre_completo": "Juan Antonio Vargas Vera",
        "tipo_personal": "Médico Tratante",
        "email": "jvargas@clinica.com",
        "password": "Medico2024!",
        "rol": "medico",
    },
]


def wait_for_table(engine, retries=30, delay=2):
    for i in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1 FROM profesionales_salud LIMIT 0"))
            return True
        except Exception:
            print(f"  Esperando que auth-service cree las tablas... ({i + 1}/{retries})")
            time.sleep(delay)
    raise RuntimeError("No se pudo conectar a la base de datos o la tabla no existe")


def main():
    print("\n=== Seed de datos iniciales ===\n")

    engine = create_engine(AUTH_DB_URL)
    wait_for_table(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        for user_data in USERS:
            existing = session.execute(
                text("SELECT id FROM profesionales_salud WHERE email = :email"),
                {"email": user_data["email"]},
            ).fetchone()

            if existing:
                print(f"  Ya existe: {user_data['email']}")
                continue

            now = datetime.now(timezone.utc)
            session.execute(
                text("""
                    INSERT INTO profesionales_salud
                    (id, cedula_profesional, nombre_completo, tipo_personal, email, password_hash, rol, activo, created_at, updated_at)
                    VALUES (:id, :cedula, :nombre, :tipo, :email, :hash, :rol, TRUE, :now, :now)
                """),
                {
                    "id": str(uuid.uuid4()),
                    "cedula": user_data["cedula_profesional"],
                    "nombre": user_data["nombre_completo"],
                    "tipo": user_data["tipo_personal"],
                    "email": user_data["email"],
                    "hash": pwd_context.hash(user_data["password"]),
                    "rol": user_data["rol"],
                    "now": now,
                },
            )
            session.commit()
            print(f"  Creado: {user_data['email']} / {user_data['password']}")

        print("\n=== Seed completado ===\n")
    except Exception as e:
        session.rollback()
        print(f"  Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
