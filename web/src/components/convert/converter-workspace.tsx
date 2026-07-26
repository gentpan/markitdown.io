import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileDown,
  FileText,
  FileUp,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import {
  FileFormatIcon,
  INPUT_FORMAT_CHIPS,
  UploadDropIcon,
} from "@/components/icons/file-format-icon"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  convertFromMarkdown,
  convertToMarkdown,
  fetchFormats,
  type ConvertToMarkdownResult,
} from "@/lib/api"
import { useLocale } from "@/i18n/context"
import {
  canGuestConvert,
  consumeGuestCredits,
} from "@/lib/guest-credits"
import {
  MAX_UPLOAD_BYTES,
  acceptedExtensions,
  uploadFileSchema,
} from "@/lib/validations/convert"
import { cn } from "@/lib/utils"
import { recordConversion } from "@/server/conversions"

type Props = {
  className?: string
  compact?: boolean
  defaultMode?: "to-md" | "from-md"
}

/** Prefer common export formats first; rest follow. */
const FORMAT_PRIORITY = [
  "pdf",
  "docx",
  "html",
  "pptx",
  "epub",
  "odt",
  "rtf",
  "plain",
  "gfm",
  "commonmark",
]

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function sortFormats(
  formats: Array<{ format: string; name: string; extension: string }>,
) {
  return [...formats].sort((a, b) => {
    const ia = FORMAT_PRIORITY.indexOf(a.format)
    const ib = FORMAT_PRIORITY.indexOf(b.format)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export function ConverterWorkspace({
  className,
  compact = false,
  defaultMode = "to-md",
}: Props) {
  const { t, locale } = useLocale()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"to-md" | "from-md">(defaultMode)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ConvertToMarkdownResult | null>(null)
  const [markdown, setMarkdown] = useState("")
  const [mdSourceName, setMdSourceName] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState("pdf")
  const [copied, setCopied] = useState(false)
  const mdFileInputRef = useRef<HTMLInputElement>(null)

  const formatsQuery = useQuery({
    queryKey: ["formats"],
    queryFn: fetchFormats,
  })

  const markitdownExts = formatsQuery.data?.markitdown ?? []

  const convertMutation = useMutation({
    mutationFn: (selected: File) =>
      convertToMarkdown(selected, (pct) => setProgress(pct)),
    onSuccess: async (data) => {
      consumeGuestCredits(1)
      setResult(data)
      setMarkdown(data.markdown)
      toast.success(t.converter.done)
      try {
        await recordConversion({
          data: {
            filename: data.filename,
            sourceType: data.source_type,
            status: "succeeded",
            downloadUrl: data.download_url,
            fileSize: data.file_size,
            title: data.title,
            preview: data.markdown.slice(0, 2000),
          },
        })
        await queryClient.invalidateQueries({ queryKey: ["conversions"] })
        await queryClient.invalidateQueries({ queryKey: ["usage"] })
      } catch {
        // 历史写入失败不阻断转换结果
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setProgress(0)
    },
  })

  const exportBaseName =
    mdSourceName?.replace(/\.(md|markdown|txt)$/i, "") ||
    result?.filename?.replace(/\.[^.]+$/, "") ||
    "makeitdown"

  const exportMutation = useMutation({
    mutationFn: (format: string) =>
      convertFromMarkdown(markdown, format, exportBaseName),
    onSuccess: (data) => {
      consumeGuestCredits(1)
      window.open(data.download_url, "_blank")
      toast.success(t.converter.exported.replace("{name}", data.filename))
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const loadMarkdownFile = useCallback(
    async (next: File) => {
      const name = next.name.toLowerCase()
      if (!/\.(md|markdown|txt)$/.test(name)) {
        toast.error(
          locale === "en"
            ? "Please upload a .md / .markdown file"
            : "请上传 .md / .markdown 文件",
        )
        return
      }
      if (next.size > MAX_UPLOAD_BYTES) {
        toast.error(`文件不能超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`)
        return
      }
      try {
        const text = await next.text()
        setMarkdown(text)
        setMdSourceName(next.name)
        setResult(null)
        toast.success(t.converter.mdLoaded.replace("{name}", next.name))
      } catch {
        toast.error(locale === "en" ? "Failed to read file" : "读取文件失败")
      }
    },
    [locale, t],
  )

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        toast.error(locale === "en" ? "Clipboard is empty" : "剪贴板为空")
        return
      }
      setMarkdown(text)
      setMdSourceName(null)
      setResult(null)
      toast.success(
        locale === "en" ? "Pasted from clipboard" : "已从剪贴板粘贴",
      )
    } catch {
      toast.error(
        locale === "en"
          ? "Clipboard access denied — paste into the box instead"
          : "无法读取剪贴板，请直接粘贴到下方输入框",
      )
    }
  }, [locale, t])

  const {
    getRootProps: getMdRootProps,
    getInputProps: getMdInputProps,
    isDragActive: isMdDragActive,
  } = useDropzone({
    multiple: false,
    noClick: true,
    maxSize: MAX_UPLOAD_BYTES,
    accept: {
      "text/markdown": [".md", ".markdown"],
      "text/plain": [".md", ".markdown", ".txt"],
    },
    onDrop: (accepted, rejected) => {
      if (rejected[0]) {
        toast.error(
          rejected[0].errors[0]?.message ||
            (locale === "en" ? "File rejected" : "文件被拒绝"),
        )
        return
      }
      const next = accepted[0]
      if (next) void loadMarkdownFile(next)
    },
  })

  useEffect(() => {
    const formats = formatsQuery.data?.export ?? []
    if (!formats.length) return
    if (!formats.some((f) => f.format === exportFormat)) {
      const pdf = formats.find((f) => f.format === "pdf")
      setExportFormat(pdf?.format ?? formats[0]!.format)
    }
  }, [formatsQuery.data, exportFormat])

  const pickFile = useCallback(
    (next: File | null) => {
      if (!next) return
      if (!canGuestConvert()) {
        toast.error(t.converter.exhausted)
        return
      }
      const parsed = uploadFileSchema.safeParse({
        name: next.name,
        size: next.size,
        type: next.type,
      })
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "文件不符合要求")
        return
      }
      setFile(next)
      setResult(null)
      setMarkdown("")
      setProgress(8)
      convertMutation.mutate(next)
    },
    [convertMutation],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    multiple: false,
    noClick: true,
    maxSize: MAX_UPLOAD_BYTES,
    onDrop: (accepted, rejected) => {
      if (rejected[0]) {
        const msg =
          rejected[0].errors[0]?.message || "文件被拒绝，请检查类型或大小"
        toast.error(msg)
        return
      }
      const next = accepted[0]
      if (!next) return
      const ext = `.${next.name.split(".").pop()?.toLowerCase() ?? ""}`
      if (!acceptedExtensions.includes(ext as (typeof acceptedExtensions)[number])) {
        toast.error(`暂不支持 ${ext || "未知"} 类型`)
        return
      }
      pickFile(next)
    },
  })

  function reset() {
    setFile(null)
    setResult(null)
    setMarkdown("")
    setMdSourceName(null)
    setProgress(0)
    convertMutation.reset()
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast.success(t.converter.copied)
    setTimeout(() => setCopied(false), 1500)
  }

  const busy = convertMutation.isPending
  const exportFormats = sortFormats(formatsQuery.data?.export ?? [])

  return (
    <div className={cn("mx-auto w-full max-w-[760px]", className)}>
      <div className="mb-4 flex rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] p-1">
        {(
          [
            {
              id: "to-md" as const,
              label: t.converter.toMd,
              icon: <FileUp className="size-4" />,
            },
            {
              id: "from-md" as const,
              label: t.converter.fromMd,
              icon: <FileDown className="size-4" />,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id)
              if (item.id === "from-md" && !markdown && result?.markdown) {
                setMarkdown(result.markdown)
              }
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3 py-2.5 text-sm transition-colors",
              mode === item.id
                ? "bg-white text-[#0a0e19]"
                : "text-[#636363] hover:text-[#0a0e19]",
            )}
          >
            <span className="opacity-80">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {mode === "from-md" && !result ? (
        <div
          className={cn(
            "rounded-[20px] border border-[#e1e1e1] bg-white",
            compact ? "p-5" : "p-6 sm:p-8",
          )}
        >
          <div
            {...getMdRootProps()}
            className={cn(
              "rounded-[12px] border border-dashed border-[#e1e1e1] bg-[#f2f2f2] px-4 py-5 transition-colors",
              isMdDragActive && "border-[#0a0e19] bg-[#e8e8e8]",
            )}
          >
            <input {...getMdInputProps()} />
            <input
              ref={mdFileInputRef}
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0]
                if (next) void loadMarkdownFile(next)
                e.target.value = ""
              }}
            />
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 size-5 shrink-0 text-[#0a0e19]" />
                <div>
                  <p className="text-[15px] text-[#0a0e19]">
                    {t.converter.uploadMd}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#818181]">
                    {isMdDragActive
                      ? t.converter.dropActive
                      : t.converter.uploadMdHint}
                  </p>
                  {mdSourceName ? (
                    <p className="mt-1 text-[12px] text-[#397554]">
                      {t.converter.mdLoaded.replace("{name}", mdSourceName)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-[8px] bg-white px-3.5 text-[14px] font-normal text-[#0a0e19] shadow-none hover:bg-white/80"
                  onClick={() => mdFileInputRef.current?.click()}
                >
                  <FileUp className="size-3.5" />
                  {t.converter.uploadMd}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-[8px] bg-white px-3.5 text-[14px] font-normal text-[#0a0e19] shadow-none hover:bg-white/80"
                  onClick={() => void pasteFromClipboard()}
                >
                  <ClipboardPaste className="size-3.5" />
                  {t.converter.pasteClipboard}
                </Button>
              </div>
            </div>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e1e1e1]" />
            <p className="text-[12px] text-[#818181]">{t.converter.orPaste}</p>
            <div className="h-px flex-1 bg-[#e1e1e1]" />
          </div>

          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-[#0a0e19]" />
              <p className="text-[14px] text-[#636363]">{t.converter.pickExport}</p>
            </div>
            {markdown.trim() ? (
              <button
                type="button"
                className="text-[13px] text-[#818181] hover:text-[#0a0e19]"
                onClick={() => {
                  setMarkdown("")
                  setMdSourceName(null)
                }}
              >
                {t.converter.clearMd}
              </button>
            ) : null}
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value)
              if (mdSourceName) setMdSourceName(null)
            }}
            placeholder={t.converter.pastePlaceholder}
            className="min-h-52 rounded-[6px] border-[#e1e1e1] font-mono text-sm text-[#0a0e19] focus-visible:border-[#0a0e19] focus-visible:ring-[#0a0e19]/10"
          />
          <ExportGrid
            formats={exportFormats}
            selected={exportFormat}
            onSelect={setExportFormat}
            busy={exportMutation.isPending}
            disabled={!markdown.trim()}
            onExport={(fmt) => {
              if (!canGuestConvert()) {
                toast.error(t.converter.exhausted)
                return
              }
              setExportFormat(fmt)
              exportMutation.mutate(fmt)
            }}
          />
        </div>
      ) : !result ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative overflow-hidden rounded-[20px] border border-[#e1e1e1] bg-white transition-colors",
            isDragActive && "border-[#0a0e19] bg-[#f2f2f2]",
            compact ? "px-5 py-8 sm:px-6" : "px-6 py-10 sm:px-8",
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 text-[#0a0e19]">
              {busy ? (
                <Loader2 className="size-12 animate-spin" />
              ) : (
                <UploadDropIcon />
              )}
            </div>
            <h2 className="text-[20px] leading-[22px] text-[#0a0e19]">
              {busy
                ? t.converter.converting
                : isDragActive
                  ? t.converter.dropActive
                  : t.converter.drop}
            </h2>
            {busy && file ? (
              <p className="mt-2 max-w-sm text-[15px] leading-[1.35] text-[#636363]">
                {t.converter.processing
                  .replace("{name}", file.name)
                  .replace("{size}", formatBytes(file.size))}
              </p>
            ) : null}

            {busy ? (
              <div className="mt-8 w-full max-w-sm space-y-2">
                <Progress value={progress} className="h-2 bg-[#e1e1e1]" />
                <p className="text-xs text-[#636363]">{progress}%</p>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={() => open()}
                    className="h-10 rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] px-8 text-[16px] font-normal text-white shadow-none hover:bg-[#05070f]"
                  >
                    选择文件
                  </Button>
                </div>
                <FormatChipRow
                  className="mt-8"
                  extensions={markitdownExts}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-[20px] border border-[#e1e1e1] bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <FileFormatIcon format="md" className="mt-0.5 size-8" />
              <div className="min-w-0">
                <p className="text-[13px] text-[#818181]">转换结果</p>
                <h2 className="truncate text-[18px] leading-[22px] text-[#0a0e19]">
                  {result.filename}
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyMarkdown}
                className="rounded-[8px] border-[#0a0e19] bg-transparent text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
              >
                {copied ? <Check /> : <Copy />}
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="rounded-[8px] border-[#0a0e19] bg-transparent text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
              >
                <a href={result.download_url} download>
                  <Download />
                  下载 MD
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="text-[#0a0e19] hover:bg-transparent hover:text-[#636363] hover:underline"
              >
                <RotateCcw />
                重新开始
              </Button>
            </div>
          </div>

          <Tabs defaultValue="export">
            <TabsList className="bg-[#f2f2f2]">
              <TabsTrigger value="export">导出</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
              <TabsTrigger value="raw">原文</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-3">
              <pre className="max-h-[28rem] overflow-auto rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[#0a0e19]">
                {markdown}
              </pre>
            </TabsContent>
            <TabsContent value="raw" className="mt-3">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="min-h-[28rem] rounded-[6px] border-[#e1e1e1] font-mono text-sm text-[#0a0e19]"
              />
            </TabsContent>
            <TabsContent value="export" className="mt-3 space-y-2">
              <p className="text-[14px] text-[#636363]">
                点击格式图标即可导出
              </p>
              <ExportGrid
                formats={exportFormats}
                selected={exportFormat}
                onSelect={setExportFormat}
                busy={exportMutation.isPending}
                disabled={!markdown.trim()}
                onExport={(fmt) => {
                  if (!canGuestConvert()) {
                    toast.error(t.converter.exhausted)
                    return
                  }
                  setExportFormat(fmt)
                  exportMutation.mutate(fmt)
                }}
              />
            </TabsContent>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            className="text-[#636363] hover:bg-transparent hover:text-[#0a0e19] hover:underline"
            onClick={reset}
          >
            <X className="size-3.5" />
            清除结果
          </Button>
        </div>
      )}
    </div>
  )
}

function FormatChipRow({
  className,
  extensions = [],
}: {
  className?: string
  extensions?: string[]
}) {
  const labels = extensions.map((ext) =>
    ext.replace(/^\./, "").toUpperCase(),
  )

  return (
    <div className={cn("flex w-full max-w-xl flex-col items-center gap-2", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {INPUT_FORMAT_CHIPS.map((item) => (
          <li
            key={item.format}
            className="flex items-center gap-1.5 rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] px-2.5 py-1.5"
          >
            <FileFormatIcon format={item.format} className="size-5" />
            <span className="text-[12px] text-[#636363]">{item.label}</span>
          </li>
        ))}
      </ul>
      {labels.length ? (
        <p className="max-w-lg text-center text-[12px] leading-[1.45] text-[#818181]">
          {labels.join(" · ")}
        </p>
      ) : null}
    </div>
  )
}

function ExportGrid({
  formats,
  selected,
  onSelect,
  onExport,
  busy,
  disabled,
}: {
  formats: Array<{ format: string; name: string; extension: string }>
  selected: string
  onSelect: (format: string) => void
  onExport: (format: string) => void
  busy: boolean
  disabled: boolean
}) {
  if (!formats.length) {
    return <p className="mt-4 text-sm text-[#818181]">正在加载导出格式…</p>
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {formats.map((item) => {
        const active = selected === item.format
        return (
          <button
            key={item.format}
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              onSelect(item.format)
              onExport(item.format)
            }}
            className={cn(
              "flex items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition-colors disabled:opacity-50",
              active
                ? "border-[#0a0e19] bg-[#0a0e19] text-white"
                : "border-[#e1e1e1] bg-white text-[#0a0e19] hover:border-[#cecece] hover:bg-[#f2f2f2]",
            )}
          >
            <FileFormatIcon
              format={item.format}
              active={active}
              className="size-8"
            />
            <span className="min-w-0">
              <span className="block truncate text-[14px] leading-tight">
                {item.name}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[12px]",
                  active ? "text-white/70" : "text-[#818181]",
                )}
              >
                .{item.extension}
                {busy && active ? " · …" : ""}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
