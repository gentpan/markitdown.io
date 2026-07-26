import { ToolPage } from "@/components/seo/tool-page"
import { useLocale } from "@/i18n/context"

export function PdfToMarkdownPage() {
  const { t } = useLocale()
  return (
    <ToolPage
      brand={t.toolPdf.brand}
      title={t.toolPdf.h1}
      description={t.toolPdf.lead}
      acceptHint={t.toolPdf.hint}
      related={[
        { to: "/tools/markdown-to-pdf", label: t.tools.mdPdf },
        { to: "/tools/docx-to-markdown", label: t.tools.docxMd },
      ]}
    />
  )
}

export function MarkdownToPdfPage() {
  const { t } = useLocale()
  return (
    <ToolPage
      brand={t.toolMdPdf.brand}
      title={t.toolMdPdf.h1}
      description={t.toolMdPdf.lead}
      acceptHint={t.toolMdPdf.hint}
      defaultMode="from-md"
      related={[
        { to: "/tools/pdf-to-markdown", label: t.tools.pdfMd },
        { to: "/tools/docx-to-markdown", label: t.tools.docxMd },
      ]}
    />
  )
}

export function DocxToMarkdownPage() {
  const { t } = useLocale()
  return (
    <ToolPage
      brand={t.toolDocx.brand}
      title={t.toolDocx.h1}
      description={t.toolDocx.lead}
      acceptHint={t.toolDocx.hint}
      related={[
        { to: "/tools/pdf-to-markdown", label: t.tools.pdfMd },
        { to: "/tools/markdown-to-pdf", label: t.tools.mdPdf },
      ]}
    />
  )
}
