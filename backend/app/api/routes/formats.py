from fastapi import APIRouter

from app.services.converter import converter
from app.services.file_types import EXPORT_FORMATS

router = APIRouter(tags=["formats"])


@router.get("/formats")
@router.get("/api/formats", include_in_schema=False)
@router.get("/api/v1/formats", include_in_schema=False)
async def get_formats() -> dict:
    return {
        **converter.get_supported_formats(),
        "export": EXPORT_FORMATS,
    }
