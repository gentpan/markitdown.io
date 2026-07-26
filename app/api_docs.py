"""API 文档扩展"""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

API_DOCUMENTATION = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarkItDown API 文档</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        header { text-align: center; margin-bottom: 3rem; }
        h1 { color: #6366f1; margin-bottom: 0.5rem; }
        .subtitle { color: #64748b; }
        .endpoint {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .method {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.75rem;
        }
        .post { background: #22c55e; color: white; }
        .get { background: #3b82f6; color: white; }
        .path { font-family: monospace; font-size: 1.1rem; color: #334155; }
        .description { margin-top: 0.75rem; color: #64748b; }
        .params { margin-top: 1rem; }
        .params h4 { margin-bottom: 0.5rem; color: #475569; }
        .param { 
            display: flex; 
            gap: 1rem; 
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .param-name { font-family: monospace; color: #6366f1; min-width: 120px; }
        .param-type { color: #64748b; font-size: 0.875rem; }
        .param-desc { color: #64748b; }
        .code-block {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin-top: 1rem;
        }
        .code-block pre { margin: 0; }
        footer {
            text-align: center;
            padding: 2rem;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            margin-top: 3rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 MarkItDown API 文档</h1>
            <p class="subtitle">完整的 REST API 接口说明</p>
        </header>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/health</span>
            <p class="description">健康检查接口</p>
        </div>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/formats</span>
            <p class="description">获取支持的文件格式列表</p>
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/api/convert/to-markdown</span>
            <p class="description">将文件转换为 Markdown</p>
            <div class="params">
                <h4>请求参数</h4>
                <div class="param">
                    <span class="param-name">file</span>
                    <span class="param-type">File (required)</span>
                    <span class="param-desc">要转换的文件</span>
                </div>
            </div>
            <div class="code-block">
                <pre>curl -X POST "http://localhost:8000/api/convert/to-markdown" \\
  -F "file=@example.pdf"</pre>
            </div>
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/api/convert/from-markdown</span>
            <p class="description">将 Markdown 转换为其他格式（Pandoc 回转）</p>
            <div class="params">
                <h4>请求参数</h4>
                <div class="param">
                    <span class="param-name">markdown</span>
                    <span class="param-type">string (required)</span>
                    <span class="param-desc">Markdown 内容</span>
                </div>
                <div class="param">
                    <span class="param-name">output_format</span>
                    <span class="param-type">string (required)</span>
                    <span class="param-desc">导出格式；可用值见 /api/formats 返回的 export 列表</span>
                </div>
                <div class="param">
                    <span class="param-name">filename</span>
                    <span class="param-type">string (optional)</span>
                    <span class="param-desc">自定义输出文件名</span>
                </div>
            </div>
            <div class="code-block">
                <pre>curl -X POST "http://localhost:8000/api/convert/from-markdown" \\
  -F "markdown=# Hello World" \\
  -F "output_format=docx"</pre>
            </div>
        </div>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/api/batch/convert</span>
            <p class="description">批量转换多个文件</p>
            <div class="params">
                <h4>请求参数</h4>
                <div class="param">
                    <span class="param-name">files</span>
                    <span class="param-type">array[File] (required)</span>
                    <span class="param-desc">多个要转换的文件（最多10个）</span>
                </div>
            </div>
        </div>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/api/download/{filename}</span>
            <p class="description">下载转换后的文件</p>
        </div>
        
        <footer>
            <p>更多信息请访问 <a href="/docs">/docs</a> 查看 Swagger UI</p>
        </footer>
    </div>
</body>
</html>
"""

@router.get("/docs", response_class=HTMLResponse)
async def api_documentation():
    return API_DOCUMENTATION
