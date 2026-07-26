import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { HomePage } from "@/pages/home-page"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/",
      title: m.home.title,
      description: m.home.description,
    }),
})
