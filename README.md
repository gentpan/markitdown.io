# MakeItDown

**File ↔ Markdown conversion** for the web and API — powered by [Microsoft MarkItDown](https://github.com/microsoft/markitdown), Pandoc, and Typst.

**Website:** [https://markitdown.io](https://markitdown.io) · **API:** [https://api.markitdown.io](https://api.markitdown.io)

[![Site](https://img.shields.io/badge/site-markitdown.io-0A0E19)](https://markitdown.io)
[![Stack](https://img.shields.io/badge/stack-TanStack%20Start%20%2B%20FastAPI-397554)](#architecture)

---

## Features

- **Many formats in** — PDF, Word, Excel, PowerPoint, images, HTML, and more → clean Markdown
- **Export both ways** — Markdown → PDF / DOCX / HTML (Pandoc + Typst)
- **Guest & signed-in credits** — daily quotas for web convert and API
- **API keys** — `https://api.markitdown.io/api/v1` with Bearer / `X-API-Key`
- **i18n** — Chinese (`/`) and English (`/en`)
- **Accounts** — email signup, Gravatar avatars (`gravatar.bluecdn.com`), session cookies

## Architecture

| Layer | Role |
|--------|------|
| **`web/`** | TanStack Start (React) + Drizzle ORM + PostgreSQL — UI, auth, credits, API keys |
| **`backend/`** | FastAPI convert microservice — MarkItDown + Pandoc + Typst |
| **`deploy/`** | Docker Compose, Caddy snippet, deploy script |

```
Browser → markitdown.io (web :3010)
                ↓
         PostgreSQL (users / sessions / keys / usage)
                ↓
         Convert API (backend :8010) ← api.markitdown.io
```

## Quick start (local)

### Prerequisites

- Node.js 22+
- Python 3.12+
- PostgreSQL (or Docker for DB only)

### Database

```bash
# example local URL (see web/.env.example)
export DATABASE_URL=postgresql://makeitdown:makeitdown@127.0.0.1:5433/makeitdown
```

Apply schema (from `web/`):

```bash
cd web
cp .env.example .env   # edit DATABASE_URL
npm ci
npm run db:push        # or run deploy/migrate-auth.sql via psql
```

### Convert API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Typst recommended for PDF export: https://github.com/typst/typst
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Web app

```bash
cd web
npm ci
npm run dev            # http://localhost:3000  (proxies /api → :8000)
```

## Production deploy

Server deploy (rsync + Docker Compose + Caddy):

```bash
./deploy/deploy.sh
# SERVER=… SSH_KEY=… optional overrides
```

See `deploy/docker-compose.yml` and `deploy/Caddyfile.markitdown.io`.

## Project layout

```
makeitdown.io/
├── web/                 # TanStack Start frontend + Drizzle
├── backend/             # FastAPI convert service
├── deploy/              # production compose, Caddy, SQL init/migrate
├── app/ static/ …       # legacy reference (older FastAPI UI)
└── README.md
```

## Quotas (product defaults)

| Audience | Rule |
|----------|------|
| Guest | 5 credits / day (browser localStorage) |
| Registered (web) | 100 credits / day, no rollover |
| API | 10 calls / day per key |

1 conversion = 1 credit.

## Docs

- In-app API docs: [/developers](https://markitdown.io/developers) · [/en/developers](https://markitdown.io/en/developers)
- Convert health: `GET /api/health` on the convert service

## License

All rights reserved unless otherwise noted.

## Acknowledgements

- [Microsoft MarkItDown](https://github.com/microsoft/markitdown)
- [Pandoc](https://pandoc.org/)
- [Typst](https://typst.app/)
- [TanStack Start](https://tanstack.com/start)
- [FastAPI](https://fastapi.tiangolo.com/)
