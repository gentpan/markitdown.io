"""FastAPI 主应用"""
import os
import shutil
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    APP_NAME, DEBUG, MAX_FILE_SIZE, HOST, PORT,
    UPLOAD_DIR, OUTPUT_DIR, BASE_DIR, CORS_ORIGINS
)
from app.converter import ConversionError, converter, normalize_output_format
from app.file_types import EXPORT_FORMATS
from app.api_docs import router as docs_router
from app.admin import router as admin_router
from app.scheduler import start_scheduler, stop_scheduler

app = FastAPI(
    title=APP_NAME,
    description="基于 Microsoft MarkItDown 的文件转换服务",
    version="1.0.0",
    debug=DEBUG
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials="*" not in CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# API 文档路由
app.include_router(docs_router)

# 管理后台路由
app.include_router(admin_router)


# ============ 生命周期事件 ============

@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    # 启动自动更新调度器
    await start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    # 停止调度器
    await stop_scheduler()


# ============ 工具函数 ============

def cleanup_old_files(directory: Path, max_age_hours: int = 24):
    """清理旧文件"""
    now = datetime.now()
    for file_path in directory.iterdir():
        if file_path.is_file():
            file_age = now - datetime.fromtimestamp(file_path.stat().st_mtime)
            if file_age.total_seconds() > max_age_hours * 3600:
                file_path.unlink()


def generate_unique_filename(original_name: str) -> str:
    """生成唯一文件名"""
    ext = Path(original_name).suffix
    return f"{uuid.uuid4().hex}{ext}"


def is_markdown_filename(filename: str) -> bool:
    return Path(filename).suffix.lower() in {".md", ".markdown", ".mkd"}


def resolve_output_file(filename: str) -> Path:
    """Resolve a downloadable file and keep access inside OUTPUT_DIR."""
    output_root = OUTPUT_DIR.resolve()
    file_path = (output_root / Path(filename).name).resolve()
    if file_path.parent != output_root:
        raise HTTPException(status_code=400, detail="非法文件名")
    return file_path


# ============ 前端路由 ============

@app.get("/", response_class=HTMLResponse)
async def index():
    """主页"""
    html_file = BASE_DIR / "templates" / "index.html"
    if html_file.exists():
        return html_file.read_text(encoding="utf-8")
    return {"message": "MarkItDown Web API"}


# ============ API 路由 ============

@app.get("/api/formats")
async def get_supported_formats():
    """获取支持的文件格式"""
    return {
        **converter.get_supported_formats(),
        "export": EXPORT_FORMATS,
    }


@app.post("/api/convert/to-markdown")
async def convert_to_markdown(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    preserve_files: bool = Form(False)
):
    """
    将文件转换为 Markdown
    
    - **file**: 要转换的文件
    - **preserve_files**: 是否保留上传的文件（默认删除）
    """
    # 检查文件大小
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"文件过大，最大支持 {MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    # 检查文件类型
    original_filename = file.filename or ""
    if not converter.is_supported(original_filename):
        supported = converter.get_supported_formats()["all"]
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。支持的类型: {', '.join(supported[:10])}..."
        )
    
    # 保存上传的文件
    unique_name = generate_unique_filename(original_filename)
    upload_path = UPLOAD_DIR / unique_name
    
    try:
        with open(upload_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # 转换为 Markdown
        markdown_content, title = await converter.to_markdown(upload_path)
        
        # 保存 Markdown 文件
        md_filename = f"{Path(unique_name).stem}.md"
        md_path = OUTPUT_DIR / md_filename
        md_path.write_text(markdown_content, encoding="utf-8")
        
        # 清理上传文件
        if not preserve_files:
            background_tasks.add_task(upload_path.unlink, missing_ok=True)
        
        # 清理旧文件
        background_tasks.add_task(cleanup_old_files, UPLOAD_DIR)
        background_tasks.add_task(cleanup_old_files, OUTPUT_DIR)
        
        return {
            "success": True,
            "title": title,
            "filename": original_filename,
            "markdown": markdown_content,
            "download_url": f"/api/download/{md_filename}",
            "file_size": len(markdown_content.encode("utf-8")),
            "source_type": "markdown" if is_markdown_filename(original_filename) else "input"
        }
        
    except ConversionError as e:
        if upload_path.exists():
            upload_path.unlink()
        raise HTTPException(status_code=400, detail=f"转换失败: {str(e)}")
    except Exception as e:
        # 清理上传文件
        if upload_path.exists():
            upload_path.unlink()
        raise HTTPException(status_code=500, detail=f"转换失败: {str(e)}")


@app.post("/api/convert/from-markdown")
async def convert_from_markdown(
    background_tasks: BackgroundTasks,
    markdown: str = Form(...),
    output_format: str = Form("docx"),
    filename: Optional[str] = Form(None)
):
    """
    将 Markdown 转换为其他格式（Pandoc 回转）
    
    - **markdown**: Markdown 内容
    - **output_format**: 导出格式；可用值见 /api/formats 返回的 export 列表
    - **filename**: 可选的自定义文件名
    """
    try:
        _, ext = normalize_output_format(output_format)
        base_name = filename or f"converted_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        base_name = Path(base_name).stem  # 移除扩展名
        
        output_filename = f"{base_name}.{ext}"
        output_path = OUTPUT_DIR / output_filename
        
        # 执行转换
        result_path = await converter.from_markdown(
            markdown, 
            output_format, 
            output_path
        )
        
        # 清理旧文件
        background_tasks.add_task(cleanup_old_files, OUTPUT_DIR)
        
        return {
            "success": True,
            "filename": output_filename,
            "download_url": f"/api/download/{output_filename}",
            "file_size": result_path.stat().st_size
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"转换失败: {str(e)}")


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """下载转换后的文件"""
    file_path = resolve_output_file(filename)
    
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    
    # 确定 MIME 类型
    mime_types = {
        ".md": "text/markdown",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pdf": "application/pdf",
        ".html": "text/html",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".txt": "text/plain",
    }
    
    ext = Path(filename).suffix.lower()
    media_type = mime_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )


@app.post("/api/batch/convert")
async def batch_convert(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """
    批量转换文件
    
    - **files**: 多个要转换的文件
    """
    results = []
    errors = []
    
    for file in files[:10]:  # 限制最多 10 个文件
        try:
            result = await convert_to_markdown(background_tasks, file, preserve_files=False)
            results.append(result)
        except HTTPException as e:
            errors.append({"filename": file.filename, "error": e.detail})
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "success": len(errors) == 0,
        "converted": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors
    }


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": "1.0.0"
    }


# ============ 启动 ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )
