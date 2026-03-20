# Sistema Médico — Clínica de Acupuntura
## Documento maestro para Claude Opus

> Lee este documento completo antes de escribir cualquier línea de código.
> Contiene todo el contexto, el esquema de base de datos, la arquitectura
> y las instrucciones de implementación fase por fase.
> Responde con un resumen de lo que vas a construir y espera confirmación
> antes de escribir código.

---

## 1. Contexto del negocio

Sistema médico para una **clínica de acupuntura** que trabaja con dos sistemas
de diagnóstico simultáneamente:

- **Medicina occidental** — diagnósticos CIE-10 estándar
- **MTCH** (Medicina Tradicional China) — diagnósticos con su propio CIE-10

### Roles del sistema

| Rol | Qué puede hacer |
|---|---|
| `medico` | Dar de alta pacientes, escribir notas médicas, consultar expedientes |
| `admin` | Agregar y desactivar médicos, consultar auditoría. No escribe notas ni da de alta pacientes |
| `auditor` | Solo lectura. Consulta el audit_log completo. No puede crear ni modificar nada |

**Tabla de permisos por rol:**

| Acción | medico | admin | auditor |
|---|---|---|---|
| Dar de alta pacientes | ✓ | ✗ | ✗ |
| Escribir notas médicas | ✓ | ✗ | ✗ |
| Consultar expedientes y notas | ✓ | ✓ | ✗ |
| Gestionar médicos (CRUD) | ✗ | ✓ | ✗ |
| Ver audit_log | ✗ | ✓ | ✓ |

### Reglas de negocio críticas

1. **Nada se borra jamás.** Los médicos se desactivan con `activo = False`.
2. **Las notas médicas son inmutables** — no hay PUT ni DELETE en /notes.
3. **`curp` y `apellido_materno` son obligatorios** al crear un paciente.
4. Al crear un paciente se crea su expediente clínico automáticamente en la misma transacción.
5. El IMC no se guarda en base de datos — se calcula en Python al devolver la nota.
6. Cada inserción de nota médica debe ser una transacción que incluya todas las subtablas. Si algo falla, PostgreSQL hace rollback completo.

---

## 2. Stack tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| Lenguaje | Python | 3.12 |
| Framework API | FastAPI | 0.111.0 |
| ORM | SQLAlchemy | 2.0.30 |
| Migraciones | Alembic | 1.13.1 |
| Base de datos | PostgreSQL | 16 |
| Gateway | nginx | latest |
| Contenedores | Docker + Docker Compose | latest |
| Autenticación | python-jose[cryptography] + passlib[bcrypt] | latest |
| HTTP interno | httpx | 0.27.0 |
| Validación | pydantic[email] | 2.7.1 |

---

## 3. Arquitectura

```
Internet
    │
    ▼
 nginx :80
    │  Valida JWT en todos los endpoints excepto POST /auth/login
    │  Inyecta X-User-Id y X-User-Rol en el request interno
    │
    ├── /auth/*      /doctors/*  →  auth-service:8001
    ├── /patients/*              →  patient-service:8002
    ├── /notes/*                 →  notes-service:8003
    └── /audit/*                 →  audit-service:8004
```

### Comunicación interna entre servicios

- **notes-service → patient-service**: antes de crear una nota, verifica que
  el expediente existe llamando internamente a patient-service.
- **Todos los servicios → audit-service**: cada acción relevante notifica
  al audit-service para registrarla.

### Cómo fluye la autenticación

1. Cliente hace `POST /auth/login` con email y password.
2. auth-service valida, devuelve JWT con payload `{ sub, rol, nombre }`.
3. En cada request siguiente el cliente manda `Authorization: Bearer <token>`.
4. **nginx** valida el JWT. Si es válido inyecta `X-User-Id` y `X-User-Rol`.
5. Los servicios (patient, notes, audit) **NO validan JWT**. Solo leen esos headers.
6. auth-service sí valida JWT directamente para sus propios endpoints.

---

## 4. Estructura de carpetas

```
clinica-acupuntura/
│
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
├── seed.py
│
├── nginx/
│   └── nginx.conf
│
├── auth-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   └── doctors.py
│   │   └── services/
│   │       ├── auth.py
│   │       └── doctors.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── patient-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   └── patients.py
│   │   └── services/
│   │       └── patients.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── notes-service/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   └── notes.py
│   │   └── services/
│   │       └── notes.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
└── audit-service/
    ├── app/
    │   ├── main.py
    │   ├── database.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── dependencies.py
    │   ├── routers/
    │   │   └── audit.py
    │   └── services/
    │       └── audit.py
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    ├── alembic.ini
    ├── requirements.txt
    └── Dockerfile
```

