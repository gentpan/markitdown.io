import uuid
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()


def unique_name(original: str) -> str:
    suffix = Path(original).suffix
    return f"{uuid.uuid4().hex}{suffix}"


def resolve_under(root: Path, filename: str) -> Path:
    target = (root / Path(filename).name).resolve()
    root_resolved = root.resolve()
    if target.parent != root_resolved:
        raise ValueError("非法文件名")
    return target
