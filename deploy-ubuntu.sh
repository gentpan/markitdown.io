#!/bin/bash

# MarkItDown Web - Ubuntu/Debian 部署脚本
# 适用于 Ubuntu 20.04+ / Debian 11+

set -e

echo "🚀 MarkItDown Web Ubuntu 部署脚本"
echo "=================================="

# 配置
APP_DIR="/opt/markitdown-web"
APP_USER="markitdown"
APP_PORT=8000

# 1. 更新系统
echo "📦 更新系统..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. 安装依赖
echo "📦 安装系统依赖..."
sudo apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    curl \
    wget \
    unzip \
    nginx \
    supervisor

# 3. 创建用户
echo "👤 创建应用用户..."
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
fi

# 4. 创建应用目录
echo "📁 创建应用目录..."
sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER:$APP_USER" "$APP_DIR"

# 5. 上传项目文件（假设当前目录是项目根目录）
echo "📤 上传项目文件..."
sudo rsync -avz --exclude='venv*' --exclude='__pycache__' --exclude='.git' \
    ./ "$APP_DIR/"

# 6. 设置权限
echo "🔒 设置权限..."
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo chmod +x "$APP_DIR/bin/linux/pandoc"

# 7. 创建虚拟环境
echo "🐍 创建 Python 虚拟环境..."
sudo -u "$APP_USER" bash << EOF
cd "$APP_DIR"
python3.11 -m venv venv311
source venv311/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install ./markitdown-0.1.5/packages/markitdown
EOF

# 8. 创建 Supervisor 配置
echo "⚙️  配置 Supervisor..."
sudo tee /etc/supervisor/conf.d/markitdown-web.conf > /dev/null << EOF
[program:markitdown-web]
directory=$APP_DIR
command=$APP_DIR/venv311/bin/uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT
user=$APP_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/markitdown-web.log
environment=PATH="$APP_DIR/venv311/bin:%(ENV_PATH)s"
EOF

sudo supervisorctl reread
sudo supervisorctl update

# 9. 配置 Nginx
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/sites-available/markitdown-web > /dev/null << EOF
server {
    listen 80;
    server_name _;  # 接受所有域名，或改为你的域名

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/markitdown-web /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 10. 创建系统服务（备用方案）
echo "🔧 创建系统服务..."
sudo tee /etc/systemd/system/markitdown-web.service > /dev/null << EOF
[Unit]
Description=MarkItDown Web Service
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv311/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=$APP_DIR/venv311/bin/uvicorn app.main:app --host 0.0.0.0 --port $APP_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

# 11. 启动服务
echo "▶️  启动服务..."
sudo supervisorctl start markitdown-web

# 12. 显示状态
echo ""
echo "✅ 部署完成！"
echo "=================================="
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}')"
echo "📚 API 文档: http://$(hostname -I | awk '{print $1}')/docs"
echo ""
echo "📋 常用命令:"
echo "  查看日志: sudo tail -f /var/log/markitdown-web.log"
echo "  重启服务: sudo supervisorctl restart markitdown-web"
echo "  查看状态: sudo supervisorctl status markitdown-web"
echo "  Nginx 日志: sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔒 建议:"
echo "  1. 配置 HTTPS (使用 certbot)"
echo "  2. 配置防火墙 (ufw allow 80,443)"
echo "  3. 设置域名解析"