---

## 5. Esquema de base de datos

### AUTH DB

```sql
profesionales_salud
─────────────────────────────────────────────────────
id                  UUID        PK DEFAULT gen_random_uuid()
cedula_profesional  VARCHAR(20) NOT NULL UNIQUE
nombre_completo     VARCHAR(200) NOT NULL
tipo_personal       VARCHAR(60)  NOT NULL
  -- 'Médico Tratante' | 'Médico Especialista' | 'Administrador'
email               VARCHAR(200) NOT NULL UNIQUE
password_hash       VARCHAR(255) NOT NULL
rol                 VARCHAR(20)  NOT NULL DEFAULT 'medico'
  -- 'medico' | 'admin' | 'auditor'
activo              BOOLEAN      NOT NULL DEFAULT TRUE
created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
```

---

### PATIENT DB

```sql
pacientes
─────────────────────────────────────────────────────
id               UUID         PK DEFAULT gen_random_uuid()
curp             VARCHAR(18)  NOT NULL UNIQUE    ← OBLIGATORIO
nombre           VARCHAR(100) NOT NULL
apellido_paterno VARCHAR(100) NOT NULL
apellido_materno VARCHAR(100) NOT NULL           ← OBLIGATORIO
fecha_nacimiento DATE         NOT NULL
sexo             VARCHAR(20)  NOT NULL
  -- 'masculino' | 'femenino' | 'otro'
domicilio        TEXT
telefono         VARCHAR(20)
ocupacion        VARCHAR(200)
creado_por       UUID         NOT NULL           ← FK lógica → profesionales_salud.id
created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()

expedientes_clinicos
─────────────────────────────────────────────────────
id                    UUID         PK DEFAULT gen_random_uuid()
paciente_id           UUID         NOT NULL UNIQUE REFERENCES pacientes(id)
fecha_apertura        DATE         NOT NULL DEFAULT CURRENT_DATE
establecimiento       VARCHAR(200) NOT NULL
medico_responsable_id UUID         NOT NULL      ← FK lógica → profesionales_salud.id
activo                BOOLEAN      NOT NULL DEFAULT TRUE
created_at            TIMESTAMP    NOT NULL DEFAULT NOW()
```

Relación: pacientes → expedientes_clinicos es **1 a 1**.
Al crear un paciente se crea su expediente en la misma transacción.

---

### NOTES DB

