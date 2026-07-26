# MakeItDown Web

## 技术栈

- TanStack Start（RC）+ React + TypeScript
- Tailwind CSS + shadcn/ui + Lucide
- TanStack Query
- React Dropzone + Zod
- **Drizzle ORM → PostgreSQL**（用户/额度/历史/API Key）

转换本身调用独立服务：`FastAPI + MarkItDown + Pandoc`（`../backend`）。

## 开发

```bash
# 数据库
docker compose up -d postgres

# Drizzle 建表
cd web
cp .env.example .env
npm run db:push

# 前端
npm run dev
```

同时启动转换服务：

```bash
cd ../backend
source .venv/bin/activate
export PYTHONPATH=.
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

访问 http://localhost:3000（占用时可能是 3001）。`/api/*` 代理到转换服务。
