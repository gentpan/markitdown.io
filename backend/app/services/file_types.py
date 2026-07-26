"""
支持的文件类型配置
智能路由：MD → Pandoc，其他 → MarkItDown
"""
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional
from enum import Enum


class ConverterType(Enum):
    """转换器类型"""
    MARKITDOWN = "markitdown"
    PANDOC = "pandoc"


@dataclass
class FileTypeInfo:
    """文件类型信息"""
    extension: str
    name: str
    icon: str
    description: str
    converter: ConverterType
    category: str


PANDOC_EXTENSION_FORMATS: Dict[str, str] = {
    ".adoc": "asciidoc",
    ".asciidoc": "asciidoc",
    ".bib": "bibtex",
    ".biblatex": "biblatex",
    ".commonmark": "commonmark",
    ".creole": "creole",
    ".csljson": "csljson",
    ".dbk": "docbook",
    ".djot": "djot",
    ".docbook": "docbook",
    ".dokuwiki": "dokuwiki",
    ".enxml": "endnotexml",
    ".fb2": "fb2",
    ".gfm": "gfm",
    ".haddock": "haddock",
    ".jats": "jats",
    ".jira": "jira",
    ".latex": "latex",
    ".ltx": "latex",
    ".man": "man",
    ".markdown": "markdown",
    ".md": "markdown",
    ".mdoc": "mdoc",
    ".mediawiki": "mediawiki",
    ".mkd": "markdown",
    ".muse": "muse",
    ".native": "native",
    ".opml": "opml",
    ".org": "org",
    ".pod": "pod",
    ".ris": "ris",
    ".rst": "rst",
    ".rtf": "rtf",
    ".t2t": "t2t",
    ".tex": "latex",
    ".textile": "textile",
    ".tikiwiki": "tikiwiki",
    ".tsv": "tsv",
    ".twiki": "twiki",
    ".typ": "typst",
    ".typst": "typst",
    ".vimwiki": "vimwiki",
    ".wiki": "mediawiki",
}


