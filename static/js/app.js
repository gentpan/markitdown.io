// ============================================
// MarkItDown Web - Meta Store Design
// ============================================

// File type icons mapping
const FILE_ICONS = {
    'pdf': '📄',
    'doc': '📝', 'docx': '📝',
    'ppt': '📊', 'pptx': '📊',
    'xls': '📈', 'xlsx': '📈',
    'txt': '📃',
    'html': '🌐', 'htm': '🌐',
    'md': '📑',
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️',
    'mp3': '🎵', 'wav': '🎵', 'm4a': '🎵',
    'zip': '📦',
    'default': '📎'
};

// DOM Elements
const elements = {
    // Upload
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    progressWrapper: document.getElementById('progressWrapper'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    actionBar: document.getElementById('actionBar'),
    convertBtn: document.getElementById('convertBtn'),
    clearBtn: document.getElementById('clearBtn'),
    
    // Sections
    convertSection: document.getElementById('convert'),
    resultSection: document.getElementById('resultSection'),
    
    // Result
    markdownPreview: document.getElementById('markdownPreview'),
    rawEditor: document.getElementById('rawEditor'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    backBtn: document.getElementById('backBtn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    exportGrid: document.getElementById('exportGrid'),
    
    // Toast & Loading
    toast: document.getElementById('toast'),
    loadingOverlay: document.getElementById('loadingOverlay'),
};

// State
let files = [];
let currentMarkdown = '';
let currentFilename = '';
let supportedExtensions = [];
let exportFormats = [];

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadSupportedFormats();
});

function initEventListeners() {
    // Upload
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Actions
    elements.convertBtn.addEventListener('click', convertFiles);
    elements.clearBtn.addEventListener('click', clearFiles);
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.downloadBtn.addEventListener('click', downloadMarkdown);
    elements.backBtn.addEventListener('click', showUploadSection);
    
    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    elements.exportGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.export-card');
        if (card) convertBack(card.dataset.format);
    });
}

// ============================================
// Upload Handling
// ============================================
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');
    addFiles(Array.from(e.dataTransfer.files));
}

function handleFileSelect(e) {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
}

function addFiles(newFiles) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    newFiles.forEach(file => {
        if (file.size > maxSize) {
            showToast(`"${file.name}" 超过 50MB 限制`, 'error');
            return;
        }
        const ext = getFileExtension(file.name);
        if (supportedExtensions.length > 0 && !supportedExtensions.includes(ext)) {
            showToast(`"${file.name}" 格式暂不支持`, 'error');
            return;
        }
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
            files.push(file);
        }
    });
    
    renderFileList();
    updateUI();
}

function removeFile(index) {
    files.splice(index, 1);
    renderFileList();
    updateUI();
}

function renderFileList() {
    elements.fileList.innerHTML = files.map((file, index) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const icon = FILE_ICONS[ext] || FILE_ICONS.default;
        const size = formatFileSize(file.size);
        
        return `
            <div class="file-item" data-index="${index}">
                <span class="file-icon">${icon}</span>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-size">${size}</div>
                </div>
                <span class="file-status ready">待转换</span>
                <button class="file-remove" onclick="window.removeFileByIndex(${index})" title="移除">×</button>
            </div>
        `;
    }).join('');
}

window.removeFileByIndex = removeFile;

function updateUI() {
    const hasFiles = files.length > 0;
    elements.actionBar.hidden = !hasFiles;
    elements.progressWrapper.hidden = true;
    if (files.length === 1 && isMarkdownFile(files[0].name)) {
        elements.convertBtn.querySelector('span').textContent = '选择导出格式';
    } else {
        elements.convertBtn.querySelector('span').textContent = '开始转换';
    }
}

function clearFiles() {
    files = [];
    renderFileList();
    updateUI();
}

// ============================================
// Conversion
// ============================================
async function convertFiles() {
    if (files.length === 0) return;
    if (files.length > 1 && files.some(file => isMarkdownFile(file.name))) {
        showToast('Markdown 回退导出请一次上传一个文件', 'error');
        return;
    }
    
    elements.loadingOverlay.hidden = false;
    elements.progressWrapper.hidden = false;
    
    try {
        if (files.length === 1) {
            await convertSingleFile(files[0]);
        } else {
            await convertBatchFiles();
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        elements.loadingOverlay.hidden = true;
    }
}

async function convertSingleFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    updateProgress(30);
    
    const response = await fetch('/api/convert/to-markdown', {
        method: 'POST',
        body: formData
    });
    
    updateProgress(70);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '转换失败');
    }
    
    const result = await response.json();
    updateProgress(100);
    
    currentMarkdown = result.markdown;
    currentFilename = result.filename;
    result.isMarkdownSource = result.source_type === 'markdown' || isMarkdownFile(file.name);
    
    showResult(result);
}

