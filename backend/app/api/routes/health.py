from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.services.converter import converter

router = APIRouter(tags=["health"])
settings = get_settings()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    markitdown: bool
    pandoc: bool


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse, include_in_schema=False)
@router.get("/api/v1/health", response_model=HealthResponse, include_in_schema=False)
async def health() -> HealthResponse:
    ok = converter.markitdown_available and converter.pandoc_available
    return HealthResponse(
        status="healthy" if ok else "degraded",
        service=settings.app_name,
        version=settings.app_version,
        markitdown=converter.markitdown_available,
        pandoc=converter.pandoc_available,
    )
