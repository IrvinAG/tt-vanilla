from fastapi import FastAPI
from app.database import engine, Base
from app.routers import patients

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Patient Service", version="1.0.0")
app.include_router(patients.router)


@app.get("/health", description="Health check")
def health():
    return {"status": "ok"}
