from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.job import JobStatus, JobType


class JobCreateResponse(BaseModel):
    job_id: UUID
    status: JobStatus
    message: str = "任务已入队"


class JobStatusResponse(BaseModel):
    id: UUID
    status: JobStatus
    job_type: JobType
    progress: int
    original_filename: str
    output_format: Optional[str] = None
    title: Optional[str] = None
    error_message: Optional[str] = None
    result_preview: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class SyncConvertResponse(BaseModel):
    success: bool = True
    job_id: Optional[UUID] = None
    title: str
    filename: str
    markdown: str
    download_url: str
    file_size: int
    source_type: str = "input"


class ExportResponse(BaseModel):
    success: bool = True
    job_id: Optional[UUID] = None
    filename: str
    download_url: str
    file_size: int


class QuotaStatus(BaseModel):
    plan: str = "free"
    used_today: int
    daily_quota: int
    remaining: int
    rate_limit_per_hour: int
    rate_used_hour: int = 0


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str = "unknown"
    redis: str = "unknown"
    markitdown: bool = False
    pandoc: bool = False
