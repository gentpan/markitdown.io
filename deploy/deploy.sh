#!/usr/bin/env bash
set -euo pipefail

SERVER="${SERVER:-65.109.62.100}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/gentpan.pem}"
REMOTE_DIR="${REMOTE_DIR:-/opt/markitdown}"
SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new root@"$SERVER")
RSYNC=(rsync -az --delete -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new")

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> sync project → root@$SERVER:$REMOTE_DIR"
"${SSH[@]}" "mkdir -p '$REMOTE_DIR'"

"${RSYNC[@]}" \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'web/node_modules' \
  --exclude 'web/dist' \
  --exclude 'backend/.venv' \
  --exclude 'backend/data' \
  --exclude 'venv311' \
  --exclude 'tmp-test-output' \
  --exclude '.env' \
  --exclude 'web/.env' \
  --exclude 'backend/.env' \
  "$ROOT/" "root@$SERVER:$REMOTE_DIR/"

echo "==> ensure env + build + restart"
"${SSH[@]}" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/markitdown

if [[ ! -f deploy/.env ]]; then
  umask 077
  PW="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
  cat > deploy/.env <<EOF
POSTGRES_PASSWORD=$PW
CORS_ORIGINS=https://markitdown.io,https://www.markitdown.io,https://api.markitdown.io
MAX_FILE_SIZE_MB=50
EOF
  echo "created deploy/.env"
fi

# Caddy site snippet
mkdir -p /etc/caddy/sites
cp -f deploy/Caddyfile.markitdown.io /etc/caddy/sites/markitdown.io.caddy
chown root:caddy /etc/caddy/sites /etc/caddy/sites/markitdown.io.caddy
chmod 755 /etc/caddy/sites
chmod 644 /etc/caddy/sites/markitdown.io.caddy
if ! grep -q 'sites/markitdown.io.caddy' /etc/caddy/Caddyfile; then
  # Insert before catch-all http:// block when present
  if grep -q 'http:// {' /etc/caddy/Caddyfile; then
    python3 - <<'PY'
from pathlib import Path
p = Path("/etc/caddy/Caddyfile")
text = p.read_text()
imp = "\n# MakeItDown\nimport /etc/caddy/sites/markitdown.io.caddy\n"
marker = "http:// {\n"
if "sites/markitdown.io.caddy" not in text:
    text = text.replace(marker, imp + marker, 1)
    p.write_text(text)
PY
  else
    printf '\n# MakeItDown\nimport /etc/caddy/sites/markitdown.io.caddy\n' >> /etc/caddy/Caddyfile
  fi
fi

cd deploy
docker compose --env-file .env up -d --build --remove-orphans

# Apply auth schema migration (idempotent)
echo "migrate auth schema"
docker compose --env-file .env exec -T postgres \
  psql -U makeitdown -d makeitdown < /opt/markitdown/deploy/migrate-auth.sql

# wait health
for i in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:8010/api/health >/dev/null 2>&1; then
    echo "convert healthy"
    break
  fi
  sleep 3
done

caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy

echo "==> local checks"
curl -fsS http://127.0.0.1:8010/api/health || true
curl -fsSI http://127.0.0.1:3010/ | head -5 || true
REMOTE

echo "==> done"
echo "DNS (Cloudflare 橙云):"
echo "  A     markitdown.io      → $SERVER  (Proxied)"
echo "  A     www                → $SERVER  (Proxied)"
echo "  A     api                → $SERVER  (Proxied)"
echo "SSL 建议: Full（有 Origin 证书后用 Full Strict）"
echo "源站已监听 HTTP；解析生效后访问 https://markitdown.io"
