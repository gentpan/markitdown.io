from arq.connections import RedisSettings

from app.core.config import get_settings
from app.workers.tasks import run_conversion_job, startup, shutdown

settings = get_settings()


class WorkerSettings:
    functions = [run_conversion_job]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 4
    job_timeout = 600
    keep_result = 3600
