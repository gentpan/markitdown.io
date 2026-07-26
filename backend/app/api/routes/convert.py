"""Conversion microservice endpoints — no business DB."""

from pathlib import Path

import aiofiles
from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services.cleanup import cleanup_temp_dirs
from app.services.converter import ConversionError, converter, normalize_output_format
from app.services.storage import resolve_under, unique_name

router = APIRouter(tags=["convert"])
settings = get_settings()


class SyncConvertResponse(BaseModel):
    success: bool = True
    title: str
    filename: str
    markdown: str
    download_url: str
    file_size: int
    source_type: str = "input"


class ExportResponse(BaseModel):
    success: bool = True
    filename: str
    download_url: str
    file_size: int = Field(ge=0)


def _is_markdown_filename(filename: str) -> bool:
    return Path(filename).suffix.lower() in {".md", ".markdown", ".mkd"}


async def _save_upload(file: UploadFile) -> Path:
    name = unique_name(file.filename or "upload.bin")
    path = settings.upload_dir / name
    async with aiofiles.open(path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            await out.write(chunk)
    await file.seek(0)
    return path


@router.post("/api/convert/to-markdown", response_model=SyncConvertResponse)
@router.post("/api/v1/convert/to-markdown", response_model=SyncConvertResponse)
async def convert_to_markdown(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> SyncConvertResponse:
    data = await file.read()
    size = len(data)
    await file.seek(0)

    if size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"文件过大，最大支持 {settings.max_file_size_mb}MB",
        )
    if not file.filename or not converter.is_supported(file.filename):
        supported = converter.get_supported_formats()["all"]
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。支持的类型: {', '.join(supported[:10])}...",
        )

    path = await _save_upload(file)
    try:
        markdown, title = await converter.to_markdown(path, file.filename)
    except (ConversionError, RuntimeError) as e:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"转换失败: {e}") from e

    out_name = f"{path.stem}.md"
    out_path = settings.output_dir / out_name
    async with aiofiles.open(out_path, "w", encoding="utf-8") as f:
        await f.write(markdown)

    background_tasks.add_task(path.unlink, missing_ok=True)
    background_tasks.add_task(cleanup_temp_dirs)

    return SyncConvertResponse(
        title=title,
        filename=file.filename,
        markdown=markdown,
        download_url=f"/api/download/{out_name}",
        file_size=len(markdown.encode("utf-8")),
        source_type="markdown" if _is_markdown_filename(file.filename) else "input",
    )


@router.post("/api/convert/from-markdown", response_model=ExportResponse)
@router.post("/api/v1/convert/from-markdown", response_model=ExportResponse)
async def convert_from_markdown(
    background_tasks: BackgroundTasks,
    markdown: str = Form(...),
    output_format: str = Form("docx"),
    filename: str | None = Form(None),
) -> ExportResponse:
    try:
        _, ext = normalize_output_format(output_format)
        base = Path(filename or "converted").stem
        output_path = settings.output_dir / f"{base}_{unique_name('x')[:8]}.{ext}"
        result_path = await converter.from_markdown(
            markdown, output_format, output_path
        )
    except (ValueError, ConversionError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    background_tasks.add_task(cleanup_temp_dirs)
    return ExportResponse(
        filename=result_path.name,
        download_url=f"/api/download/{result_path.name}",
        file_size=result_path.stat().st_size,
    )


@router.get("/api/download/{filename}")
@router.get("/api/v1/download/{filename}")
async def download_file(filename: str) -> FileResponse:
    try:
        path = resolve_under(settings.output_dir, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    return FileResponse(path, filename=path.name)
