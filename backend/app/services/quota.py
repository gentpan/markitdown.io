from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import get_settings
from app.core.redis import get_redis
from app.models.usage import UsageEvent
from app.models.user import User
from app.schemas.jobs import QuotaStatus

settings = get_settings()


def _day_key(subject: str) -> str:
    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"quota:day:{day}:{subject}"


def _hour_key(subject: str) -> str:
    hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    return f"rate:hour:{hour}:{subject}"


async def check_and_consume(
    *,
    session: AsyncSession,
    subject: str,
    user: Optional[User] = None,
    api_key_id: Optional[UUID] = None,
    client_ip: Optional[str] = None,
    job_id: Optional[UUID] = None,
    action: str = "convert",
) -> QuotaStatus:
    """Redis 限流 + 日额度检查，通过后记一次 usage。"""
    redis = get_redis()
    daily_quota = user.daily_quota if user else settings.free_quota_per_day
    rate_limit = settings.rate_limit_per_hour
    plan = user.plan if user else settings.default_plan

    hour_key = _hour_key(subject)
    day_key = _day_key(subject)

    rate_used = await redis.incr(hour_key)
    if rate_used == 1:
        await redis.expire(hour_key, 3600)
    if rate_used > rate_limit:
        await redis.decr(hour_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"每小时限流 {rate_limit} 次，请稍后再试",
        )

    used_today = await redis.incr(day_key)
    if used_today == 1:
        await redis.expire(day_key, 86400)
    if used_today > daily_quota:
        await redis.decr(day_key)
        await redis.decr(hour_key)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"今日额度已用完（{daily_quota} 次），请升级套餐",
        )

    session.add(
        UsageEvent(
            user_id=user.id if user else None,
            api_key_id=api_key_id,
            client_ip=client_ip,
            job_id=job_id,
            action=action,
            units=1,
        )
    )
    await session.commit()

    return QuotaStatus(
        plan=plan,
        used_today=used_today,
        daily_quota=daily_quota,
        remaining=max(daily_quota - used_today, 0),
        rate_limit_per_hour=rate_limit,
        rate_used_hour=rate_used,
    )


async def get_quota_status(
    *,
    subject: str,
    user: Optional[User] = None,
) -> QuotaStatus:
    redis = get_redis()
    daily_quota = user.daily_quota if user else settings.free_quota_per_day
    used_raw = await redis.get(_day_key(subject))
    rate_raw = await redis.get(_hour_key(subject))
    used_today = int(used_raw or 0)
    rate_used = int(rate_raw or 0)
    return QuotaStatus(
        plan=user.plan if user else settings.default_plan,
        used_today=used_today,
        daily_quota=daily_quota,
        remaining=max(daily_quota - used_today, 0),
        rate_limit_per_hour=settings.rate_limit_per_hour,
        rate_used_hour=rate_used,
    )
