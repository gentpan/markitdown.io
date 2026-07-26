from uuid import UUID

from app.core.db import SessionLocal, init_db
from app.models.job import ConversionJob, JobStatus
from app.services.cleanup import cleanup_temp_dirs
from app.services.jobs import process_job


async def startup(ctx: dict) -> None:
    await init_db()
    ctx["ready"] = True


async def shutdown(ctx: dict) -> None:
    ctx.clear()


async def run_conversion_job(ctx: dict, job_id: str) -> dict:
    async with SessionLocal() as session:
        job = await session.get(ConversionJob, UUID(job_id))
        if not job:
            return {"ok": False, "error": "job not found"}
        if job.status in {JobStatus.succeeded, JobStatus.processing}:
            return {"ok": True, "status": job.status.value, "skipped": True}

        job = await process_job(session, job)
        cleanup_temp_dirs()
        return {
            "ok": job.status == JobStatus.succeeded,
            "status": job.status.value,
            "job_id": str(job.id),
            "error": job.error_message,
        }
