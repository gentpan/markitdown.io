from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


def cleanup_old_files(directory: Path, max_age_hours: int | None = None) -> int:
    max_age = max_age_hours or settings.temp_file_ttl_hours
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age)
    removed = 0
    if not directory.exists():
        return 0
    for path in directory.iterdir():
        if not path.is_file():
            continue
        mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        if mtime < cutoff:
            path.unlink(missing_ok=True)
            removed += 1
    return removed


def cleanup_temp_dirs() -> dict[str, int]:
    return {
        "uploads": cleanup_old_files(settings.upload_dir),
        "outputs": cleanup_old_files(settings.output_dir),
    }
