import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { DevelopersPage } from "@/routes/developers"

const locale = "en" as const
const m = getMessages(locale)

export const Route = createFileRoute("/en/developers")({
  component: DevelopersPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/developers",
      title: m.developers.title,
      description: m.developers.description,
    }),
})