# 支持的文件类型配置
SUPPORTED_TYPES: List[FileTypeInfo] = [
    # ========== MarkItDown 支持的类型 ==========
    # Office 文档
    FileTypeInfo(".pdf", "PDF", "📄", "Portable Document Format", ConverterType.MARKITDOWN, "document"),
    FileTypeInfo(".docx", "Word", "📝", "Microsoft Word", ConverterType.MARKITDOWN, "document"),
    FileTypeInfo(".pptx", "PowerPoint", "📊", "Microsoft PowerPoint", ConverterType.MARKITDOWN, "document"),
    FileTypeInfo(".xls", "Excel", "📈", "Microsoft Excel 97-2003", ConverterType.MARKITDOWN, "document"),
    FileTypeInfo(".xlsx", "Excel", "📈", "Microsoft Excel", ConverterType.MARKITDOWN, "document"),
    FileTypeInfo(".msg", "Outlook", "✉️", "Outlook Message", ConverterType.MARKITDOWN, "document"),
    
    # 文本文档
    FileTypeInfo(".txt", "Text", "📃", "Plain Text", ConverterType.MARKITDOWN, "text"),
    FileTypeInfo(".text", "Text", "📃", "Plain Text", ConverterType.MARKITDOWN, "text"),
    FileTypeInfo(".html", "HTML", "🌐", "HTML Document", ConverterType.MARKITDOWN, "text"),
    FileTypeInfo(".htm", "HTML", "🌐", "HTML Document", ConverterType.MARKITDOWN, "text"),
    FileTypeInfo(".jsonl", "JSONL", "📋", "JSON Lines", ConverterType.MARKITDOWN, "data"),
    
    # 图片 (OCR)
    FileTypeInfo(".png", "PNG", "🖼️", "PNG Image (OCR)", ConverterType.MARKITDOWN, "image"),
    FileTypeInfo(".jpg", "JPEG", "🖼️", "JPEG Image (OCR)", ConverterType.MARKITDOWN, "image"),
    FileTypeInfo(".jpeg", "JPEG", "🖼️", "JPEG Image (OCR)", ConverterType.MARKITDOWN, "image"),
    
    # 音频 (转录)
    FileTypeInfo(".mp3", "MP3", "🎵", "MP3 Audio (Transcription)", ConverterType.MARKITDOWN, "audio"),
    FileTypeInfo(".wav", "WAV", "🎵", "WAV Audio (Transcription)", ConverterType.MARKITDOWN, "audio"),
    FileTypeInfo(".m4a", "M4A", "🎵", "M4A Audio (Transcription)", ConverterType.MARKITDOWN, "audio"),
    FileTypeInfo(".mp4", "MP4", "🎵", "MP4 Audio/Video (Transcription)", ConverterType.MARKITDOWN, "audio"),
    
    # 代码文件
    # 数据格式
    FileTypeInfo(".json", "JSON", "📋", "JSON Data", ConverterType.MARKITDOWN, "data"),
    FileTypeInfo(".csv", "CSV", "📊", "CSV Data", ConverterType.MARKITDOWN, "data"),
    FileTypeInfo(".ipynb", "Notebook", "📓", "Jupyter Notebook", ConverterType.MARKITDOWN, "data"),
    FileTypeInfo(".xml", "XML", "📋", "RSS/Atom XML Feed", ConverterType.MARKITDOWN, "data"),
    FileTypeInfo(".rss", "RSS", "📰", "RSS Feed", ConverterType.MARKITDOWN, "data"),
    FileTypeInfo(".atom", "Atom", "📰", "Atom Feed", ConverterType.MARKITDOWN, "data"),
    
    # 压缩包 / 电子书
    FileTypeInfo(".zip", "ZIP", "📦", "ZIP Archive", ConverterType.MARKITDOWN, "archive"),
    FileTypeInfo(".epub", "EPUB", "📚", "EPUB eBook", ConverterType.MARKITDOWN, "ebook"),
    
    # ========== Pandoc 支持的类型 (输入) ==========
    # Markdown 本身
    FileTypeInfo(".md", "Markdown", "📝", "Markdown Document", ConverterType.PANDOC, "markdown"),
    FileTypeInfo(".markdown", "Markdown", "📝", "Markdown Document", ConverterType.PANDOC, "markdown"),
    FileTypeInfo(".mkd", "Markdown", "📝", "Markdown Document", ConverterType.PANDOC, "markdown"),
    
    # Pandoc 支持的其他输入格式
    FileTypeInfo(".adoc", "AsciiDoc", "📄", "AsciiDoc Document", ConverterType.PANDOC, "text"),
    FileTypeInfo(".asciidoc", "AsciiDoc", "📄", "AsciiDoc Document", ConverterType.PANDOC, "text"),
    FileTypeInfo(".bib", "BibTeX", "📚", "BibTeX Bibliography", ConverterType.PANDOC, "data"),
    FileTypeInfo(".biblatex", "BibLaTeX", "📚", "BibLaTeX Bibliography", ConverterType.PANDOC, "data"),
    FileTypeInfo(".commonmark", "CommonMark", "📝", "CommonMark Markdown", ConverterType.PANDOC, "markdown"),
    FileTypeInfo(".creole", "Creole", "📄", "Creole Wiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".csljson", "CSL JSON", "📋", "CSL JSON Bibliography", ConverterType.PANDOC, "data"),
    FileTypeInfo(".dbk", "DocBook", "📄", "DocBook XML", ConverterType.PANDOC, "document"),
    FileTypeInfo(".djot", "Djot", "📄", "Djot Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".docbook", "DocBook", "📄", "DocBook XML", ConverterType.PANDOC, "document"),
    FileTypeInfo(".enxml", "EndNote XML", "📚", "EndNote XML Bibliography", ConverterType.PANDOC, "data"),
    FileTypeInfo(".fb2", "FictionBook", "📚", "FictionBook eBook", ConverterType.PANDOC, "ebook"),
    FileTypeInfo(".gfm", "GFM", "📝", "GitHub Flavored Markdown", ConverterType.PANDOC, "markdown"),
    FileTypeInfo(".haddock", "Haddock", "📄", "Haddock Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".jats", "JATS", "📄", "JATS XML", ConverterType.PANDOC, "document"),
    FileTypeInfo(".jira", "Jira", "📄", "Jira Wiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".latex", "LaTeX", "📄", "LaTeX Source", ConverterType.PANDOC, "document"),
    FileTypeInfo(".ltx", "LaTeX", "📄", "LaTeX Source", ConverterType.PANDOC, "document"),
    FileTypeInfo(".man", "Man", "📄", "Man Page", ConverterType.PANDOC, "document"),
    FileTypeInfo(".mdoc", "Mdoc", "📄", "Mdoc Page", ConverterType.PANDOC, "document"),
    FileTypeInfo(".mediawiki", "MediaWiki", "📄", "MediaWiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".muse", "Muse", "📄", "Muse Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".native", "Pandoc Native", "📄", "Pandoc Native Format", ConverterType.PANDOC, "data"),
    FileTypeInfo(".odt", "ODT", "📄", "OpenDocument Text", ConverterType.PANDOC, "document"),
    FileTypeInfo(".opml", "OPML", "📋", "OPML Outline", ConverterType.PANDOC, "data"),
    FileTypeInfo(".org", "Org", "📄", "Org Mode", ConverterType.PANDOC, "text"),
    FileTypeInfo(".pod", "POD", "📄", "Perl POD", ConverterType.PANDOC, "text"),
    FileTypeInfo(".ris", "RIS", "📚", "RIS Bibliography", ConverterType.PANDOC, "data"),
    FileTypeInfo(".rst", "reST", "📄", "reStructuredText", ConverterType.PANDOC, "text"),
    FileTypeInfo(".rtf", "RTF", "📄", "Rich Text Format", ConverterType.PANDOC, "text"),
    FileTypeInfo(".t2t", "txt2tags", "📄", "txt2tags Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".tex", "LaTeX", "📄", "LaTeX Source", ConverterType.PANDOC, "document"),
    FileTypeInfo(".textile", "Textile", "📄", "Textile Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".tikiwiki", "TikiWiki", "📄", "TikiWiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".tsv", "TSV", "📊", "Tab-Separated Values", ConverterType.PANDOC, "data"),
    FileTypeInfo(".twiki", "TWiki", "📄", "TWiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".typ", "Typst", "📄", "Typst Source", ConverterType.PANDOC, "document"),
    FileTypeInfo(".typst", "Typst", "📄", "Typst Source", ConverterType.PANDOC, "document"),
    FileTypeInfo(".vimwiki", "Vimwiki", "📄", "Vimwiki Markup", ConverterType.PANDOC, "text"),
    FileTypeInfo(".wiki", "Wiki", "📄", "Wiki Markup", ConverterType.PANDOC, "text"),
]


# 分类信息（与 Microsoft MarkItDown README 类别对齐；空分类不返回）
# https://github.com/microsoft/markitdown
CATEGORIES = {
    "document": {"name": "文档", "icon": "📄", "description": "PDF / Word / PPT / Excel / Outlook"},
    "text": {"name": "文本与网页", "icon": "📝", "description": "TXT / HTML 等"},
    "image": {"name": "图片", "icon": "🖼️", "description": "PNG / JPEG（元数据与 OCR）"},
    "audio": {"name": "音频", "icon": "🎵", "description": "MP3 / WAV / M4A / MP4 转录"},
    "data": {"name": "数据", "icon": "📊", "description": "CSV / JSON / XML / Notebook"},
    "archive": {"name": "压缩包", "icon": "📦", "description": "ZIP（遍历内部文件）"},
    "ebook": {"name": "电子书", "icon": "📚", "description": "EPUB"},
    "markdown": {"name": "Markdown", "icon": "📑", "description": "Pandoc 输入 / 回转"},
}


# 导出格式 (Pandoc 回转支持)
EXPORT_FORMATS = [
    {"format": "docx", "writer": "docx", "extension": "docx", "name": "Word", "icon": "📄", "description": "Microsoft Word", "aliases": ["word"]},
    {"format": "pdf", "writer": "pdf", "extension": "pdf", "name": "PDF", "icon": "📑", "description": "Portable Document"},
    {"format": "html", "writer": "html", "extension": "html", "name": "HTML", "icon": "🌐", "description": "Web Page"},
    {"format": "pptx", "writer": "pptx", "extension": "pptx", "name": "PowerPoint", "icon": "📊", "description": "Presentation", "aliases": ["ppt"]},
    {"format": "epub", "writer": "epub", "extension": "epub", "name": "EPUB", "icon": "📚", "description": "eBook Format"},
    {"format": "odt", "writer": "odt", "extension": "odt", "name": "ODT", "icon": "📄", "description": "OpenDocument"},
    {"format": "rtf", "writer": "rtf", "extension": "rtf", "name": "RTF", "icon": "📄", "description": "Rich Text"},
    {"format": "txt", "writer": "plain", "extension": "txt", "name": "Text", "icon": "📃", "description": "Plain Text", "aliases": ["text"]},
    {"format": "latex", "writer": "latex", "extension": "tex", "name": "LaTeX", "icon": "📄", "description": "LaTeX Source", "aliases": ["tex"]},
    {"format": "commonmark", "writer": "commonmark", "extension": "md", "name": "CommonMark", "icon": "📝", "description": "CommonMark Markdown"},
    {"format": "gfm", "writer": "gfm", "extension": "md", "name": "GitHub Markdown", "icon": "📝", "description": "GitHub Flavored Markdown"},
    {"format": "rst", "writer": "rst", "extension": "rst", "name": "reST", "icon": "📄", "description": "reStructuredText"},
    {"format": "asciidoc", "writer": "asciidoc", "extension": "adoc", "name": "AsciiDoc", "icon": "📄", "description": "AsciiDoc Markup"},
    {"format": "org", "writer": "org", "extension": "org", "name": "Org", "icon": "📄", "description": "Org Mode"},
    {"format": "typst", "writer": "typst", "extension": "typ", "name": "Typst", "icon": "📄", "description": "Typst Source", "aliases": ["typ"]},
    {"format": "docbook", "writer": "docbook", "extension": "xml", "name": "DocBook", "icon": "📄", "description": "DocBook XML"},
    {"format": "opml", "writer": "opml", "extension": "opml", "name": "OPML", "icon": "📋", "description": "Outline Processor Markup"},
    {"format": "ipynb", "writer": "ipynb", "extension": "ipynb", "name": "Notebook", "icon": "📓", "description": "Jupyter Notebook"},
    {"format": "json", "writer": "json", "extension": "json", "name": "Pandoc JSON", "icon": "📋", "description": "Pandoc AST JSON"},
]


def get_file_type_info(extension: str) -> Optional[FileTypeInfo]:
    """获取文件类型信息"""
    ext = extension.lower()
    if not ext.startswith('.'):
        ext = '.' + ext
    
    for ft in SUPPORTED_TYPES:
        if ft.extension == ext:
            return ft
    return None


def get_converter_for_file(filename: str) -> ConverterType:
    """
    智能选择转换器
    - MD 文件 → Pandoc (用于回转)
    - 其他 → MarkItDown
    """
    info = get_file_type_info(Path(filename).suffix)
    return info.converter if info else ConverterType.MARKITDOWN


def get_pandoc_input_format(filename: str) -> Optional[str]:
    """Return the Pandoc input format for a supported file extension."""
    return PANDOC_EXTENSION_FORMATS.get(Path(filename).suffix.lower())


def is_supported(filename: str) -> bool:
    """检查文件是否受支持"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if not ext:
        return False
    
    full_ext = '.' + ext
    return any(ft.extension == full_ext for ft in SUPPORTED_TYPES)


def get_supported_extensions() -> dict:
    """获取所有支持的扩展名"""
    markitdown_exts = []
    pandoc_exts = []
    
    for ft in SUPPORTED_TYPES:
        if ft.converter == ConverterType.MARKITDOWN:
            markitdown_exts.append(ft.extension)
        else:
            pandoc_exts.append(ft.extension)
    
    return {
        "markitdown": sorted(markitdown_exts),
        "pandoc": sorted(pandoc_exts),
        "all": sorted(markitdown_exts + pandoc_exts)
    }


def get_types_by_category(
    converter: Optional[ConverterType] = None,
) -> dict:
    """按分类获取文件类型；可按转换引擎过滤（如仅 MarkItDown）。"""
    result = {}
    for category_key, category_info in CATEGORIES.items():
        types = [ft for ft in SUPPORTED_TYPES if ft.category == category_key]
        if converter is not None:
            types = [ft for ft in types if ft.converter == converter]
        if types:
            result[category_key] = {
                **category_info,
                "types": types,
            }
    return result
