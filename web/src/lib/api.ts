export type ConvertToMarkdownResult = {
  success: boolean
  title: string
  filename: string
  markdown: string
  download_url: string
  file_size: number
  source_type: string
}

export type ConvertFromMarkdownResult = {
  success: boolean
  filename: string
  download_url: string
  file_size: number
}

export type ExportFormat = {
  format: string
  name: string
  extension: string
  description?: string
  icon?: string
  writer?: string
  aliases?: string[]
}

export type FormatsResponse = {
  markitdown?: string[]
  pandoc?: string[]
  all?: string[]
  export?: ExportFormat[]
  engine?: string
  categories?: Record<
    string,
    {
      name: string
      icon: string
      description: string
      count: number
      extensions: string[]
    }
  >
}

async function parseError(res: Response): Promise<never> {
  let detail = `请求失败 (${res.status})`
  try {
    const data = (await res.json()) as { detail?: string }
    if (data.detail) detail = data.detail
  } catch {
    // ignore
  }
  throw new Error(detail)
}

export async function fetchFormats(): Promise<FormatsResponse> {
  const res = await fetch("/api/formats")
  if (!res.ok) await parseError(res)
  return res.json()
}

export async function convertToMarkdown(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ConvertToMarkdownResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append("file", file)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 90))
    }

    xhr.onload = () => {
      onProgress?.(100)
      try {
        const data = JSON.parse(xhr.responseText) as
          | ConvertToMarkdownResult
          | { detail?: string }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as ConvertToMarkdownResult)
          return
        }
        reject(new Error((data as { detail?: string }).detail || `转换失败 (${xhr.status})`))
      } catch {
        reject(new Error(`转换失败 (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error("网络错误，请确认后端已启动"))
    xhr.open("POST", "/api/convert/to-markdown")
    xhr.send(form)
  })
}

export async function convertFromMarkdown(
  markdown: string,
  outputFormat: string,
  filename?: string,
): Promise<ConvertFromMarkdownResult> {
  const form = new FormData()
  form.append("markdown", markdown)
  form.append("output_format", outputFormat)
  if (filename) form.append("filename", filename)

  const res = await fetch("/api/convert/from-markdown", {
    method: "POST",
    body: form,
  })
  if (!res.ok) await parseError(res)
  return res.json()
}
