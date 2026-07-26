# MarkItDown Web 部署指南

## 📦 本地依赖（已包含）

本项目已包含所有依赖，无需额外安装：

```
markitdown-web/
├── bin/
│   └── pandoc              # ✅ Pandoc 3.9 (本地已下载)
├── markitdown-0.1.5/       # ✅ MarkItDown 源码 (本地已下载)
├── venv311/                # Python 虚拟环境
└── ...
```

## 🚀 快速部署

### 方式一：本地运行

```bash
# 1. 确保 Python 3.11+ 已安装
python3.11 --version

# 2. 创建虚拟环境并安装依赖
python3.11 -m venv venv311
source venv311/bin/activate
pip install -r requirements.txt
pip install ./markitdown-0.1.5/packages/markitdown

# 3. 启动服务
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000

### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t markitdown-web .

# 运行容器
docker run -d -p 8000:8000 markitdown-web
```

### 方式三：服务器部署脚本

```bash
#!/bin/bash

# 部署到 Linux 服务器（Ubuntu/CentOS）

# 1. 上传项目到服务器
# rsync -avz --exclude='venv*' --exclude='__pycache__' ./ user@server:/opt/markitdown-web/

# 2. 安装 Python 3.11
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv

# 3. 进入项目目录
cd /opt/markitdown-web

# 4. 创建虚拟环境
python3.11 -m venv venv311
source venv311/bin/activate

# 5. 安装依赖
pip install -r requirements.txt
pip install ./markitdown-0.1.5/packages/markitdown

# 6. 检查 Pandoc 平台版本
# 项目已包含 bin/linux/pandoc (Linux x86_64)
# 如果是 ARM64 服务器，需要替换：
# cd bin/linux
# wget https://github.com/jgm/pandoc/releases/download/3.9/pandoc-3.9-linux-arm64.tar.gz
# tar xvzf pandoc-3.9-linux-arm64.tar.gz
# mv pandoc-3.9/bin/pandoc . && rm -rf pandoc-3.9 *.tar.gz

# 7. 使用 systemd 或 supervisor 启动服务
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🏗️ 多平台 Pandoc 支持

项目已包含多平台 Pandoc 二进制文件：

```
bin/
├── pandoc              # macOS ARM64 (M1/M2/M3)
└── linux/
    └── pandoc          # Linux x86_64 (Ubuntu/Debian/CentOS)
```

代码会根据 `platform.system()` 自动选择正确的二进制文件。

### 更换其他平台版本

### macOS ARM64 (M1/M2/M3)
```bash
cd bin
curl -L -o pandoc-3.9-arm64-macOS.zip \
  "https://github.com/jgm/pandoc/releases/download/3.9/pandoc-3.9-arm64-macOS.zip"
unzip pandoc-3.9-arm64-macOS.zip
mv pandoc-3.9-arm64/bin/pandoc .
rm -rf pandoc-3.9-arm64 *.zip
```

### macOS Intel (x86_64)
```bash
cd bin
curl -L -o pandoc-3.9-x86_64-macOS.zip \
  "https://github.com/jgm/pandoc/releases/download/3.9/pandoc-3.9-x86_64-macOS.zip"
unzip pandoc-3.9-x86_64-macOS.zip
mv pandoc-3.9-x86_64/bin/pandoc .
rm -rf pandoc-3.9-x86_64 *.zip
```

### Linux AMD64
```bash
cd bin
wget https://github.com/jgm/pandoc/releases/download/3.9/pandoc-3.9-linux-amd64.tar.gz
tar xvzf pandoc-3.9-linux-amd64.tar.gz --strip-components 2 --wildcards '*/bin/pandoc'
rm *.tar.gz
```

### Linux ARM64
```bash
cd bin
wget https://github.com/jgm/pandoc/releases/download/3.9/pandoc-3.9-linux-arm64.tar.gz
tar xvzf pandoc-3.9-linux-arm64.tar.gz --strip-components 2 --wildcards '*/bin/pandoc'
rm *.tar.gz
```

## 🔧 Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 大文件上传限制
    client_max_body_size 100M;
}
```

## 📋 目录结构

```
markitdown-web/
├── app/                    # 后端代码
│   ├── __init__.py
│   ├── main.py            # FastAPI 主应用
│   ├── config.py          # 配置文件
│   └── converter.py       # 转换核心
├── bin/                    # 本地二进制文件
│   └── pandoc             # Pandoc 可执行文件
├── markitdown-0.1.5/       # MarkItDown 源码
│   └── packages/markitdown
├── static/                 # 前端静态资源
│   ├── css/
│   └── js/
├── templates/              # HTML 模板
├── uploads/                # 上传文件目录
├── outputs/                # 输出文件目录
├── requirements.txt        # Python 依赖
├── Dockerfile             # Docker 配置
├── start.sh               # 启动脚本
└── README.md              # 项目说明
```

## 🔒 生产环境建议

1. **使用 HTTPS**: 配置 SSL 证书
2. **文件大小限制**: 修改 `MAX_FILE_SIZE` 环境变量
3. **定期清理**: 设置定时任务清理 uploads/outputs 目录
4. **日志记录**: 配置日志收集和分析
5. **监控**: 添加健康检查和性能监控

## 💰 商业化部署建议

- **免费版**: 限制文件大小 (10MB)，每日次数限制
- **付费 API**: 提供 API Key 认证，按调用次数计费
- **企业版**: 私有部署，技术支持，定制开发