async function convertBatchFiles() {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    updateProgress(30);
    
    const response = await fetch('/api/batch/convert', {
        method: 'POST',
        body: formData
    });
    
    updateProgress(70);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '批量转换失败');
    }
    
    const result = await response.json();
    updateProgress(100);
    
    currentMarkdown = result.results.map(r => 
        `## ${r.title}\n\n${r.markdown}\n\n---\n`
    ).join('\n');
    currentFilename = 'batch-convert.md';
    
    showResult({
        title: '批量转换结果',
        filename: 'batch-convert.md',
        markdown: currentMarkdown
    });
    
    showToast(`成功转换 ${result.converted} 个文件`, 'success');
}

function updateProgress(percent) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${percent}%`;
}

// ============================================
// Result Display
// ============================================
function showResult(result) {
    elements.markdownPreview.innerHTML = renderMarkdown(result.markdown);
    elements.rawEditor.value = result.markdown;
    
    // Scroll to result
    elements.resultSection.hidden = false;
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    if (result.isMarkdownSource) {
        switchTab('export');
        showToast('请选择要导出的格式', 'success');
    } else {
        switchTab('preview');
        showToast('转换成功！', 'success');
    }
}

function showUploadSection() {
    elements.resultSection.hidden = true;
    clearFiles();
    elements.convertSection.scrollIntoView({ behavior: 'smooth' });
}

function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
}

// ============================================
// Markdown Rendering
// ============================================
function renderMarkdown(markdown) {
    let html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Code blocks
    html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        const safeSrc = sanitizeUrl(url, { image: true });
        return safeSrc ? `<img alt="${escapeAttribute(alt)}" src="${escapeAttribute(safeSrc)}">` : alt;
    });
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        const safeHref = sanitizeUrl(url);
        return safeHref
            ? `<a href="${escapeAttribute(safeHref)}" target="_blank" rel="noopener noreferrer">${text}</a>`
            : text;
    });
    
    // Lists
    html = html.replace(/^\s*[-*+]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    
    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    
    // Blockquotes
    html = html.replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Horizontal rule
    html = html.replace(/^---$/gim, '<hr>');
    
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    
    // Cleanup
    html = html.replace(/<p><(h[1-6]|ul|ol|pre|blockquote|hr)/g, '<$1');
    html = html.replace(/<\/(h[1-6]|ul|ol|pre|blockquote|hr)><\/p>/g, '</$1>');
    
    return html;
}

// ============================================
// Export / Convert Back
// ============================================
async function convertBack(format) {
    if (!currentMarkdown) {
        showToast('没有可转换的内容', 'error');
        return;
    }
    
    elements.loadingOverlay.hidden = false;
    
    try {
        const formData = new FormData();
        formData.append('markdown', currentMarkdown);
        formData.append('output_format', format);
        formData.append('filename', currentFilename.replace(/\.[^/.]+$/, ''));
        
        const response = await fetch('/api/convert/from-markdown', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '回转失败');
        }
        
        const result = await response.json();
        
        // Download file
        window.location.href = result.download_url;
        
        showToast(`已导出为 ${format.toUpperCase()} 格式`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        elements.loadingOverlay.hidden = true;
    }
}

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(currentMarkdown);
        showToast('已复制到剪贴板', 'success');
    } catch (err) {
        elements.rawEditor.select();
        document.execCommand('copy');
        showToast('已复制到剪贴板', 'success');
    }
}

function downloadMarkdown() {
    if (!currentMarkdown) return;
    
    const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename.replace(/\.[^/.]+$/, '') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// Utilities
// ============================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    const index = filename.lastIndexOf('.');
    return index >= 0 ? filename.slice(index).toLowerCase() : '';
}

function isMarkdownFile(filename) {
    return ['.md', '.markdown', '.mkd'].includes(getFileExtension(filename));
}

function renderExportFormats(formats) {
    if (!Array.isArray(formats) || formats.length === 0) return;
    elements.exportGrid.innerHTML = formats.map(format => `
        <button class="export-card" data-format="${escapeAttribute(format.format)}">
            <span class="export-icon">${escapeHtml(format.icon || '📄')}</span>
            <span class="export-name">${escapeHtml(format.name)}</span>
            <span class="export-ext">.${escapeHtml(format.extension)}</span>
        </button>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttribute(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function sanitizeUrl(url, options = {}) {
    const value = String(url).trim();
    if (!value || /[\u0000-\u001F\u007F]/.test(value)) return '';
    if (value.startsWith('#')) return value;

    try {
        const parsed = new URL(value, window.location.origin);
        const allowedProtocols = options.image ? ['http:', 'https:'] : ['http:', 'https:', 'mailto:'];
        return allowedProtocols.includes(parsed.protocol) ? value : '';
    } catch (e) {
        return '';
    }
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    
    requestAnimationFrame(() => {
        elements.toast.classList.add('show');
    });
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

async function loadSupportedFormats() {
    try {
        const response = await fetch('/api/formats');
        if (response.ok) {
            const formats = await response.json();
            supportedExtensions = formats.all || [];
            exportFormats = formats.export || [];
            elements.fileInput.accept = supportedExtensions.join(',');
            renderExportFormats(exportFormats);
            console.log('支持的格式:', formats);
        }
    } catch (e) {
        console.log('无法加载格式列表');
    }
}
