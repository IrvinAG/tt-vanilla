from fastapi import FastAPI
from app.database import engine, Base
from app.routers import audit

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Audit Service", version="1.0.0")
app.include_router(audit.router)


@app.get("/health", description="Health check")
def health():
    return {"status": "ok"}
