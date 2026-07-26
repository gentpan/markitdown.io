from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import convert, formats, health
from app.core.config import get_settings
from app.services.cleanup import cleanup_temp_dirs

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    cleanup_temp_dirs()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "MakeItDown 转换服务：FastAPI + Pydantic + aiofiles + MarkItDown + Pandoc。"
        "业务数据（用户/额度/历史）由 TanStack Start + Drizzle 管理。"
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(formats.router)
app.include_router(convert.router)


@app.get("/")
async def root() -> dict:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/v1/health",
        "owns_database": False,
        "note": "Business DB lives in TanStack Start (Drizzle)",
    }
