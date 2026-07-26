import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { DocxToMarkdownPage } from "@/pages/tool-pages"

const locale = "en" as const
const m = getMessages(locale)

export const Route = createFileRoute("/en/tools/docx-to-markdown")({
  component: DocxToMarkdownPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/tools/docx-to-markdown",
      title: m.toolDocx.title,
      description: m.toolDocx.description,
    }),
})
