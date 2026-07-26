"""
MarkItDown 自动更新系统
优先走 PyPI 版本检查 + pip 安装；可选同步 GitHub 源码到本地目录。
"""
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime
from importlib import metadata
from pathlib import Path
from typing import Any, Dict, Optional

import aiofiles
import aiohttp

from app.config import BACKUPS_DIR, BASE_DIR, MARKITDOWN_PACKAGE_SPEC, UPDATES_DIR


class AutoUpdater:
    """自动更新管理器"""

    GITHUB_REPO = "microsoft/markitdown"
    GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}"
    PYPI_URL = "https://pypi.org/pypi/markitdown/json"

    def __init__(self):
        self.current_version = self._get_current_version()
        self.latest_version: Optional[str] = None
        self.update_available = False
        self.is_updating = False
        self.update_log: list = []
        self.release_notes = ""
        self.release_url = ""

        self.update_dir = UPDATES_DIR
        self.backup_dir = BACKUPS_DIR
        self.markitdown_path = self._resolve_markitdown_path()

        self.update_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)

    def _resolve_markitdown_path(self) -> Path:
        """Resolve the vendored markitdown source directory if present."""
        preferred = BASE_DIR / "markitdown-0.1.5"
        if preferred.exists():
            return preferred
        candidates = sorted(BASE_DIR.glob("markitdown-*"), reverse=True)
        return candidates[0] if candidates else preferred

    def _get_current_version(self) -> str:
        """获取当前已安装的 markitdown 版本"""
        try:
            return metadata.version("markitdown")
        except metadata.PackageNotFoundError:
            pass

        # 兼容旧的本地源码目录
        for version_file in BASE_DIR.glob(
            "markitdown-*/packages/markitdown/src/markitdown/__about__.py"
        ):
            try:
                content = version_file.read_text(encoding="utf-8")
                match = re.search(r'__version__\s*=\s*["\'](.+?)["\']', content)
                if match:
                    return match.group(1)
            except OSError:
                continue

        return "0.0.0"

    def refresh_current_version(self) -> str:
        self.current_version = self._get_current_version()
        return self.current_version

    async def check_update(self) -> Dict[str, Any]:
        """检查是否有新版本（PyPI 优先，GitHub 补充发布说明）"""
        try:
            pypi_info = await self._fetch_pypi_latest()
            github_info = await self._fetch_github_latest()

            latest = pypi_info.get("version") or github_info.get("version")
            if not latest:
                return {
                    "success": False,
                    "error": pypi_info.get("error")
                    or github_info.get("error")
                    or "无法获取最新版本",
                }

            self.latest_version = latest.lstrip("v")
            self.current_version = self._get_current_version()
            self.update_available = self._compare_versions(
                self.latest_version, self.current_version
            )
            self.release_url = (
                github_info.get("release_url")
                or f"https://pypi.org/project/markitdown/{self.latest_version}/"
            )
            self.release_notes = github_info.get("release_notes") or pypi_info.get(
                "summary", ""
            )

            return {
                "success": True,
                "current_version": self.current_version,
                "latest_version": self.latest_version,
                "update_available": self.update_available,
                "release_url": self.release_url,
                "release_notes": (self.release_notes or "")[:500],
                "published_at": github_info.get("published_at")
                or pypi_info.get("published_at", ""),
                "source": "pypi" if pypi_info.get("version") else "github",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _fetch_pypi_latest(self) -> Dict[str, Any]:
        try:
            timeout = aiohttp.ClientTimeout(total=20)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(self.PYPI_URL) as response:
                    if response.status != 200:
                        return {"error": f"PyPI 错误: {response.status}"}
                    data = await response.json()
                    version = data["info"]["version"]
                    urls = data.get("releases", {}).get(version, [])
                    published_at = urls[0].get("upload_time_iso_8601", "") if urls else ""
                    return {
                        "version": version,
                        "summary": data["info"].get("summary", ""),
                        "published_at": published_at,
                    }
        except Exception as e:
            return {"error": f"PyPI: {e}"}

    async def _fetch_github_latest(self) -> Dict[str, Any]:
        try:
            timeout = aiohttp.ClientTimeout(total=20)
            headers = {"Accept": "application/vnd.github.v3+json"}
            token = os.getenv("GITHUB_TOKEN", "").strip()
            if token:
                headers["Authorization"] = f"Bearer {token}"

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(
                    f"{self.GITHUB_API_URL}/releases/latest", headers=headers
                ) as response:
                    if response.status != 200:
                        return {"error": f"GitHub API 错误: {response.status}"}
                    data = await response.json()
                    return {
                        "version": data["tag_name"].lstrip("v"),
                        "release_url": data.get("html_url", ""),
                        "release_notes": data.get("body", "") or "",
                        "published_at": data.get("published_at", ""),
                    }
        except Exception as e:
            return {"error": f"GitHub: {e}"}

    def _compare_versions(self, v1: str, v2: str) -> bool:
        """比较版本号，v1 > v2 返回 True"""

        def parse_version(v: str):
            cleaned = re.sub(r"[^0-9.]", ".", v)
            parts = [p for p in cleaned.split(".") if p != ""]
            return [int(p) if p.isdigit() else 0 for p in parts]

        try:
            return parse_version(v1) > parse_version(v2)
        except Exception:
            return v1 != v2

    async def perform_update(self) -> Dict[str, Any]:
        """执行更新：pip 安装最新版，并尽量同步本地源码目录"""
        if self.is_updating:
            return {"success": False, "error": "更新正在进行中"}

        if not self.update_available or not self.latest_version:
            check_result = await self.check_update()
            if not check_result.get("update_available"):
                return {
                    "success": False,
                    "error": check_result.get("error") or "没有可用更新",
                }

        self.is_updating = True
        self.update_log = []

        try:
            self._log(f"开始更新到版本 {self.latest_version}")

            self._log("记录当前版本信息...")
            backup_meta = await self._backup_current_meta()
            self._log(f"备份元数据: {backup_meta}")

            self._log(f"通过 pip 安装 {MARKITDOWN_PACKAGE_SPEC}=={self.latest_version}")
            await self._pip_install(self.latest_version)
            self._log("pip 安装完成")

            # 尝试同步 GitHub 源码到本地目录（失败不阻断）
            try:
                self._log("同步本地源码目录...")
                download_path = await self._download_latest()
                await self._install_source_tree(download_path)
                self._log("本地源码同步完成")
            except Exception as e:
                self._log(f"本地源码同步跳过: {e}")

            self._log("验证安装...")
            if not await self._verify_installation():
                raise RuntimeError("验证失败")

            self.current_version = self._get_current_version()
            self.update_available = False
            self._log(f"更新成功，当前版本: {self.current_version}")

            return {
                "success": True,
                "version": self.current_version,
                "backup_path": str(backup_meta),
                "log": self.update_log,
            }
        except Exception as e:
            self._log(f"更新失败: {e}")
            return {"success": False, "error": str(e), "log": self.update_log}
        finally:
            self.is_updating = False

    def _log(self, message: str):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.update_log.append(log_entry)
        print(log_entry)

    async def _backup_current_meta(self) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"markitdown_{self.current_version}_{timestamp}.json"
        payload = {
            "version": self.current_version,
            "timestamp": timestamp,
            "python": sys.executable,
            "package_spec": MARKITDOWN_PACKAGE_SPEC,
        }
        async with aiofiles.open(backup_path, "w", encoding="utf-8") as f:
            await f.write(json.dumps(payload, ensure_ascii=False, indent=2))

        if self.markitdown_path.exists():
            tree_backup = self.backup_dir / f"markitdown_{self.current_version}_{timestamp}"
            await asyncio.to_thread(shutil.copytree, self.markitdown_path, tree_backup)
        return backup_path

    async def _pip_install(self, version: str):
        python = self._python_executable()
        package = f"{MARKITDOWN_PACKAGE_SPEC}=={version}"
        cmd = [
            str(python),
            "-m",
            "pip",
            "install",
            "--upgrade",
            "--pre",
            package,
        ]
        result = await asyncio.to_thread(
            subprocess.run,
            cmd,
            capture_output=True,
            text=True,
            cwd=str(BASE_DIR),
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "pip 安装失败")

    def _python_executable(self) -> Path:
        venv_python = BASE_DIR / "venv311" / "bin" / "python"
        if venv_python.exists():
            return venv_python
        return Path(sys.executable)

    async def _download_latest(self) -> Path:
        download_url = (
            f"https://github.com/{self.GITHUB_REPO}/archive/refs/tags/"
            f"v{self.latest_version}.zip"
        )
        zip_path = self.update_dir / f"markitdown-{self.latest_version}.zip"
        timeout = aiohttp.ClientTimeout(total=120)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(download_url) as response:
                if response.status != 200:
                    raise RuntimeError(f"下载失败: {response.status}")
                content = await response.read()
                async with aiofiles.open(zip_path, "wb") as f:
                    await f.write(content)
        return zip_path

    async def _install_source_tree(self, zip_path: Path):
        extract_dir = self.update_dir / f"extract_{self.latest_version}"
        if extract_dir.exists():
            shutil.rmtree(extract_dir)
        extract_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        extracted_dirs = list(extract_dir.glob("markitdown-*"))
        if not extracted_dirs:
            raise RuntimeError("解压后找不到 markitdown 目录")

        source_dir = extracted_dirs[0]
        target = BASE_DIR / f"markitdown-{self.latest_version}"

        if target.exists():
            shutil.rmtree(target)
        shutil.move(str(source_dir), str(target))

        # 保持旧路径兼容：若仍使用 markitdown-0.1.5，同步一份软链接/复制
        legacy = BASE_DIR / "markitdown-0.1.5"
        if legacy.exists() or self.markitdown_path == legacy:
            if legacy.exists() or legacy.is_symlink():
                if legacy.is_symlink() or legacy.is_file():
                    legacy.unlink()
                else:
                    shutil.rmtree(legacy)
            shutil.copytree(target, legacy)

        self.markitdown_path = target
        shutil.rmtree(extract_dir, ignore_errors=True)
        zip_path.unlink(missing_ok=True)

    async def _verify_installation(self) -> bool:
        try:
            python = self._python_executable()
            result = await asyncio.to_thread(
                subprocess.run,
                [
                    str(python),
                    "-c",
                    (
                        "from importlib.metadata import version; "
                        "from markitdown import MarkItDown; "
                        f"assert version('markitdown') == '{self.latest_version}'; "
                        "MarkItDown(); print('OK')"
                    ),
                ],
                capture_output=True,
                text=True,
                cwd=str(BASE_DIR),
            )
            ok = result.returncode == 0 and "OK" in result.stdout
            if not ok:
                self._log((result.stderr or result.stdout or "验证失败").strip())
            return ok
        except Exception as e:
            self._log(f"验证失败: {e}")
            return False

    async def restart_service(self) -> Dict[str, Any]:
        """重启服务"""
        try:
            self._log("正在重启服务...")
            python = self._python_executable()
            restart_script = BASE_DIR / "restart.sh"
            restart_script.write_text(
                f"""#!/bin/bash
cd "{BASE_DIR}"
pkill -f "uvicorn app.main:app" || true
sleep 2
nohup "{python}" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/uvicorn.log 2>&1 &
sleep 2
echo "服务已重启"
""",
                encoding="utf-8",
            )
            restart_script.chmod(0o755)
            subprocess.Popen(
                ["bash", str(restart_script)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return {"success": True, "message": "服务重启命令已发送"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_update_history(self) -> list:
        backups = []
        for backup in sorted(
            self.backup_dir.glob("markitdown_*"),
            key=lambda x: x.stat().st_mtime,
            reverse=True,
        ):
            stat = backup.stat()
            backups.append(
                {
                    "name": backup.name,
                    "path": str(backup),
                    "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "size": stat.st_size,
                }
            )
        return backups


updater = AutoUpdater()