```sql
notas_medicas  (tabla central — todo lo demás apunta aquí)
─────────────────────────────────────────────────────
id             UUID        PK DEFAULT gen_random_uuid()
expediente_id  UUID        NOT NULL   ← FK lógica → expedientes_clinicos.id
autor_id       UUID        NOT NULL   ← FK lógica → profesionales_salud.id
tipo_nota      VARCHAR(40) NOT NULL
  -- 'ingreso' | 'evolucion' | 'interconsulta' | 'egreso'
fecha_registro TIMESTAMP   NOT NULL DEFAULT NOW()
created_at     TIMESTAMP   NOT NULL DEFAULT NOW()

somatometria  (1:1 con nota)
─────────────────────────────────────────────────────
id                  UUID         PK
nota_id             UUID         NOT NULL UNIQUE REFERENCES notas_medicas(id)
peso_kg             DECIMAL(5,2)
talla_cm            DECIMAL(5,2)
tension_sistolica   SMALLINT     -- el 110 de "110/70 mmHg"
tension_diastolica  SMALLINT     -- el 70  de "110/70 mmHg"
frecuencia_cardiaca SMALLINT
temperatura_c       DECIMAL(4,1)
-- IMC se calcula en Python: round(peso / (talla_m ** 2), 2)
-- NO se guarda en la base de datos

antecedentes_familiares  (1:N con nota)
─────────────────────────────────────────────────────
id           UUID         PK
nota_id      UUID         NOT NULL REFERENCES notas_medicas(id)
familiar     VARCHAR(50)  NOT NULL
  -- 'madre' | 'padre' | 'hermano' | 'abuelo' | 'hijos'
estado       VARCHAR(100) NOT NULL
  -- 'Vivo' | 'Fallecido' | 'Vivo / Sano'
padecimiento TEXT         -- nullable

antecedentes_no_patologicos  (1:1 con nota)
─────────────────────────────────────────────────────
id               UUID         PK
nota_id          UUID         NOT NULL UNIQUE REFERENCES notas_medicas(id)
tipo_vivienda    VARCHAR(50)
  -- 'Propia' | 'Rentada' | 'Prestada'
servicios        VARCHAR(100)
num_habitaciones SMALLINT
num_convivientes SMALLINT
actividad_fisica VARCHAR(100)
  -- 'sedentarismo' | 'moderada' | 'intensa'
horas_sueno      SMALLINT
observaciones    TEXT         -- texto narrativo libre, nullable

toxicomanias  (1:N con nota)
─────────────────────────────────────────────────────
id         UUID         PK
nota_id    UUID         NOT NULL REFERENCES notas_medicas(id)
sustancia  VARCHAR(50)  NOT NULL
  -- 'tabaco' | 'alcohol' | 'cannabis' | otros
frecuencia VARCHAR(100) NOT NULL
activo     BOOLEAN      NOT NULL DEFAULT TRUE

antecedentes_patologicos  (1:N con nota)
─────────────────────────────────────────────────────
id               UUID        PK
nota_id          UUID        NOT NULL REFERENCES notas_medicas(id)
tipo             VARCHAR(50) NOT NULL
  -- 'quirurgico' | 'traumatico' | 'alergico' | 'cronico_degenerativo'
descripcion      TEXT        NOT NULL
fecha_aproximada VARCHAR(50) -- texto libre, nullable

padecimiento_actual  (1:1 con nota)
─────────────────────────────────────────────────────
id            UUID PK
nota_id       UUID NOT NULL UNIQUE REFERENCES notas_medicas(id)
observaciones TEXT NOT NULL

sintomas_nota  (1:N con nota)
─────────────────────────────────────────────────────
id      UUID         PK
nota_id UUID         NOT NULL REFERENCES notas_medicas(id)
sintoma VARCHAR(100) NOT NULL

diagnosticos  (1:N con nota)
─────────────────────────────────────────────────────
id           UUID        PK
nota_id      UUID        NOT NULL REFERENCES notas_medicas(id)
sistema      VARCHAR(20) NOT NULL
  -- 'occidental' | 'mtch'
cie10        VARCHAR(10) NOT NULL
descripcion  TEXT        NOT NULL
es_principal BOOLEAN     NOT NULL DEFAULT FALSE

plan_terapeutico  (1:1 con nota)
─────────────────────────────────────────────────────
id                 UUID PK
nota_id            UUID NOT NULL UNIQUE REFERENCES notas_medicas(id)
principio          TEXT NOT NULL
puntos_principales TEXT NOT NULL
  -- 'H14, H13, Vb34, H3, Ren6, Ren12, E36, B6'
puntos_secundarios TEXT -- nullable
```

---

### AUDIT DB

```sql
audit_log
─────────────────────────────────────────────────────
id           UUID         PK DEFAULT gen_random_uuid()
user_id      UUID         NOT NULL  ← FK lógica → profesionales_salud.id
accion       VARCHAR(50)  NOT NULL
  -- 'login' | 'crear_paciente' | 'ver_paciente'
  -- 'crear_nota' | 'ver_nota' | 'crear_medico' | 'desactivar_medico'
recurso_tipo VARCHAR(50)  NOT NULL
  -- 'paciente' | 'nota' | 'expediente' | 'medico'
recurso_id   UUID         -- nullable
ip_origen    VARCHAR(45)  -- nullable
navegador    VARCHAR(200) -- nullable
created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
```

---

## 6. Endpoints

### Auth Service — :8001

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /auth/login | público | Recibe email+password, devuelve JWT |
| GET | /auth/me | medico, admin | Datos del profesional logueado |
| POST | /auth/logout | medico, admin | Devuelve 200 (el cliente borra el token) |
| GET | /doctors | admin | Lista todos los médicos |
| POST | /doctors | admin | Registra un médico nuevo |
| GET | /doctors/{id} | admin | Detalle de un médico |
| PUT | /doctors/{id} | admin | Actualiza nombre, cédula, tipo, rol |
| DELETE | /doctors/{id} | admin | Desactiva médico (activo=False, nunca borra) |

### Patient Service — :8002

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /patients | medico | Alta de paciente + crea expediente en una transacción |
| GET | /patients | medico, admin | Lista — acepta ?search=nombre\|curp |
| GET | /patients/{id} | medico, admin | Perfil completo + expediente |
| PUT | /patients/{id} | medico | Actualiza curp, domicilio, telefono, ocupacion |

### Notes Service — :8003

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /notes | medico | Crea nota completa con todas las subtablas |
| GET | /notes | medico, admin | Lista por ?expediente_id= |
| GET | /notes/{id} | medico, admin | Nota completa con todos sus sub-objetos |

### Audit Service — :8004

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | /audit/log | interno | Lo llaman los otros servicios, no nginx |
| GET | /audit | admin, auditor | Filtra por ?user_id= o ?patient_id= con paginación |

