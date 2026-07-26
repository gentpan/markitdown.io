import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { MarkdownToPdfPage } from "@/pages/tool-pages"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/tools/markdown-to-pdf")({
  component: MarkdownToPdfPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/tools/markdown-to-pdf",
      title: m.toolMdPdf.title,
      description: m.toolMdPdf.description,
    }),
})
