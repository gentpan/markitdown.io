from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    succeeded = "succeeded"
    failed = "failed"
    expired = "expired"


class JobType(str, Enum):
    to_markdown = "to_markdown"
    from_markdown = "from_markdown"


class ConversionJob(SQLModel, table=True):
    __tablename__ = "conversion_jobs"

    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    user_id: Optional[UUID] = Field(default=None, index=True, foreign_key="users.id")
    api_key_id: Optional[UUID] = Field(default=None, index=True)
    client_ip: Optional[str] = Field(default=None, max_length=64)

    job_type: JobType = Field(index=True)
    status: JobStatus = Field(default=JobStatus.queued, index=True)

    original_filename: str = Field(default="", max_length=512)
    input_path: Optional[str] = Field(default=None, max_length=1024)
    output_path: Optional[str] = Field(default=None, max_length=1024)
    output_format: Optional[str] = Field(default=None, max_length=64)
    content_type: Optional[str] = Field(default=None, max_length=128)

    title: Optional[str] = Field(default=None, max_length=512)
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    result_preview: Optional[str] = Field(default=None, sa_column=Column(Text))
    file_size: Optional[int] = Field(default=None)
    progress: int = Field(default=0, ge=0, le=100)

    arq_job_id: Optional[str] = Field(default=None, max_length=128, index=True)

    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    started_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    finished_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
