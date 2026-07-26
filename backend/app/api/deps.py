from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, Header, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.db import get_session
from app.models.user import User

SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


async def get_optional_user(
    session: SessionDep,
    x_api_key: Annotated[Optional[str], Header()] = None,
) -> Optional[User]:
    """后续可扩展 JWT / API Key 鉴权；当前占位返回 None。"""
    _ = session, x_api_key
    return None


def quota_subject(
    *,
    user: Optional[User],
    api_key_id: Optional[UUID],
    client_ip: str,
) -> str:
    if user:
        return f"user:{user.id}"
    if api_key_id:
        return f"key:{api_key_id}"
    return f"ip:{client_ip}"
