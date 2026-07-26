"""应用配置"""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# 基础路径
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPDATES_DIR = BASE_DIR / "updates"
BACKUPS_DIR = BASE_DIR / "backups"
SCHEDULER_CONFIG_PATH = UPDATES_DIR / "scheduler_config.json"

# 确保目录存在
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
UPDATES_DIR.mkdir(exist_ok=True)
BACKUPS_DIR.mkdir(exist_ok=True)

# 应用配置
APP_NAME = os.getenv("APP_NAME", "MarkItDown Web")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50")) * 1024 * 1024  # 转换为字节
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

# MarkItDown 自动更新（环境变量为默认值；管理后台可覆盖并持久化）
# UPDATE_CHECK_INTERVAL_HOURS 默认 168 = 每周一次
UPDATE_CHECK_ENABLED = os.getenv("UPDATE_CHECK_ENABLED", "true").lower() == "true"
UPDATE_CHECK_INTERVAL_HOURS = int(os.getenv("UPDATE_CHECK_INTERVAL_HOURS", "168"))
AUTO_UPDATE = os.getenv("AUTO_UPDATE", "false").lower() == "true"
MARKITDOWN_PACKAGE_SPEC = os.getenv("MARKITDOWN_PACKAGE_SPEC", "markitdown[all]")