---

## 7. Datos reales de ejemplo

Usa estos datos para el seed y para las pruebas:

```json
{
  "admin": {
    "nombre_completo": "Administrador del Sistema",
    "email": "admin@clinica.com",
    "password": "CambiarEsto2024!",
    "rol": "admin",
    "cedula_profesional": "ADMIN001",
    "tipo_personal": "Administrador"
  },
  "auditor": {
    "nombre_completo": "Auditor del Sistema",
    "email": "auditor@clinica.com",
    "password": "Auditor2024!",
    "rol": "auditor",
    "cedula_profesional": "AUDIT001",
    "tipo_personal": "Auditor"
  },
  "medico": {
    "nombre_completo": "Juan Antonio Vargas Vera",
    "email": "jvargas@clinica.com",
    "password": "Medico2024!",
    "rol": "medico",
    "cedula_profesional": "5941640",
    "tipo_personal": "Médico Tratante"
  },
  "paciente": {
    "curp": "OACC830225HMSLRL09",
    "nombre": "Carlos Alberto",
    "apellido_paterno": "Olivares",
    "apellido_materno": "Cruz",
    "fecha_nacimiento": "1983-02-25",
    "sexo": "masculino",
    "domicilio": "Hac de lanzarote 13 int 27 Cuautitlán Izcalli",
    "telefono": "5537191375",
    "ocupacion": "Ingeniero en sistemas / Empleado",
    "establecimiento": "Clínica de Acupuntura / Particular"
  },
  "nota_medica": {
    "tipo_nota": "ingreso",
    "somatometria": {
      "peso_kg": 84,
      "talla_cm": 168,
      "tension_sistolica": 110,
      "tension_diastolica": 70
    },
    "antecedentes_familiares": [
      { "familiar": "madre", "estado": "Vivo" },
      { "familiar": "padre", "estado": "Vivo" },
      { "familiar": "hijos", "estado": "Vivo / Sano" }
    ],
    "antecedentes_no_patologicos": {
      "tipo_vivienda": "Propia",
      "servicios": "servicios completos",
      "num_habitaciones": 2,
      "num_convivientes": 2,
      "actividad_fisica": "sedentarismo"
    },
    "toxicomanias": [
      { "sustancia": "tabaco", "frecuencia": "1/2 cajetilla diario" },
      { "sustancia": "alcohol", "frecuencia": "1 vez/semana" }
    ],
    "antecedentes_patologicos": [
      { "tipo": "quirurgico", "descripcion": "Apendicectomía" },
      { "tipo": "traumatico", "descripcion": "Lesión muñeca" }
    ],
    "padecimiento_actual": {
      "observaciones": "No descansa al dormir, química sanguínea normal, sedentarismo."
    },
    "sintomas": [
      "Dolor de espalda", "Agotamiento", "Astenia",
      "Adinamia", "Cefalea", "Artralgias"
    ],
    "diagnosticos": [
      { "sistema": "occidental", "cie10": "M169", "descripcion": "Coxartrosis", "es_principal": true },
      { "sistema": "mtch", "cie10": "M705", "descripcion": "Bursitis rodilla" },
      { "sistema": "mtch", "cie10": "G500", "descripcion": "Neuralgia trigémino" },
      { "sistema": "mtch", "cie10": "F520", "descripcion": "Pérdida deseo sexual" }
    ],
    "plan_terapeutico": {
      "principio": "Calentar el centro y revitalizar el bazo",
      "puntos_principales": "H14, H13, Vb34, H3, Ren6, Ren12, E36, B6",
      "puntos_secundarios": "R3, P7, R6, V23, Du4, Ren17, R25, Du12"
    }
  }
}
```

---

## 8. Implementación — sigue este orden exacto

---

### FASE 1 — Infraestructura base

Crea todos estos archivos en la raíz de `clinica-acupuntura/`.

#### docker-compose.yml

Debe incluir los siguientes servicios:

