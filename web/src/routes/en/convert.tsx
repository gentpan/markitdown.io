import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { ConvertPage } from "@/pages/convert-page"

const locale = "en" as const
const m = getMessages(locale)

export const Route = createFileRoute("/en/convert")({
  component: ConvertPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/convert",
      title: m.convert.title,
      description: m.convert.description,
    }),
})
