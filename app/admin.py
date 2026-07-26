"""
后台管理模块 - 自动更新管理
"""
import asyncio
import secrets
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from pydantic import BaseModel, Field

from app.config import ADMIN_PASSWORD, ADMIN_USERNAME
from app.updater import updater
from app.pandoc_updater import pandoc_updater
from app.scheduler import scheduler
from app.file_types import (
    SUPPORTED_TYPES, CATEGORIES, EXPORT_FORMATS,
    get_types_by_category, get_supported_extensions
)


class SchedulerConfigBody(BaseModel):
    enabled: bool | None = None
    check_interval_hours: int | None = Field(default=None, ge=1, le=24 * 90)
    auto_update: bool | None = None

security = HTTPBasic()


def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Require HTTP Basic auth for all admin endpoints."""
    if not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="管理后台未启用。请设置 ADMIN_PASSWORD 环境变量。",
        )

    username_ok = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    password_ok = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员认证失败",
            headers={"WWW-Authenticate": "Basic"},
        )


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_class=HTMLResponse)
async def admin_dashboard():
    """管理后台首页"""
    html = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarkItDown - 管理后台</title>
    <link rel="icon" type="image/svg+xml" href="/static/logo.svg">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 28px; margin-bottom: 30px; color: #0064E0; }
        h2 { font-size: 20px; margin: 30px 0 15px; }
        h3 { font-size: 16px; margin: 20px 0 10px; color: #555; }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        
        .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #666;
        }
        
        .tab.active {
            background: #0064E0;
            color: white;
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        
        .info-item {
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .info-label {
            font-size: 13px;
            color: #666;
            margin-bottom: 4px;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        
        .info-value.success { color: #31A24C; }
        .info-value.warning { color: #F7B928; }
        .info-value.error { color: #E41E3F; }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 100px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #0064E0;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0143B5;
        }
        
        .btn-primary:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
            margin-left: 10px;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
        }
        
        .log-container {
            background: #1a1a1a;
            color: #00ff00;
            font-family: 'Menlo', monospace;
            font-size: 13px;
            padding: 16px;
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        
        .backup-list {
            list-style: none;
        }
        
        .backup-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .backup-item:last-child {
            border-bottom: none;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 100px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-badge.info {
            background: #cce5ff;
            color: #004085;
        }
        
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        
        .progress-bar {
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .progress-fill {
            height: 100%;
            background: #0064E0;
            transition: width 0.3s;
        }
        
        /* File Types Styles */
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .category-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        
        .category-icon {
            font-size: 24px;
        }
        
        .category-title {
            font-size: 16px;
            font-weight: 600;
        }
        
        .category-desc {
            font-size: 12px;
            color: #666;
        }
        
        .type-list {
            list-style: none;
        }
        
        .type-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .type-item:last-child {
            border-bottom: none;
        }
        
        .type-icon {
            font-size: 20px;
        }
        
        .type-info {
            flex: 1;
        }
        
        .type-name {
            font-weight: 500;
            font-size: 14px;
        }
        
        .type-ext {
            font-size: 12px;
            color: #0064E0;
            background: #e8f3ff;
            padding: 2px 8px;
            border-radius: 100px;
        }
        
        .type-desc {
            font-size: 12px;
            color: #888;
        }
        
        .converter-badge {
            font-size: 11px;
            padding: 3px 10px;
            border-radius: 100px;
            font-weight: 500;
        }
        
        .converter-badge.markitdown {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .converter-badge.pandoc {
            background: #fff3e0;
            color: #ef6c00;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><img src="/static/logo.svg" style="width: 44px; height: 44px; vertical-align: middle; margin-right: 12px; border-radius: 12px;">MarkItDown 管理后台</h1>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('updates')">📦 组件更新</button>
            <button class="tab" onclick="showTab('files')">📄 文件类型</button>
        </div>
        
        <!-- Updates Tab -->
        <div id="updatesTab" class="tab-content active">
            <!-- MarkItDown Update -->
            <div class="card">
                <h2>MarkItDown 更新</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">当前版本</div>
                        <div class="info-value" id="mdCurrentVersion">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">最新版本</div>
                        <div class="info-value" id="mdLatestVersion">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">更新状态</div>
                        <div class="info-value" id="mdUpdateStatus">-</div>
                    </div>
                </div>
                
                <div id="mdUpdateAlert"></div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" id="mdCheckBtn" onclick="checkMDUpdate()">检查更新</button>
                    <button class="btn btn-secondary" id="mdUpdateBtn" onclick="doMDUpdate()" disabled>执行更新</button>
                </div>
            </div>
            
            <!-- Auto Update Scheduler -->
            <div class="card">
                <h2>自动检查设置</h2>
                <p style="color:#666;margin-bottom:16px;font-size:14px;">
                    默认同周检查一次 MarkItDown 新版本。可改间隔；打开「自动安装」后发现新版本会 pip 更新并重启。
                </p>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">定时检查</div>
                        <div class="info-value" id="schedEnabled">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">检查间隔</div>
                        <div class="info-value" id="schedInterval">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">自动安装</div>
                        <div class="info-value" id="schedAuto">-</div>
                    </div>
                </div>
                <div class="info-grid" style="margin-top:12px;">
                    <div class="info-item">
                        <div class="info-label">上次检查</div>
                        <div class="info-value" id="schedLast" style="font-size:14px;">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">下次检查</div>
                        <div class="info-value" id="schedNext" style="font-size:14px;">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">运行状态</div>
                        <div class="info-value" id="schedRunning">-</div>
                    </div>
                </div>
                <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                    <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
                        <input type="checkbox" id="schedEnabledInput"> 启用定时检查
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
                        间隔（小时）
                        <input type="number" id="schedIntervalInput" min="1" max="2160" value="168"
                               style="width:90px;padding:8px 10px;border:1px solid #ddd;border-radius:8px;">
                    </label>
                    <button class="btn btn-secondary" type="button" onclick="setWeekly()">每周 (168h)</button>
                    <button class="btn btn-secondary" type="button" onclick="setDaily()">每天 (24h)</button>
                    <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
                        <input type="checkbox" id="schedAutoInput"> 发现新版本自动安装并重启
                    </label>
                </div>
                <div style="margin-top:16px;">
                    <button class="btn btn-primary" onclick="saveScheduler()">保存设置</button>
                    <button class="btn btn-secondary" onclick="runCheckNow()">立即检查一次</button>
                </div>
                <div id="schedAlert"></div>
            </div>

            <!-- Pandoc Update -->
            <div class="card">
                <h2>Pandoc 更新</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">当前版本</div>
                        <div class="info-value" id="pandocCurrentVersion">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">最新版本</div>
                        <div class="info-value" id="pandocLatestVersion">-</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">更新状态</div>
                        <div class="info-value" id="pandocUpdateStatus">-</div>
                    </div>
                </div>
                
                <div id="pandocUpdateAlert"></div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" id="pandocCheckBtn" onclick="checkPandocUpdate()">检查更新</button>
                    <button class="btn btn-secondary" id="pandocUpdateBtn" onclick="doPandocUpdate()" disabled>执行更新</button>
                </div>
            </div>
            
            <div class="card">
                <h2>系统操作</h2>
                <button class="btn btn-primary" onclick="restartService()">🔄 重启服务</button>
                <div id="progressContainer" style="display: none; margin-top: 15px;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressBar" style="width: 0%"></div>
                    </div>
                    <div id="progressText" style="font-size: 13px; color: #666; margin-top: 8px;"></div>
                </div>
            </div>
            
            <div class="card">
                <h2>更新日志</h2>
                <div class="log-container" id="logContainer">点击"检查更新"开始...</div>
            </div>
        </div>
        
        <!-- File Types Tab -->
        <div id="filesTab" class="tab-content">
            <div class="card">
                <h2>支持的文件类型</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    系统会自动识别文件类型并选择合适的转换器：<br>
                    <span style="color: #2e7d32;">■ MarkItDown</span> - 将各种格式转换为 Markdown<br>
                    <span style="color: #ef6c00;">■ Pandoc</span> - Markdown 回转及其他格式转换
                </p>
                <div id="fileTypesContainer" class="category-grid">
                    加载中...
                </div>
            </div>
            
            <div class="card">
                <h2>导出格式 (Pandoc 回转)</h2>
                <div id="exportFormatsContainer">
                    加载中...
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let mdUpdateAvailable = false;
        let pandocUpdateAvailable = false;
        
        // Tab switching
        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
            
            if (tab === 'files') {
                loadFileTypes();
            }
        }
        
        function setWeekly() { document.getElementById('schedIntervalInput').value = 168; }
        function setDaily() { document.getElementById('schedIntervalInput').value = 24; }

        async function loadScheduler() {
            try {
                const res = await fetch('/admin/scheduler');
                const data = await res.json();
                document.getElementById('schedEnabled').innerHTML = data.enabled
                    ? '<span class="status-badge success">已启用</span>'
                    : '<span class="status-badge warning">已关闭</span>';
                document.getElementById('schedInterval').textContent =
                    data.check_interval_hours + 'h / ' + data.check_interval_days + '天';
                document.getElementById('schedAuto').innerHTML = data.auto_update
                    ? '<span class="status-badge warning">自动安装</span>'
                    : '<span class="status-badge success">仅检查</span>';
                document.getElementById('schedLast').textContent = data.last_check || '尚未检查';
                document.getElementById('schedNext').textContent = data.next_check || '-';
                document.getElementById('schedRunning').textContent = data.running ? '运行中' : '已停止';
                document.getElementById('schedEnabledInput').checked = !!data.enabled;
                document.getElementById('schedIntervalInput').value = data.check_interval_hours || 168;
                document.getElementById('schedAutoInput').checked = !!data.auto_update;
            } catch (e) {
                document.getElementById('schedAlert').innerHTML =
                    '<div class="alert alert-warning">加载调度设置失败: ' + e.message + '</div>';
            }
        }

        async function saveScheduler() {
            const body = {
                enabled: document.getElementById('schedEnabledInput').checked,
                check_interval_hours: parseInt(document.getElementById('schedIntervalInput').value, 10) || 168,
                auto_update: document.getElementById('schedAutoInput').checked
            };
            try {
                const res = await fetch('/admin/scheduler', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || '保存失败');
                document.getElementById('schedAlert').innerHTML =
                    '<div class="alert alert-success">设置已保存（立即生效并持久化）</div>';
                await loadScheduler();
            } catch (e) {
                document.getElementById('schedAlert').innerHTML =
                    '<div class="alert alert-warning">保存失败: ' + e.message + '</div>';
            }
        }

        async function runCheckNow() {
            document.getElementById('logContainer').textContent = '正在立即检查...';
            try {
                const res = await fetch('/admin/scheduler/check-now', { method: 'POST' });
                const data = await res.json();
                document.getElementById('logContainer').textContent = JSON.stringify(data, null, 2);
                await loadScheduler();
                await checkMDUpdate();
            } catch (e) {
                document.getElementById('logContainer').textContent = '立即检查失败: ' + e.message;
            }
        }

        // MarkItDown Update
        async function checkMDUpdate() {
            document.getElementById('mdCheckBtn').disabled = true;
            document.getElementById('logContainer').textContent = '正在检查 MarkItDown 更新...';
            
            try {
                const res = await fetch('/admin/check');
                const data = await res.json();
                
                document.getElementById('mdCurrentVersion').textContent = data.current_version;
                document.getElementById('mdLatestVersion').textContent = data.latest_version || '获取失败';
                
                const statusEl = document.getElementById('mdUpdateStatus');
                const alertEl = document.getElementById('mdUpdateAlert');
                const updateBtn = document.getElementById('mdUpdateBtn');
                
                if (data.update_available) {
                    mdUpdateAvailable = true;
                    statusEl.innerHTML = '<span class="status-badge warning">有更新可用</span>';
                    alertEl.innerHTML = `<div class="alert alert-warning">
                        <strong>发现新版本!</strong> ${data.current_version} → ${data.latest_version}
                    </div>`;
                    updateBtn.disabled = false;
                } else {
                    mdUpdateAvailable = false;
                    statusEl.innerHTML = '<span class="status-badge success">已是最新</span>';
                    alertEl.innerHTML = '<div class="alert alert-success">当前已是最新版本</div>';
                    updateBtn.disabled = true;
                }
            } catch (e) {
                document.getElementById('logContainer').textContent = '检查失败: ' + e.message;
            } finally {
                document.getElementById('mdCheckBtn').disabled = false;
            }
        }
        
        async function doMDUpdate() {
            if (!confirm('确定要更新 MarkItDown 吗？')) return;
            
            document.getElementById('mdUpdateBtn').disabled = true;
            document.getElementById('logContainer').textContent = '更新进行中...';
            
            try {
                const res = await fetch('/admin/update', { method: 'POST' });
                const data = await res.json();
                
                document.getElementById('logContainer').textContent = (data.log || []).join('\\n');
                
                if (data.success) {
                    alert('更新成功，即将重启服务');
                    restartService();
                } else {
                    alert('更新失败: ' + data.error);
                }
            } catch (e) {
                document.getElementById('logContainer').textContent = '错误: ' + e.message;
            }
        }
        
        // Pandoc Update
        async function checkPandocUpdate() {
            document.getElementById('pandocCheckBtn').disabled = true;
            document.getElementById('logContainer').textContent = '正在检查 Pandoc 更新...';
            
            try {
                const res = await fetch('/admin/pandoc/check');
                const data = await res.json();
                
                document.getElementById('pandocCurrentVersion').textContent = data.current_version;
                document.getElementById('pandocLatestVersion').textContent = data.latest_version || '获取失败';
                
                const statusEl = document.getElementById('pandocUpdateStatus');
                const alertEl = document.getElementById('pandocUpdateAlert');
                const updateBtn = document.getElementById('pandocUpdateBtn');
                
                if (data.update_available) {
                    pandocUpdateAvailable = true;
                    statusEl.innerHTML = '<span class="status-badge warning">有更新可用</span>';
                    alertEl.innerHTML = `<div class="alert alert-warning">
                        <strong>发现新版本!</strong> ${data.current_version} → ${data.latest_version}<br>
                        <small>平台: ${data.platform}</small>
                    </div>`;
                    updateBtn.disabled = false;
                } else {
                    pandocUpdateAvailable = false;
                    statusEl.innerHTML = '<span class="status-badge success">已是最新</span>';
                    alertEl.innerHTML = '<div class="alert alert-success">当前已是最新版本</div>';
                    updateBtn.disabled = true;
                }
            } catch (e) {
                document.getElementById('logContainer').textContent = '检查失败: ' + e.message;
            } finally {
                document.getElementById('pandocCheckBtn').disabled = false;
            }
        }
        
        async function doPandocUpdate() {
            if (!confirm('确定要更新 Pandoc 吗？')) return;
            
            document.getElementById('pandocUpdateBtn').disabled = true;
            document.getElementById('logContainer').textContent = '更新进行中...';
            
            try {
                const res = await fetch('/admin/pandoc/update', { method: 'POST' });
                const data = await res.json();
                
                document.getElementById('logContainer').textContent = (data.log || []).join('\\n');
                
                if (data.success) {
                    alert('Pandoc 更新成功');
                } else {
                    alert('更新失败: ' + data.error);
                }
            } catch (e) {
                document.getElementById('logContainer').textContent = '错误: ' + e.message;
            }
        }
        
        async function restartService() {
            if (!confirm('确定要重启服务吗？')) return;
            
            document.getElementById('progressContainer').style.display = 'block';
            document.getElementById('progressText').textContent = '正在重启...';
            
            try {
                const res = await fetch('/admin/restart', { method: 'POST' });
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('progressText').textContent = '服务已重启';
                    setTimeout(() => location.reload(), 2000);
                }
            } catch (e) {
                document.getElementById('progressText').textContent = '重启失败: ' + e.message;
            }
        }
        
        // File Types
        async function loadFileTypes() {
            try {
                const res = await fetch('/admin/file-types');
                const data = await res.json();
                
                const container = document.getElementById('fileTypesContainer');
                container.innerHTML = Object.entries(data.categories).map(([key, cat]) => `
                    <div class="category-card">
                        <div class="category-header">
                            <span class="category-icon">${cat.icon}</span>
                            <div>
                                <div class="category-title">${cat.name}</div>
                                <div class="category-desc">${cat.description}</div>
                            </div>
                        </div>
                        <ul class="type-list">
                            ${cat.types.map(t => `
                                <li class="type-item">
                                    <span class="type-icon">${t.icon}</span>
                                    <div class="type-info">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="type-name">${t.name}</span>
                                            <span class="type-ext">${t.extension}</span>
                                        </div>
                                        <div class="type-desc">${t.description}</div>
                                    </div>
                                    <span class="converter-badge ${t.converter}">${t.converter}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('');
                
                // Export formats
                const exportContainer = document.getElementById('exportFormatsContainer');
                exportContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${data.export_formats.map(f => `
                            <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                <span style="font-size: 28px;">${f.icon}</span>
                                <div>
                                    <div style="font-weight: 500;">${f.name}</div>
                                    <div style="font-size: 12px; color: #666;">.${f.format} - ${f.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } catch (e) {
                console.error('加载文件类型失败', e);
            }
        }
        
        // Initial load
        loadScheduler();
        checkMDUpdate();
    </script>
</body>
</html>
    """
    return html