```
nginx          → imagen nginx:latest, puerto 80:80
               → volumen: ./nginx/nginx.conf:/etc/nginx/nginx.conf
               → depends_on: todos los servicios

auth-service   → build: ./auth-service, puerto 8001:8001
               → env_file: .env
               → depends_on: auth-db (healthcheck)

patient-service → build: ./patient-service, puerto 8002:8002
                → env_file: .env
                → depends_on: patient-db (healthcheck)

notes-service  → build: ./notes-service, puerto 8003:8003
               → env_file: .env
               → depends_on: notes-db (healthcheck)

audit-service  → build: ./audit-service, puerto 8004:8004
               → env_file: .env
               → depends_on: audit-db (healthcheck)

auth-db        → imagen postgres:16, puerto 5433:5432
               → volumen persistente auth_data
               → healthcheck: pg_isready

patient-db     → imagen postgres:16, puerto 5434:5432
               → volumen persistente patient_data
               → healthcheck: pg_isready

notes-db       → imagen postgres:16, puerto 5435:5432
               → volumen persistente notes_data
               → healthcheck: pg_isready

audit-db       → imagen postgres:16, puerto 5436:5432
               → volumen persistente audit_data
               → healthcheck: pg_isready

pgadmin        → imagen dpage/pgadmin4, puerto 5050:80
               → para administrar las 4 bases de datos visualmente

seed           → build: . (usa seed.py en la raíz)
               → command: python seed.py
               → depends_on: auth-service (healthcheck)
               → restart: no
```

Red interna: `clinica-network` para comunicación entre servicios por nombre.

#### nginx/nginx.conf

```nginx
events {}

http {
    upstream auth_service    { server auth-service:8001; }
    upstream patient_service { server patient-service:8002; }
    upstream notes_service   { server notes-service:8003; }
    upstream audit_service   { server audit-service:8004; }

    server {
        listen 80;

        # Login es el único endpoint público (sin validar JWT)
        location = /auth/login {
            proxy_pass http://auth_service;
            proxy_set_header Host $host;
        }

        # Todo lo demás requiere JWT válido
        # nginx valida el JWT y agrega los headers X-User-Id y X-User-Rol
        # antes de pasar la petición al servicio

        location /auth/    { proxy_pass http://auth_service;    include /etc/nginx/proxy_headers.conf; }
        location /doctors/ { proxy_pass http://auth_service;    include /etc/nginx/proxy_headers.conf; }
        location /patients/{ proxy_pass http://patient_service; include /etc/nginx/proxy_headers.conf; }
        location /notes/   { proxy_pass http://notes_service;   include /etc/nginx/proxy_headers.conf; }
        location /audit/   { proxy_pass http://audit_service;   include /etc/nginx/proxy_headers.conf; }
    }
}
```

Para la validación del JWT en nginx usa el módulo `nginx-plus` o implementa
la validación mediante `auth_request` apuntando a auth-service. Si es más
simple, el gateway puede ser un quinto servicio FastAPI liviano que valide
el JWT y haga proxy — lo que sea más rápido de implementar en modo desarrollo.

#### .env.example

```env
# Auth DB
AUTH_DB_URL=postgresql://auth_user:auth_pass@auth-db:5432/auth_db

# Patient DB
PATIENT_DB_URL=postgresql://patient_user:patient_pass@patient-db:5432/patient_db

# Notes DB
NOTES_DB_URL=postgresql://notes_user:notes_pass@notes-db:5432/notes_db

# Audit DB
AUDIT_DB_URL=postgresql://audit_user:audit_pass@audit-db:5432/audit_db

# JWT
SECRET_KEY=supersecreto-cambia-esto-por-64-caracteres-aleatorios
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=8

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@clinica.com
PGADMIN_DEFAULT_PASSWORD=admin123

# URLs internas entre servicios
PATIENT_SERVICE_URL=http://patient-service:8002
AUDIT_SERVICE_URL=http://audit-service:8004
```

#### .gitignore

```
.env
__pycache__/
*.pyc
.pytest_cache/
*.egg-info/
dist/
.venv/
venv/
```

---

### FASE 2 — Auth Service

#### requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pydantic[email]==2.7.1
httpx==0.27.0
```

#### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
```

#### app/database.py

Conecta a `AUTH_DB_URL` del .env usando SQLAlchemy.
Expone `engine`, `SessionLocal` y `Base`.
Crea una función `get_db()` como dependencia de FastAPI.

#### app/models.py

Clase `ProfesionalSalud` con todos los campos del esquema de la sección 5.
Usar `func.now()` para `created_at` y `updated_at`.

#### app/schemas.py

```python
LoginRequest:         email: str, password: str
TokenResponse:        access_token: str, token_type: str = "bearer"
ProfesionalCreate:    cedula_profesional, nombre_completo, tipo_personal,
                      email, password, rol="medico"
                      -- rol acepta: 'medico' | 'admin' | 'auditor'
ProfesionalUpdate:    nombre_completo?, tipo_personal?, rol?, activo?
                      (todos Optional)
ProfesionalResponse:  todos los campos excepto password_hash
                      model_config = ConfigDict(from_attributes=True)
```

#### app/dependencies.py

