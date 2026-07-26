import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { localeFromPathname, localizedPath } from "@/i18n/path"
import { getCurrentUser } from "@/server/auth"

export const Route = createFileRoute("/account")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()
    if (!user) {
      const locale = localeFromPathname(location.pathname)
      throw redirect({
        to: localizedPath(locale, "/login"),
        search: {
          next: `${location.pathname}${location.search}`,
        },
      })
    }
    return { user }
  },
  component: AccountLayout,
})

function AccountLayout() {
  return <Outlet />
}