# ========== MarkItDown Update APIs ==========

@router.get("/check")
async def check_update():
    """检查 MarkItDown 更新"""
    result = await updater.check_update()
    return result


@router.post("/update")
async def perform_update(background_tasks: BackgroundTasks):
    """执行 MarkItDown 更新"""
    if updater.is_updating:
        raise HTTPException(status_code=400, detail="更新正在进行中")
    
    result = await updater.perform_update()
    
    if result["success"]:
        background_tasks.add_task(updater.restart_service)
    
    return result


# ========== Pandoc Update APIs ==========

@router.get("/pandoc/check")
async def check_pandoc_update():
    """检查 Pandoc 更新"""
    result = await pandoc_updater.check_update()
    return result


@router.post("/pandoc/update")
async def perform_pandoc_update():
    """执行 Pandoc 更新"""
    if pandoc_updater.is_updating:
        raise HTTPException(status_code=400, detail="更新正在进行中")
    
    result = await pandoc_updater.perform_update()
    return result


@router.get("/pandoc/backups")
async def get_pandoc_backups():
    """获取 Pandoc 备份列表"""
    return {"backups": pandoc_updater.get_backups()}


# ========== System APIs ==========

@router.post("/restart")
async def restart_service():
    """重启服务"""
    return await updater.restart_service()