```python
def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    # Decodifica JWT con SECRET_KEY y ALGORITHM del .env
    # Busca el profesional por el sub del payload
    # Lanza HTTPException 401 si token inválido o expirado
    # Lanza HTTPException 403 si activo == False
    # Devuelve el objeto ProfesionalSalud

def require_admin(user = Depends(get_current_user)):
    # Lanza HTTPException 403 si user.rol != "admin"
    # Devuelve user

def require_auditor_or_admin(user = Depends(get_current_user)):
    # Permite pasar si user.rol == "admin" O user.rol == "auditor"
    # Lanza HTTPException 403 para cualquier otro rol
    # Devuelve user
```

#### app/dependencies.py

```python
def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    # Decodifica JWT con SECRET_KEY y ALGORITHM del .env
    # Busca el profesional por el sub del payload
    # Lanza HTTPException 401 si token inválido o expirado
    # Lanza HTTPException 403 si activo == False
    # Devuelve el objeto ProfesionalSalud

def require_admin(user = Depends(get_current_user)):
    # Lanza HTTPException 403 si user.rol != "admin"
    # Devuelve user
```

#### app/services/auth.py

```python
def login(email, password, db):
    # Busca profesional por email
    # Verifica password con passlib verify
    # Si activo=False → HTTPException 403 "Cuenta desactivada"
    # Genera JWT con payload: sub=str(id), rol=rol, nombre=nombre_completo
    # Expira en ACCESS_TOKEN_EXPIRE_HOURS horas
    # Devuelve TokenResponse

def get_me(user_id, db):
    # Busca y devuelve el profesional por id
```

#### app/services/doctors.py

```python
def listar(db) → list[ProfesionalSalud]
def crear(datos: ProfesionalCreate, db) → ProfesionalSalud
    # Hashea el password con passlib hash antes de guardar
def obtener(id, db) → ProfesionalSalud | None
def actualizar(id, datos: ProfesionalUpdate, db) → ProfesionalSalud
    # Actualiza updated_at = datetime.utcnow()
def desactivar(id, db) → ProfesionalSalud
    # Solo cambia activo = False, NUNCA borra el registro
```

#### app/routers/auth.py

```python
POST /auth/login   → sin autenticación → services.auth.login()
GET  /auth/me      → Depends(get_current_user) → services.auth.get_me()
POST /auth/logout  → Depends(get_current_user) → return {"message": "ok"}
```

#### app/routers/doctors.py

Todos los endpoints usan `Depends(require_admin)`.

```python
GET    /doctors        → services.doctors.listar()
POST   /doctors        → services.doctors.crear()
GET    /doctors/{id}   → services.doctors.obtener()
PUT    /doctors/{id}   → services.doctors.actualizar()
DELETE /doctors/{id}   → services.doctors.desactivar()
```

#### app/main.py

```python
app = FastAPI(title="Auth Service", version="1.0.0")
app.include_router(auth_router)
app.include_router(doctors_router)

@app.get("/health")
def health(): return {"status": "ok"}
```

#### alembic/env.py

Configurar para que use `AUTH_DB_URL` y apunte a `Base.metadata` de models.py.

---

### FASE 3 — Patient Service

#### requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
pydantic==2.7.1
httpx==0.27.0
```

#### Dockerfile

Igual que auth-service pero CMD con puerto 8002.

#### app/dependencies.py

Este servicio NO valida JWT. Lee headers inyectados por nginx:

```python
def get_current_user(
    x_user_id:  str = Header(..., alias="X-User-Id"),
    x_user_rol: str = Header(..., alias="X-User-Rol")
) -> dict:
    return {"id": x_user_id, "rol": x_user_rol}

def require_medico(user = Depends(get_current_user)):
    if user["rol"] != "medico":
        raise HTTPException(403, "Solo médicos pueden realizar esta acción")
    return user
```

#### app/models.py

Clases `Paciente` y `ExpedienteClinico` con los campos de la sección 5.
`ExpedienteClinico` tiene FK a `Paciente` con `relationship`.

#### app/schemas.py

```python
PacienteCreate:   curp (str, obligatorio), nombre, apellido_paterno,
                  apellido_materno (obligatorio), fecha_nacimiento (date),
                  sexo, domicilio?, telefono?, ocupacion?, establecimiento (str)

PacienteUpdate:   curp?, domicilio?, telefono?, ocupacion?
                  (solo estos 4 campos, todos Optional)

ExpedienteResponse: id, paciente_id, fecha_apertura, establecimiento,
                    medico_responsable_id, activo

PacienteResponse: todos los campos de paciente + expediente: ExpedienteResponse
                  model_config = ConfigDict(from_attributes=True)
