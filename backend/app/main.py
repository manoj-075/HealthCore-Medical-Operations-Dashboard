from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import check_db_health
from app.routers import dashboard, patients, finance, operations, assistant

app = FastAPI(
    title="Medical Operations Dashboard API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(patients.router)
app.include_router(finance.router)
app.include_router(operations.router)
app.include_router(assistant.router)


@app.get("/", tags=["Status"])
def root():
    return {"status": "ok", "api": "Medical Operations Dashboard API", "version": "1.0.0"}


@app.get("/health", tags=["Status"])
def health():
    return check_db_health()
