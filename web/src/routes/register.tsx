import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { RegisterPage } from "@/pages/register-page"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/register",
      title: m.auth.registerTitle,
      description: m.auth.registerDesc,
    }),
})
