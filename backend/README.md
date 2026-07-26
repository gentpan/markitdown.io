# MakeItDown Convert Service

纯转换微服务，**不拥有业务数据库**。

## 技术栈

- Python 3.12+
- FastAPI / Pydantic / aiofiles
- MarkItDown / Pandoc

用户、额度、转换历史、API Key 由前端 TanStack Start + Drizzle 管理。

## 启动

```bash
cd backend
source .venv/bin/activate
export PYTHONPATH=.
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| GET | `/api/formats` | 支持格式 |
| POST | `/api/convert/to-markdown` | 文件 → Markdown |
| POST | `/api/convert/from-markdown` | Markdown → 导出 |
| GET | `/api/download/{filename}` | 下载结果文件流 |
