import { z } from "zod"

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/**
 * Extensions we accept for file → Markdown.
 * Aligned with Microsoft MarkItDown converters + common Pandoc text inputs we route.
 * Source of truth for MarkItDown side: backend `SUPPORTED_TYPES` / GET /api/formats.
 */
export const acceptedExtensions = [
  // MarkItDown — Office / PDF / mail
  ".pdf",
  ".docx",
  ".pptx",
  ".xls",
  ".xlsx",
  ".msg",
  // MarkItDown — text / web
  ".txt",
  ".text",
  ".html",
  ".htm",
  ".md",
  ".markdown",
  // MarkItDown — data
  ".csv",
  ".json",
  ".jsonl",
  ".xml",
  ".rss",
  ".atom",
  ".ipynb",
  // MarkItDown — media / archive / ebook
  ".png",
  ".jpg",
  ".jpeg",
  ".mp3",
  ".wav",
  ".m4a",
  ".mp4",
  ".zip",
  ".epub",
  // Pandoc extras commonly uploaded for → MD
  ".rtf",
  ".odt",
] as const

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, `文件不能超过 ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`),
  type: z.string().optional(),
})

export const recordConversionSchema = z.object({
  filename: z.string().min(1),
  sourceType: z.string().default("input"),
  status: z.enum(["succeeded", "failed"]).default("succeeded"),
  downloadUrl: z.string().optional(),
  fileSize: z.number().int().nonnegative().default(0),
  title: z.string().optional(),
  preview: z.string().max(4000).optional(),
  clientIp: z.string().optional(),
})

export const exportMarkdownSchema = z.object({
  markdown: z.string().min(1, "Markdown 不能为空"),
  outputFormat: z.string().min(1).default("docx"),
  filename: z.string().optional(),
})

export type RecordConversionInput = z.infer<typeof recordConversionSchema>
