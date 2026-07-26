from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UsageEvent(SQLModel, table=True):
    __tablename__ = "usage_events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: Optional[UUID] = Field(default=None, index=True, foreign_key="users.id")
    api_key_id: Optional[UUID] = Field(default=None, index=True)
    client_ip: Optional[str] = Field(default=None, max_length=64, index=True)
    job_id: Optional[UUID] = Field(default=None, index=True)
    action: str = Field(default="convert", max_length=64, index=True)
    units: int = Field(default=1)
    created_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