@router.get("/backups")
async def get_backups():
    """获取 MarkItDown 备份列表"""
    return {"backups": updater.get_update_history()}


@router.get("/status")
async def get_status():
    """获取更新器状态"""
    return {
        "markitdown": {
            "current_version": updater.current_version,
            "latest_version": updater.latest_version,
            "update_available": updater.update_available,
            "is_updating": updater.is_updating,
        },
        "pandoc": {
            "current_version": pandoc_updater.current_version,
            "latest_version": pandoc_updater.latest_version,
            "update_available": pandoc_updater.update_available,
            "is_updating": pandoc_updater.is_updating,
        },
        "scheduler": scheduler.get_status(),
    }


@router.get("/scheduler")
async def get_scheduler():
    """获取自动检查调度配置"""
    return scheduler.get_status()


@router.post("/scheduler")
async def update_scheduler(body: SchedulerConfigBody):
    """更新自动检查调度配置（持久化到 updates/scheduler_config.json）"""
    return scheduler.configure(
        enabled=body.enabled,
        check_interval_hours=body.check_interval_hours,
        auto_update=body.auto_update,
        persist=True,
    )


@router.post("/scheduler/check-now")
async def scheduler_check_now():
    """立即执行一次版本检查（受 auto_update 开关影响）"""
    await scheduler._do_check()
    return {
        "success": True,
        "scheduler": scheduler.get_status(),
        "result": scheduler.last_result,
    }


# ========== File Types APIs ==========

@router.get("/file-types")
async def get_file_types():
    """获取支持的文件类型列表"""
    return {
        "categories": get_types_by_category(),
        "export_formats": EXPORT_FORMATS,
        "extensions": get_supported_extensions()
    }


@router.get("/file-types/refresh")
async def refresh_file_types():
    """刷新文件类型配置（动态更新）"""
    # 这里可以添加从远程获取最新配置的逻辑
    return {
        "success": True,
        "message": "文件类型配置已刷新",
        "types_count": len(SUPPORTED_TYPES),
        "categories_count": len(CATEGORIES)
    }
