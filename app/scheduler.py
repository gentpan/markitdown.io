"""
定时任务调度器 - 可配置的 MarkItDown 自动检查/更新
默认每周检查一次；可通过环境变量或管理后台修改。
"""
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.config import (
    AUTO_UPDATE,
    SCHEDULER_CONFIG_PATH,
    UPDATE_CHECK_ENABLED,
    UPDATE_CHECK_INTERVAL_HOURS,
)
from app.updater import updater

logger = logging.getLogger(__name__)


class UpdateScheduler:
    """自动更新调度器"""

    def __init__(self):
        self.running = False
        self.task: Optional[asyncio.Task] = None
        self.enabled = UPDATE_CHECK_ENABLED
        self.check_interval_hours = max(1, UPDATE_CHECK_INTERVAL_HOURS)
        self.auto_update = AUTO_UPDATE
        self.last_check: Optional[datetime] = None
        self.last_result: Optional[Dict[str, Any]] = None
        self._load_persisted_config()

    def _load_persisted_config(self):
        """从 updates/scheduler_config.json 加载覆盖配置"""
        if not SCHEDULER_CONFIG_PATH.exists():
            return
        try:
            data = json.loads(SCHEDULER_CONFIG_PATH.read_text(encoding="utf-8"))
            if "enabled" in data:
                self.enabled = bool(data["enabled"])
            if "check_interval_hours" in data:
                self.check_interval_hours = max(1, int(data["check_interval_hours"]))
            if "auto_update" in data:
                self.auto_update = bool(data["auto_update"])
            if data.get("last_check"):
                self.last_check = datetime.fromisoformat(data["last_check"])
        except Exception as e:
            logger.warning(f"读取调度配置失败: {e}")

    def _persist_config(self):
        payload = {
            "enabled": self.enabled,
            "check_interval_hours": self.check_interval_hours,
            "auto_update": self.auto_update,
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "updated_at": datetime.now().isoformat(),
        }
        SCHEDULER_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        SCHEDULER_CONFIG_PATH.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    async def start(self):
        if self.running:
            return
        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
        logger.info(
            "自动更新调度器已启动: enabled=%s interval=%sh auto_update=%s",
            self.enabled,
            self.check_interval_hours,
            self.auto_update,
        )

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("自动更新调度器已停止")

    async def _scheduler_loop(self):
        # 启动后：若距上次检查未满间隔，则先睡到下次；否则立即检查
        while self.running:
            try:
                wait_seconds = self._seconds_until_next_check()
                if wait_seconds > 0:
                    logger.info("距下次版本检查还有 %.1f 小时", wait_seconds / 3600)
                    await asyncio.sleep(wait_seconds)

                if not self.running:
                    break

                if self.enabled:
                    await self._do_check()
                else:
                    logger.info("版本检查已禁用，跳过本次")
                    # 禁用时也推进 last_check，避免忙等；用最小 1h 节流
                    self.last_check = datetime.now()
                    self._persist_config()
                    await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"调度器错误: {e}")
                await asyncio.sleep(3600)

    def _seconds_until_next_check(self) -> float:
        if not self.last_check:
            return 0
        next_check = self.last_check + timedelta(hours=self.check_interval_hours)
        return max(0.0, (next_check - datetime.now()).total_seconds())

    async def _do_check(self):
        self.last_check = datetime.now()
        self._persist_config()

        logger.info("开始检查 MarkItDown 更新...")
        result = await updater.check_update()
        self.last_result = result

        if not result.get("success"):
            logger.error(f"检查更新失败: {result.get('error')}")
            return

        logger.info(
            "当前版本: %s, 最新版本: %s",
            result["current_version"],
            result["latest_version"],
        )

        if result.get("update_available"):
            logger.info(f"发现新版本: {result['latest_version']}")
            if self.auto_update:
                logger.info("自动更新已启用，开始执行更新...")
                update_result = await updater.perform_update()
                self.last_result = {**result, "update_result": update_result}
                if update_result.get("success"):
                    logger.info("更新成功，准备重启服务...")
                    restart_result = await updater.restart_service()
                    if restart_result.get("success"):
                        logger.info("服务已重启")
                    else:
                        logger.error(f"服务重启失败: {restart_result.get('error')}")
                else:
                    logger.error(f"更新失败: {update_result.get('error')}")
            else:
                logger.info("自动更新已禁用，仅记录有新版本（可在管理后台手动更新）")
        else:
            logger.info("当前已是最新版本")

    def configure(
        self,
        enabled: Optional[bool] = None,
        check_interval_hours: Optional[int] = None,
        auto_update: Optional[bool] = None,
        persist: bool = True,
    ) -> Dict[str, Any]:
        if enabled is not None:
            self.enabled = bool(enabled)
        if check_interval_hours is not None:
            self.check_interval_hours = max(1, int(check_interval_hours))
        if auto_update is not None:
            self.auto_update = bool(auto_update)
        if persist:
            self._persist_config()
        logger.info(
            "调度器配置更新: enabled=%s interval=%sh auto_update=%s",
            self.enabled,
            self.check_interval_hours,
            self.auto_update,
        )
        return self.get_status()

    def get_status(self) -> dict:
        return {
            "running": self.running,
            "enabled": self.enabled,
            "check_interval_hours": self.check_interval_hours,
            "check_interval_days": round(self.check_interval_hours / 24, 2),
            "auto_update": self.auto_update,
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "next_check": self._calculate_next_check(),
            "last_result": self.last_result,
            "config_path": str(SCHEDULER_CONFIG_PATH),
        }

    def _calculate_next_check(self) -> Optional[str]:
        if not self.enabled:
            return None
        if not self.last_check:
            return "即将检查"
        next_check = self.last_check + timedelta(hours=self.check_interval_hours)
        return next_check.isoformat()


scheduler = UpdateScheduler()


async def start_scheduler():
    """启动调度器（在应用启动时调用）"""
    # 环境变量作为初始默认；若已有持久化配置则已被加载
    if not SCHEDULER_CONFIG_PATH.exists():
        scheduler.configure(
            enabled=UPDATE_CHECK_ENABLED,
            check_interval_hours=UPDATE_CHECK_INTERVAL_HOURS,
            auto_update=AUTO_UPDATE,
            persist=True,
        )
    await scheduler.start()


async def stop_scheduler():
    await scheduler.stop()
