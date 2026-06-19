from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine, init_db
from app.routers import auth, customers, dashboard, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For assessment/demo simplicity. For larger production apps, replace this with Alembic migrations.
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="2.1.0",
    description="Production-ready FastAPI backend with JWT auth, products, customers, orders, dashboard, and health checks.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Inventory & Order Management API",
        "docs": "/docs",
        "health": "/health",
        "db_health": "/health/db",
        "version": "2.1.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
        "service": settings.app_name,
        "version": "2.1.0",
    }


@app.get("/health/db", tags=["Health"])
def database_health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database connection failed.") from exc
