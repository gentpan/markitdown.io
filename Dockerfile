# MarkItDown Web - Dockerfile
# 支持多平台: linux/amd64, linux/arm64

FROM python:3.11-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    libxml2-dev \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖（含 markitdown[all]，见 requirements.txt）
RUN pip install --no-cache-dir --pre -r requirements.txt

# 复制应用代码
COPY . .

# 根据平台复制对应的 pandoc 二进制文件
ARG TARGETPLATFORM
RUN mkdir -p bin && \
    if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        cp bin/linux/pandoc bin/pandoc; \
    else \
        cp bin/linux/pandoc bin/pandoc; \
    fi && \
    chmod +x bin/pandoc

# 创建上传和输出目录
RUN mkdir -p uploads outputs && chmod 777 uploads outputs

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# 启动命令
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
