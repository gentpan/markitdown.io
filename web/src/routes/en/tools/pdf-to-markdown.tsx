import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { PdfToMarkdownPage } from "@/pages/tool-pages"

const locale = "en" as const
const m = getMessages(locale)

export const Route = createFileRoute("/en/tools/pdf-to-markdown")({
  component: PdfToMarkdownPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/tools/pdf-to-markdown",
      title: m.toolPdf.title,
      description: m.toolPdf.description,
    }),
})