```

#### app/services/patients.py

```python
async def crear(datos: PacienteCreate, creado_por: str, db) → Paciente:
    # Dentro de una transacción (db.begin()):
    # 1. Crea el registro Paciente con creado_por=creado_por
    # 2. db.flush() para obtener el ID sin hacer commit
    # 3. Crea ExpedienteClinico con paciente_id=paciente.id
    #    y medico_responsable_id=creado_por
    # 4. Commit automático al salir del bloque
    # 5. Notifica al audit-service (llamada httpx async, no bloquear si falla)

async def buscar(search: str | None, db) → list[Paciente]:
    # Si search es None → devuelve los últimos 20 ordenados por created_at DESC
    # Si search tiene valor → filtra por nombre ILIKE, apellido_paterno ILIKE o curp

async def obtener(id: str, db) → Paciente:
    # Join con expediente_clinico
    # HTTPException 404 si no existe

async def actualizar(id: str, datos: PacienteUpdate, db) → Paciente:
    # Solo actualiza los campos que vengan en el request (no None)
    # Actualiza updated_at
    # Notifica al audit-service
```

#### app/routers/patients.py

```python
POST /patients       → Depends(require_medico) → services.patients.crear()
GET  /patients       → Depends(get_current_user) → services.patients.buscar()
GET  /patients/{id}  → Depends(get_current_user) → services.patients.obtener()
PUT  /patients/{id}  → Depends(require_medico)   → services.patients.actualizar()
```

---

### FASE 4 — Notes Service

#### requirements.txt

Mismo que patient-service.

#### Dockerfile

Igual pero puerto 8003.

#### app/dependencies.py

Mismo patrón que patient-service (lee X-User-Id y X-User-Rol).

#### app/models.py

Las 10 tablas de la sección 5. Todas con FK a `notas_medicas.id`.
Las relaciones 1:1 usan `unique=True` en `nota_id`.
Usar `relationship()` de SQLAlchemy para lazy loading.

#### app/schemas.py

El schema `NotaCreate` anida los sub-objetos:

```python
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
    sistema: str  # 'occidental' | 'mtch'
    cie10: str
    descripcion: str
    es_principal: bool = False

class PlanCreate(BaseModel):
    principio: str
    puntos_principales: str
    puntos_secundarios: str | None = None

class NotaCreate(BaseModel):
    expediente_id: UUID
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
```

Para `NotaResponse` incluir todos los sub-objetos y el IMC calculado.

#### app/services/notes.py

```python
async def crear(datos: NotaCreate, autor_id: str, db) → NotaMedica:
    # 1. Verificar que el expediente existe:
    #    GET http://patient-service:8002/patients?expediente_id={datos.expediente_id}
    #    Si 404 → HTTPException 404 "Expediente no encontrado"
    # 2. Abrir transacción
    # 3. INSERT en notas_medicas
    # 4. db.flush() para obtener el ID
    # 5. INSERT en cada subtabla si viene en el request:
    #    - somatometria (si viene)
    #    - antecedentes_familiares (una fila por cada elemento)
    #    - antecedentes_no_patologicos (si viene)
    #    - toxicomanias (una fila por cada elemento)
    #    - antecedentes_patologicos (una fila por cada elemento)
    #    - padecimiento_actual (si viene)
    #    - sintomas_nota (una fila por cada string en la lista)
    #    - diagnosticos (una fila por cada elemento)
    #    - plan_terapeutico (si viene)
    # 6. Commit
    # 7. Notificar al audit-service (no bloquear si falla)

async def listar(expediente_id: str, db) → list[NotaMedica]:
    # Solo campos de notas_medicas, sin subtablas
    # Ordenar por fecha_registro DESC

async def obtener(id: str, db) → dict:
    # Cargar nota con TODOS sus sub-objetos (eager loading)
    # Calcular IMC si hay somatometría:
    #   talla_m = talla_cm / 100
    #   imc = round(peso_kg / (talla_m ** 2), 2)
    # Incluir imc en la respuesta
    # HTTPException 404 si no existe
```

---

### FASE 5 — Audit Service

#### requirements.txt

Mismo que patient-service.

#### Dockerfile

Igual pero puerto 8004.

#### app/dependencies.py

Mismo patrón que patient-service.

#### app/models.py

Clase `AuditLog` con los campos de la sección 5.

#### app/schemas.py

```python
AuditCreate:   user_id (UUID), accion (str), recurso_tipo (str),
               recurso_id (UUID | None), ip_origen (str | None),
               navegador (str | None)

AuditResponse: todos los campos
               model_config = ConfigDict(from_attributes=True)
```

#### app/services/audit.py

```python
def registrar(datos: AuditCreate, db) → AuditLog:
    # INSERT en audit_log

