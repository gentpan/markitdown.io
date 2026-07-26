"""
文件转换核心逻辑 - 智能路由系统
MD → Pandoc, 其他 → MarkItDown
"""
import os
import asyncio
import subprocess
from pathlib import Path
from typing import Optional, Tuple

try:
    from markitdown import MarkItDown
    MARKITDOWN_AVAILABLE = True
except ImportError:
    MARKITDOWN_AVAILABLE = False

from app.config import OUTPUT_DIR, BASE_DIR
from app.file_types import (
    EXPORT_FORMATS,
    get_converter_for_file,
    get_pandoc_input_format,
    ConverterType,
)


class ConversionError(RuntimeError):
    """Raised when a supported converter cannot parse a specific file."""

FORMAT_MAPPING = {
    item["format"]: item["writer"]
    for item in EXPORT_FORMATS
}
OUTPUT_EXTENSIONS = {
    item["format"]: item["extension"]
    for item in EXPORT_FORMATS
}
for item in EXPORT_FORMATS:
    for alias in item.get("aliases", []):
        FORMAT_MAPPING[alias] = item["writer"]
        OUTPUT_EXTENSIONS[alias] = item["extension"]


def normalize_output_format(output_format: str) -> tuple[str, str]:
    """Return the Pandoc writer and output extension for an allowed format."""
    requested = output_format.lower().strip()
    if requested not in FORMAT_MAPPING:
        allowed = ", ".join(sorted(OUTPUT_EXTENSIONS))
        raise ValueError(f"不支持的导出格式: {output_format}。支持的格式: {allowed}")
    return FORMAT_MAPPING[requested], OUTPUT_EXTENSIONS[requested]


class FileConverter:
    """智能文件转换器：MD → Pandoc，其他 → MarkItDown"""
    
    def __init__(self):
        self.md = MarkItDown() if MARKITDOWN_AVAILABLE else None
        self.pandoc_path = self._find_pandoc()
    
    def _find_pandoc(self) -> Optional[str]:
        """查找 pandoc 可执行文件"""
        import platform
        system = platform.system().lower()
        
        # 本地 pandoc 路径
        if system == "darwin":
            local_pandoc = BASE_DIR / "bin" / "pandoc"
        else:
            local_pandoc = BASE_DIR / "bin" / "linux" / "pandoc"
        
        if local_pandoc.exists():
            return str(local_pandoc)
        
        # 系统 PATH
        try:
            result = subprocess.run(
                ["which", "pandoc"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except:
            pass
        
        # 常见路径
        common_paths = [
            "/usr/local/bin/pandoc",
            "/opt/homebrew/bin/pandoc",
            "/usr/bin/pandoc",
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    @property
    def pandoc_available(self) -> bool:
        return self.pandoc_path is not None
    
    @property
    def markitdown_available(self) -> bool:
        return self.md is not None
    
    async def to_markdown(self, file_path: Path, filename: str = None) -> Tuple[str, str]:
        """
        智能转换：根据文件类型选择转换器
        - MD 文件 → Pandoc (读取并可能处理)
        - 其他 → MarkItDown
        """
        if filename is None:
            filename = file_path.name
        
        converter_type = get_converter_for_file(filename)
        
        if converter_type == ConverterType.PANDOC:
            pandoc_format = get_pandoc_input_format(filename)
            if pandoc_format == "markdown":
                return await self._read_markdown(file_path)
            return await self._pandoc_to_markdown(file_path, pandoc_format)
        else:
            # 其他文件使用 MarkItDown
            return await self._markitdown_convert(file_path)
    
    async def _read_markdown(self, file_path: Path) -> Tuple[str, str]:
        """直接读取 Markdown 文件"""
        loop = asyncio.get_event_loop()
        content = await loop.run_in_executor(
            None,
            lambda: file_path.read_text(encoding='utf-8', errors='ignore')
        )
        return content, file_path.stem
    
    async def _markitdown_convert(self, file_path: Path) -> Tuple[str, str]:
        """使用 MarkItDown 转换"""
        if not MARKITDOWN_AVAILABLE:
            raise RuntimeError("MarkItDown 未安装")
        
        # 托管场景优先使用 convert_local，避免宽泛 convert() 访问远程 URI
        convert_fn = getattr(self.md, "convert_local", None) or self.md.convert
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            convert_fn,
            str(file_path)
        )
        
        return result.text_content, result.title or file_path.stem

    async def _pandoc_to_markdown(
        self, file_path: Path, input_format: Optional[str]
    ) -> Tuple[str, str]:
        """Use Pandoc to convert supported document formats to Markdown."""
        if not self.pandoc_available:
            raise RuntimeError("Pandoc 未安装")
        if input_format is None:
            raise RuntimeError(f"无法识别 Pandoc 输入格式: {file_path.suffix}")

        cmd = [
            self.pandoc_path,
            "-f", input_format,
            "-t", "markdown",
            str(file_path),
        ]

        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: subprocess.run(cmd, capture_output=True, text=True, check=True),
            )
        except subprocess.CalledProcessError as e:
            message = (e.stderr or e.stdout or "").strip()
            if not message:
                message = f"Pandoc 无法按 {input_format} 格式解析该文件"
            raise ConversionError(message) from e

        return result.stdout, file_path.stem
    
    async def from_markdown(
        self,
        markdown_content: str,
        output_format: str,
        output_path: Optional[Path] = None
    ) -> Path:
        """使用 Pandoc 将 Markdown 转换为其他格式"""
        if not self.pandoc_available:
            raise RuntimeError("Pandoc 未安装")
        
        fmt, output_ext = normalize_output_format(output_format)
        
        if output_path is None:
            import time
            output_path = OUTPUT_DIR / f"converted_{int(time.time())}.{output_ext}"
        
        cmd = [
            self.pandoc_path,
            "-f", "markdown",
            "-t", fmt,
            "-o", str(output_path)
        ]
        
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: subprocess.run(
                    cmd,
                    input=markdown_content,
                    text=True,
                    capture_output=True,
                    check=True,
                ),
            )
        except subprocess.CalledProcessError as e:
            message = (e.stderr or e.stdout or "").strip()
            if not message:
                message = f"Pandoc 无法导出 {fmt} 格式"
            raise ConversionError(message) from e
        
        return output_path
    
    def get_file_extension(self, filename: str) -> str:
        return Path(filename).suffix.lower()
    
    def is_supported(self, filename: str) -> bool:
        from app.file_types import is_supported
        return is_supported(filename)
    
    def get_supported_formats(self) -> dict:
        from app.file_types import get_supported_extensions
        return get_supported_extensions()


# 全局转换器实例
converter = FileConverter()
