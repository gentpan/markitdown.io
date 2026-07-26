from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.api.deps import get_client_ip, get_optional_user, quota_subject
from app.core.config import get_settings
from app.core.db import SessionLocal
from app.models.job import JobStatus
from app.schemas.jobs import JobCreateResponse, JobStatusResponse, QuotaStatus
from app.services import jobs as job_service
from app.services.quota import check_and_consume, get_quota_status
from app.services.storage import resolve_under, save_upload

router = APIRouter(prefix="/api/v1", tags=["jobs"])
settings = get_settings()


@router.get("/quota", response_model=QuotaStatus)
async def quota(request: Request) -> QuotaStatus:
    async with SessionLocal() as session:
        user = await get_optional_user(session)
        ip = await get_client_ip(request)
        subject = quota_subject(user=user, api_key_id=None, client_ip=ip)
        return await get_quota_status(subject=subject, user=user)


@router.post("/jobs/to-markdown", response_model=JobCreateResponse)
async def enqueue_to_markdown(
    request: Request,
    file: UploadFile = File(...),
) -> JobCreateResponse:
    async with SessionLocal() as session:
        user = await get_optional_user(session)
        ip = await get_client_ip(request)
        subject = quota_subject(user=user, api_key_id=None, client_ip=ip)

        data = await file.read()
        size = len(data)
        await file.seek(0)
        if size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"文件过大，最大支持 {settings.max_file_size_mb}MB",
            )
        from app.services.converter import converter

        if not file.filename or not converter.is_supported(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件类型。支持: {', '.join(converter.get_supported_formats()['all'][:12])}...",
            )

        await check_and_consume(
            session=session,
            subject=subject,
            user=user,
            client_ip=ip,
            action="job_to_markdown",
        )

        path = await save_upload(file)
        job = await job_service.create_to_markdown_job(
            session=session,
            input_path=path,
            original_filename=file.filename,
            user_id=user.id if user else None,
            client_ip=ip,
            enqueue=True,
        )
        return JobCreateResponse(job_id=job.id, status=job.status)


@router.post("/jobs/from-markdown", response_model=JobCreateResponse)
async def enqueue_from_markdown(
    request: Request,
    markdown: str = Form(...),
    output_format: str = Form("docx"),
    filename: str | None = Form(None),
) -> JobCreateResponse:
    async with SessionLocal() as session:
        user = await get_optional_user(session)
        ip = await get_client_ip(request)
        subject = quota_subject(user=user, api_key_id=None, client_ip=ip)
        await check_and_consume(
            session=session,
            subject=subject,
            user=user,
            client_ip=ip,
            action="job_from_markdown",
        )
        try:
            job = await job_service.create_from_markdown_job(
                session=session,
                markdown=markdown,
                output_format=output_format,
                filename=filename,
                user_id=user.id if user else None,
                client_ip=ip,
                enqueue=True,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        return JobCreateResponse(job_id=job.id, status=job.status)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def job_status(job_id: UUID) -> JobStatusResponse:
    async with SessionLocal() as session:
        job = await job_service.get_job(session, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="任务不存在")
        return job_service.to_status_response(job)


@router.get("/jobs/{job_id}/download")
async def job_download(job_id: UUID) -> FileResponse:
    async with SessionLocal() as session:
        job = await job_service.get_job(session, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="任务不存在")
        if job.status != JobStatus.succeeded or not job.output_path:
            raise HTTPException(status_code=409, detail="任务尚未完成或没有输出文件")
        path = Path(job.output_path)
        if not path.is_file():
            raise HTTPException(status_code=404, detail="文件不存在或已过期")
        return FileResponse(
            path,
            filename=path.name,
            media_type=job.content_type or "application/octet-stream",
        )


@router.get("/download/{filename}")
async def download_by_name(filename: str) -> FileResponse:
    try:
        path = resolve_under(settings.output_dir, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    return FileResponse(path, filename=path.name)
