"""MarkItDown + Pandoc conversion service."""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Optional

try:
    from markitdown import MarkItDown

    MARKITDOWN_AVAILABLE = True
except ImportError:
    MARKITDOWN_AVAILABLE = False

from app.core.config import BASE_DIR, get_settings
from app.services.file_types import (
    EXPORT_FORMATS,
    ConverterType,
    get_converter_for_file,
    get_pandoc_input_format,
    get_supported_extensions,
    is_supported,
)

settings = get_settings()


class ConversionError(RuntimeError):
    """Raised when a converter cannot parse a specific file."""


FORMAT_MAPPING = {item["format"]: item["writer"] for item in EXPORT_FORMATS}
OUTPUT_EXTENSIONS = {item["format"]: item["extension"] for item in EXPORT_FORMATS}
for item in EXPORT_FORMATS:
    for alias in item.get("aliases", []):
        FORMAT_MAPPING[alias] = item["writer"]
        OUTPUT_EXTENSIONS[alias] = item["extension"]


def normalize_output_format(output_format: str) -> tuple[str, str]:
    requested = output_format.lower().strip()
    if requested not in FORMAT_MAPPING:
        allowed = ", ".join(sorted(OUTPUT_EXTENSIONS))
        raise ValueError(f"不支持的导出格式: {output_format}。支持的格式: {allowed}")
    return FORMAT_MAPPING[requested], OUTPUT_EXTENSIONS[requested]


@lru_cache(maxsize=1)
def resolve_pdf_engine() -> str | None:
    """Pick an installed Pandoc PDF engine (typst preferred locally)."""
    for engine in ("typst", "pdflatex", "xelatex", "lualatex", "weasyprint", "wkhtmltopdf", "tectonic", "context"):
        if shutil.which(engine):
            return engine
    return None


class FileConverter:
    def __init__(self) -> None:
        self.md = MarkItDown() if MARKITDOWN_AVAILABLE else None
        self.pandoc_path = self._find_pandoc()

    def _find_pandoc(self) -> Optional[str]:
        candidates = [
            BASE_DIR.parent / "bin" / "pandoc",
            BASE_DIR / "bin" / "pandoc",
            Path("/opt/homebrew/bin/pandoc"),
            Path("/usr/local/bin/pandoc"),
            Path("/usr/bin/pandoc"),
        ]
        for path in candidates:
            if path.exists():
                return str(path)
        try:
            result = subprocess.run(
                ["which", "pandoc"],
                capture_output=True,
                text=True,
                check=True,
            )
            return result.stdout.strip() or None
        except Exception:
            return None

    @property
    def pandoc_available(self) -> bool:
        return self.pandoc_path is not None

    @property
    def markitdown_available(self) -> bool:
        return self.md is not None

    async def to_markdown(
        self, file_path: Path, filename: str | None = None
    ) -> tuple[str, str]:
        if filename is None:
            filename = file_path.name

        converter_type = get_converter_for_file(filename)
        if converter_type == ConverterType.PANDOC:
            pandoc_format = get_pandoc_input_format(filename)
            if pandoc_format == "markdown":
                return await self._read_markdown(file_path)
            return await self._pandoc_to_markdown(file_path, pandoc_format)
        return await self._markitdown_convert(file_path)

    async def _read_markdown(self, file_path: Path) -> tuple[str, str]:
        content = await asyncio.to_thread(
            file_path.read_text, encoding="utf-8", errors="ignore"
        )
        return content, file_path.stem

    async def _markitdown_convert(self, file_path: Path) -> tuple[str, str]:
        if not self.md:
            raise RuntimeError("MarkItDown 未安装")
        convert_fn = getattr(self.md, "convert_local", None) or self.md.convert
        result = await asyncio.to_thread(convert_fn, str(file_path))
        return result.text_content, result.title or file_path.stem

    async def _pandoc_to_markdown(
        self, file_path: Path, input_format: Optional[str]
    ) -> tuple[str, str]:
        if not self.pandoc_path:
            raise RuntimeError("Pandoc 未安装")
        if input_format is None:
            raise RuntimeError(f"无法识别 Pandoc 输入格式: {file_path.suffix}")

        cmd = [
            self.pandoc_path,
            "-f",
            input_format,
            "-t",
            "markdown",
            str(file_path),
        ]
        try:
            result = await asyncio.to_thread(
                subprocess.run, cmd, capture_output=True, text=True, check=True
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
        output_path: Optional[Path] = None,
    ) -> Path:
        if not self.pandoc_path:
            raise RuntimeError("Pandoc 未安装")

        fmt, output_ext = normalize_output_format(output_format)
        if output_path is None:
            output_path = settings.output_dir / f"converted_{os.getpid()}.{output_ext}"

        cmd = [
            self.pandoc_path,
            "-f",
            "markdown",
            "-t",
            fmt,
            "-o",
            str(output_path),
        ]
        if fmt == "pdf" or output_ext == "pdf":
            engine = resolve_pdf_engine()
            if not engine:
                raise ConversionError(
                    "未找到 PDF 引擎。请安装 typst（推荐）或 TeX（pdflatex/xelatex）。"
                )
            cmd.extend(["--pdf-engine", engine])
        try:
            await asyncio.to_thread(
                subprocess.run,
                cmd,
                input=markdown_content,
                text=True,
                capture_output=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            message = (e.stderr or e.stdout or "").strip()
            if not message:
                message = f"Pandoc 无法导出 {fmt} 格式"
            raise ConversionError(message) from e
        return output_path

    def is_supported(self, filename: str) -> bool:
        return is_supported(filename)

    def get_supported_formats(self) -> dict:
        return get_supported_extensions()


converter = FileConverter()
