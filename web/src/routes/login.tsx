import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { LoginPage } from "@/pages/login-page"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    next: z.string().optional(),
  }),
  component: LoginRoute,
  head: () =>
    buildSeoHead({
      locale,
      path: "/login",
      title: m.auth.loginTitle,
      description: m.auth.loginDesc,
    }),
})

function LoginRoute() {
  const { next } = Route.useSearch()
  return <LoginPage next={next} />
}
