from fastapi import FastAPI
from app.database import engine, Base
from app.routers import notes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notes Service", version="1.0.0")
app.include_router(notes.router)


@app.get("/health", description="Health check")
def health():
    return {"status": "ok"}
