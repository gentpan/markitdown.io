.PHONY: install run dev test docker-build docker-run docker-stop clean

# 默认配置
PYTHON=python3
PIP=pip3
PORT=8000

# 安装依赖
install:
	$(PIP) install -r requirements.txt

# 生产运行
run:
	uvicorn app.main:app --host 0.0.0.0 --port $(PORT)

# 开发模式（热重载）
dev:
	uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload

# 测试
test:
	pytest tests/ -v

# Docker 构建
docker-build:
	docker build -t markitdown-web:latest .

# Docker 运行
docker-run:
	docker-compose up -d

# Docker 停止
docker-stop:
	docker-compose down

# Docker 日志
docker-logs:
	docker-compose logs -f

# 清理
clean:
	rm -rf uploads/* outputs/*
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# 格式化代码
format:
	black app/
	isort app/

# 代码检查
lint:
	flake8 app/
	mypy app/

# 帮助
help:
	@echo "可用的命令:"
	@echo "  make install      - 安装 Python 依赖"
	@echo "  make run          - 生产环境运行"
	@echo "  make dev          - 开发模式运行（热重载）"
	@echo "  make test         - 运行测试"
	@echo "  make docker-build - 构建 Docker 镜像"
	@echo "  make docker-run   - Docker 运行"
	@echo "  make docker-stop  - 停止 Docker"
	@echo "  make clean        - 清理临时文件"