def consultar(user_id, patient_id, page, limit, db) → list[AuditLog]:
    # Si user_id → filtra por user_id
    # Si patient_id → filtra por recurso_id = patient_id
    # Ordenar por created_at DESC
    # Paginación: offset = (page - 1) * limit
```

#### app/routers/audit.py

```python
POST /audit/log  → sin Depends de rol (es llamada interna desde otros servicios)
                 → services.audit.registrar()

GET  /audit      → Depends(require_auditor_or_admin)
                 → acepta ?user_id= y/o ?patient_id= y ?page=1 &limit=50
                 → services.audit.consultar()
```

---

### FASE 6 — Seed de datos iniciales

Archivo `seed.py` en la raíz del proyecto:

```python
# 1. Conectar a auth_db usando AUTH_DB_URL del .env
# 2. Verificar si ya existe admin@clinica.com → si no, crearlo
# 3. Verificar si ya existe auditor@clinica.com → si no, crearlo
# 4. Verificar si ya existe jvargas@clinica.com → si no, crearlo
# 5. Hashear todos los passwords con passlib bcrypt antes de guardar
# 6. Imprimir en consola:
#    ✓ Admin creado:   admin@clinica.com    / CambiarEsto2024!
#    ✓ Auditor creado: auditor@clinica.com  / Auditor2024!
#    ✓ Médico creado:  jvargas@clinica.com  / Medico2024!
#    (o "ya existe" si no se crearon)
```

---

## 9. Verificación final — cómo probar que todo funciona

Una vez que `docker-compose up --build` levante sin errores:

```bash
# 1. Verificar que los servicios responden
curl http://localhost:8001/health   # {"status": "ok"}
curl http://localhost:8002/health   # {"status": "ok"}
curl http://localhost:8003/health   # {"status": "ok"}
curl http://localhost:8004/health   # {"status": "ok"}

# 2. Login como admin
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@clinica.com", "password": "CambiarEsto2024!"}'
# Guarda el access_token

# 3. Con el token del admin, crear al médico Vargas si el seed no lo hizo
curl -X POST http://localhost/doctors \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{ "nombre_completo": "Juan Antonio Vargas Vera",
        "email": "jvargas@clinica.com",
        "password": "Medico2024!",
        "cedula_profesional": "5941640",
        "tipo_personal": "Médico Tratante",
        "rol": "medico" }'

# 4. Login como médico
curl -X POST http://localhost/auth/login \
  -d '{"email": "jvargas@clinica.com", "password": "Medico2024!"}'
# Guarda el access_token del médico

# 5. Dar de alta al paciente Carlos
curl -X POST http://localhost/patients \
  -H "Authorization: Bearer <TOKEN_MEDICO>" \
  -H "Content-Type: application/json" \
  -d '{
    "curp": "OACC830225HMSLRL09",
    "nombre": "Carlos Alberto",
    "apellido_paterno": "Olivares",
    "apellido_materno": "Cruz",
    "fecha_nacimiento": "1983-02-25",
    "sexo": "masculino",
    "domicilio": "Hac de lanzarote 13 int 27 Cuautitlán Izcalli",
    "telefono": "5537191375",
    "ocupacion": "Ingeniero en sistemas / Empleado",
    "establecimiento": "Clínica de Acupuntura / Particular"
  }'
# Guarda el id del paciente y el expediente_id

# 6. Documentación interactiva (Swagger)
# http://localhost:8001/docs  ← Auth Service
# http://localhost:8002/docs  ← Patient Service
# http://localhost:8003/docs  ← Notes Service
# http://localhost:8004/docs  ← Audit Service
# http://localhost:5050       ← pgAdmin
```

---

## 10. Reglas absolutas para todo el código

1. Nunca borres registros de la base de datos.
2. Las notas médicas no tienen PUT ni DELETE.
3. `curp` y `apellido_materno` son obligatorios en PacienteCreate.
4. El IMC se calcula en Python, nunca se guarda en la DB.
5. La creación de una nota es una sola transacción con todas sus subtablas.
6. patient-service y notes-service leen `X-User-Id` y `X-User-Rol` de headers, no validan JWT.
7. Todos los servicios exponen `GET /health` que devuelve `{"status": "ok"}`.
8. Las contraseñas siempre con bcrypt. Nunca texto plano en la DB.
9. Las notificaciones al audit-service no deben bloquear el flujo principal.
   Si el audit-service falla, la operación original igual se completa.
10. FastAPI genera `/docs` automáticamente. Usa `description=` en los endpoints.

---

*Sistema Médico — Clínica de Acupuntura*
*Versión 1.0 — Sistema base sin blockchain*
*Listo para agregar blockchain-service como módulo independiente*
