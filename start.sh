#!/bin/bash

# MarkItDown Web 启动脚本 (Python 3.11)

echo "🚀 MarkItDown Web 启动中..."

# 使用 Python 3.11
export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"
PYTHON=python3.11

# 检查 Python 3.11
if ! command -v $PYTHON &> /dev/null; then
    echo "❌ 未找到 Python 3.11，请先安装: brew install python@3.11"
    exit 1
fi

echo "✅ Python 版本: $($PYTHON --version)"

# 检查 pandoc
if ! command -v pandoc &> /dev/null; then
    echo "⚠️  未找到 Pandoc，回转功能可能不可用"
    echo "   macOS: brew install pandoc"
fi

# 创建虚拟环境
if [ ! -d "venv311" ]; then
    echo "📦 创建虚拟环境..."
    $PYTHON -m venv venv311
fi

# 激活虚拟环境
source venv311/bin/activate

# 安装/更新依赖（markitdown[all] 可能需要预发布传递依赖）
echo "📦 检查依赖..."
pip install -q --upgrade pip
pip install -q --pre -r requirements.txt

# 创建目录
mkdir -p uploads outputs

echo "✅ 启动服务..."
echo "🌐 访问地址: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo ""

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
