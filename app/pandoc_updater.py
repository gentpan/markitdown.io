"""
Pandoc 自动更新系统
监控 GitHub 版本，自动下载更新
"""
import os
import re
import platform
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import aiohttp
import aiofiles

from app.config import BASE_DIR


class PandocUpdater:
    """Pandoc 自动更新管理器"""
    
    GITHUB_REPO = "jgm/pandoc"
    GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}"
    
    def __init__(self):
        # 平台检测（必须在其他操作之前）
        self.system = platform.system().lower()
        self.machine = platform.machine().lower()
        
        # 目录
        self.bin_dir = BASE_DIR / "bin"
        self.linux_dir = self.bin_dir / "linux"
        self.backup_dir = BASE_DIR / "backups" / "pandoc"
        
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        
        self.current_version = self._get_current_version()
        self.latest_version: Optional[str] = None
        self.update_available = False
        self.is_updating = False
        self.update_log: list = []
    
    def _get_current_version(self) -> str:
        """获取当前 Pandoc 版本"""
        try:
            pandoc_path = self._get_pandoc_path()
            if pandoc_path:
                result = subprocess.run(
                    [str(pandoc_path), "--version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    # 第一行格式: pandoc 3.9
                    match = re.search(r'pandoc\s+(\d+\.\d+(?:\.\d+)?)', result.stdout)
                    if match:
                        return match.group(1)
        except Exception as e:
            print(f"获取 Pandoc 版本失败: {e}")
        
        return "3.9"  # 默认版本
    
    def _get_pandoc_path(self) -> Optional[Path]:
        """获取当前使用的 pandoc 路径"""
        if self.system == "darwin":
            path = self.bin_dir / "pandoc"
        else:
            path = self.linux_dir / "pandoc"
        
        return path if path.exists() else None
    
    def _get_download_url(self, version: str) -> str:
        """获取下载链接"""
        base_url = f"https://github.com/{self.GITHUB_REPO}/releases/download/{version}"
        
        if self.system == "darwin":
            if "arm" in self.machine:
                return f"{base_url}/pandoc-{version}-arm64-macOS.zip"
            else:
                return f"{base_url}/pandoc-{version}-x86_64-macOS.zip"
        else:  # Linux
            if "arm" in self.machine or "aarch64" in self.machine:
                return f"{base_url}/pandoc-{version}-linux-arm64.tar.gz"
            else:
                return f"{base_url}/pandoc-{version}-linux-amd64.tar.gz"
    
    def _compare_versions(self, v1: str, v2: str) -> bool:
        """比较版本号"""
        def parse(v):
            parts = re.sub(r'[^0-9.]', '', v).split('.')
            return [int(p) if p.isdigit() else 0 for p in parts]
        
        try:
            return parse(v1) > parse(v2)
        except:
            return v1 != v2
    
    async def check_update(self) -> Dict[str, Any]:
        """检查 Pandoc 更新"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.GITHUB_API_URL}/releases/latest",
                    headers={"Accept": "application/vnd.github.v3+json"}
                ) as response:
                    if response.status != 200:
                        return {"success": False, "error": f"GitHub API 错误: {response.status}"}
                    
                    data = await response.json()
                    self.latest_version = data["tag_name"]
                    
                    self.update_available = self._compare_versions(
                        self.latest_version, 
                        self.current_version
                    )
                    
                    return {
                        "success": True,
                        "current_version": self.current_version,
                        "latest_version": self.latest_version,
                        "update_available": self.update_available,
                        "platform": f"{self.system} {self.machine}",
                        "download_url": self._get_download_url(self.latest_version),
                        "release_notes": data.get("body", "")[:500],
                        "published_at": data.get("published_at", "")
                    }
                    
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def perform_update(self) -> Dict[str, Any]:
        """执行更新"""
        if self.is_updating:
            return {"success": False, "error": "更新正在进行中"}
        
        if not self.update_available:
            check_result = await self.check_update()
            if not check_result.get("update_available"):
                return {"success": False, "error": "没有可用更新"}
        
        self.is_updating = True
        self.update_log = []
        
        try:
            self._log(f"开始更新 Pandoc 到 {self.latest_version}")
            
            # 1. 备份
            self._log("备份当前版本...")
            await self._backup_current()
            
            # 2. 下载
            self._log("下载新版本...")
            download_path = await self._download_latest()
            
            # 3. 安装
            self._log("安装新版本...")
            await self._install_update(download_path)
            
            # 4. 验证
            self._log("验证安装...")
            new_version = self._get_current_version()
            if new_version == self.latest_version:
                self._log(f"验证成功: {new_version}")
                self.current_version = new_version
                self.update_available = False
                
                return {
                    "success": True,
                    "version": new_version,
                    "log": self.update_log
                }
            else:
                raise Exception(f"版本验证失败: 期望 {self.latest_version}, 实际 {new_version}")
                
        except Exception as e:
            self._log(f"更新失败: {e}")
            await self._rollback()
            return {"success": False, "error": str(e), "log": self.update_log}
        finally:
            self.is_updating = False
    
    def _log(self, message: str):
        """记录日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.update_log.append(log_entry)
        print(f"[PandocUpdater] {message}")
    
    async def _backup_current(self):
        """备份当前版本"""
        pandoc_path = self._get_pandoc_path()
        if pandoc_path and pandoc_path.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"pandoc_{self.current_version}_{timestamp}"
            shutil.copy2(pandoc_path, backup_path)
            self._log(f"已备份到: {backup_path}")
    
    async def _download_latest(self) -> Path:
        """下载最新版本"""
        url = self._get_download_url(self.latest_version)
        ext = ".zip" if "macOS" in url else ".tar.gz"
        
        download_path = BASE_DIR / "updates" / f"pandoc-{self.latest_version}{ext}"
        download_path.parent.mkdir(exist_ok=True)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"下载失败: {response.status}")
                
                content = await response.read()
                async with aiofiles.open(download_path, 'wb') as f:
                    await f.write(content)
        
        self._log(f"下载完成: {download_path}")
        return download_path
    
    async def _install_update(self, download_path: Path):
        """安装更新"""
        import zipfile
        import tarfile
        
        extract_dir = BASE_DIR / "updates" / f"pandoc-extract-{self.latest_version}"
        extract_dir.mkdir(exist_ok=True)
        
        # 解压
        if download_path.suffix == ".zip":
            with zipfile.ZipFile(download_path, 'r') as zf:
                zf.extractall(extract_dir)
        else:
            with tarfile.open(download_path, 'r:gz') as tf:
                tf.extractall(extract_dir)
        
        # 找到 pandoc 二进制文件
        pandoc_bin = None
        for path in extract_dir.rglob("pandoc"):
            if path.is_file():
                pandoc_bin = path
                break
        
        if not pandoc_bin:
            raise Exception("解压后找不到 pandoc 二进制文件")
        
        # 替换
        target_path = self._get_pandoc_path()
        if target_path and target_path.exists():
            target_path.unlink()
        
        shutil.copy2(pandoc_bin, target_path)
        os.chmod(target_path, 0o755)
        
        self._log(f"已安装到: {target_path}")
        
        # 清理
        shutil.rmtree(extract_dir)
        download_path.unlink()
    
    async def _rollback(self):
        """回滚"""
        backups = sorted(self.backup_dir.glob("pandoc_*"), key=lambda x: x.stat().st_mtime, reverse=True)
        if backups:
            backup = backups[0]
            target = self._get_pandoc_path()
            if target:
                shutil.copy2(backup, target)
                self._log(f"已回滚到: {backup.name}")
    
    def get_backups(self) -> list:
        """获取备份列表"""
        backups = []
        for backup in sorted(self.backup_dir.glob("pandoc_*"), key=lambda x: x.stat().st_mtime, reverse=True):
            stat = backup.stat()
            backups.append({
                "name": backup.name,
                "created": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "size": stat.st_size
            })
        return backups


# 全局实例
pandoc_updater = PandocUpdater()
