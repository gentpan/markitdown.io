from fastapi import APIRouter

from app.services.converter import converter
from app.services.file_types import (
    ConverterType,
    EXPORT_FORMATS,
    get_types_by_category,
)

router = APIRouter(tags=["formats"])


def _serialize_categories(by_category: dict) -> dict:
    return {
        key: {
            "name": info["name"],
            "icon": info["icon"],
            "description": info["description"],
            "count": len(info["types"]),
            "extensions": [t.extension for t in info["types"]],
        }
        for key, info in by_category.items()
    }


@router.get("/formats")
@router.get("/api/formats", include_in_schema=False)
@router.get("/api/v1/formats", include_in_schema=False)
async def get_formats() -> dict:
    # File → Markdown chips / docs: MarkItDown categories only
    markitdown_categories = _serialize_categories(
        get_types_by_category(ConverterType.MARKITDOWN)
    )
    return {
        **converter.get_supported_formats(),
        "export": EXPORT_FORMATS,
        "categories": markitdown_categories,
        "engine": "Microsoft MarkItDown",
    }
