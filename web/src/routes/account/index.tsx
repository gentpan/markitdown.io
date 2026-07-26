import { createFileRoute, getRouteApi } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { AccountHomePage } from "@/pages/account-home"

const accountRoute = getRouteApi("/account")
const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/account/")({
  component: AccountPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/account",
      title: m.account.title,
      description: m.account.description,
      noindex: true,
    }),
})

function AccountPage() {
  const { user } = accountRoute.useRouteContext()
  return <AccountHomePage user={user} />
}
