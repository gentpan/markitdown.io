from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from uuid import UUID

from arq import create_pool
from arq.connections import RedisSettings
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.models.job import ConversionJob, JobStatus, JobType
from app.schemas.jobs import JobStatusResponse
from app.services.converter import ConversionError, converter, normalize_output_format
from app.services.file_types import is_supported

settings = get_settings()


def _redis_settings() -> RedisSettings:
    return RedisSettings.from_dsn(settings.redis_url)


async def enqueue_job(job_id: UUID) -> str:
    redis = await create_pool(_redis_settings())
    try:
        arq_job = await redis.enqueue_job("run_conversion_job", str(job_id))
        return arq_job.job_id if arq_job else ""
    finally:
        await redis.close()


async def create_to_markdown_job(
    *,
    session: AsyncSession,
    input_path: Path,
    original_filename: str,
    user_id: Optional[UUID] = None,
    api_key_id: Optional[UUID] = None,
    client_ip: Optional[str] = None,
    enqueue: bool = True,
) -> ConversionJob:
    if not is_supported(original_filename):
        raise ValueError("不支持的文件类型")

    job = ConversionJob(
        user_id=user_id,
        api_key_id=api_key_id,
        client_ip=client_ip,
        job_type=JobType.to_markdown,
        status=JobStatus.queued,
        original_filename=original_filename,
        input_path=str(input_path),
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.temp_file_ttl_hours),
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    if enqueue:
        arq_job_id = await enqueue_job(job.id)
        job.arq_job_id = arq_job_id
        session.add(job)
        await session.commit()
        await session.refresh(job)
    return job


async def create_from_markdown_job(
    *,
    session: AsyncSession,
    markdown: str,
    output_format: str,
    filename: Optional[str] = None,
    user_id: Optional[UUID] = None,
    api_key_id: Optional[UUID] = None,
    client_ip: Optional[str] = None,
    enqueue: bool = True,
) -> ConversionJob:
    normalize_output_format(output_format)
    staging = settings.upload_dir / f"{UUID_hex()}.md"
    staging.write_text(markdown, encoding="utf-8")

    job = ConversionJob(
        user_id=user_id,
        api_key_id=api_key_id,
        client_ip=client_ip,
        job_type=JobType.from_markdown,
        status=JobStatus.queued,
        original_filename=filename or "document.md",
        input_path=str(staging),
        output_format=output_format,
        result_preview=markdown[:2000],
        expires_at=datetime.now(timezone.utc)
        + timedelta(hours=settings.temp_file_ttl_hours),
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)

    if enqueue:
        arq_job_id = await enqueue_job(job.id)
        job.arq_job_id = arq_job_id
        session.add(job)
        await session.commit()
        await session.refresh(job)
    return job


def UUID_hex() -> str:
    from uuid import uuid4

    return uuid4().hex


async def get_job(session: AsyncSession, job_id: UUID) -> Optional[ConversionJob]:
    return await session.get(ConversionJob, job_id)


def to_status_response(job: ConversionJob) -> JobStatusResponse:
    download_url = None
    if job.status == JobStatus.succeeded and job.output_path:
        download_url = f"/api/v1/jobs/{job.id}/download"
    return JobStatusResponse(
        id=job.id,
        status=job.status,
        job_type=job.job_type,
        progress=job.progress,
        original_filename=job.original_filename,
        output_format=job.output_format,
        title=job.title,
        error_message=job.error_message,
        result_preview=job.result_preview,
        download_url=download_url,
        file_size=job.file_size,
        created_at=job.created_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        expires_at=job.expires_at,
    )


async def process_job(session: AsyncSession, job: ConversionJob) -> ConversionJob:
    job.status = JobStatus.processing
    job.started_at = datetime.now(timezone.utc)
    job.progress = 10
    session.add(job)
    await session.commit()

    try:
        if job.job_type == JobType.to_markdown:
            assert job.input_path
            markdown, title = await converter.to_markdown(
                Path(job.input_path), job.original_filename
            )
            job.progress = 80
            out_name = f"{Path(job.input_path).stem}.md"
            out_path = settings.output_dir / out_name
            out_path.write_text(markdown, encoding="utf-8")
            job.output_path = str(out_path)
            job.output_format = "md"
            job.title = title
            job.result_preview = markdown[:4000]
            job.file_size = len(markdown.encode("utf-8"))
            job.content_type = "text/markdown"
        else:
            assert job.input_path and job.output_format
            markdown = Path(job.input_path).read_text(encoding="utf-8")
            _, ext = normalize_output_format(job.output_format)
            out_name = f"{Path(job.original_filename).stem or 'export'}.{ext}"
            out_path = settings.output_dir / out_name
            await converter.from_markdown(markdown, job.output_format, out_path)
            job.progress = 90
            job.output_path = str(out_path)
            job.file_size = out_path.stat().st_size
            job.content_type = "application/octet-stream"

        job.status = JobStatus.succeeded
        job.progress = 100
        job.finished_at = datetime.now(timezone.utc)
    except (ConversionError, ValueError, RuntimeError) as e:
        job.status = JobStatus.failed
        job.error_message = str(e)
        job.finished_at = datetime.now(timezone.utc)
        job.progress = 100
    except Exception as e:
        job.status = JobStatus.failed
        job.error_message = f"转换失败: {e}"
        job.finished_at = datetime.now(timezone.utc)
        job.progress = 100

    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job
