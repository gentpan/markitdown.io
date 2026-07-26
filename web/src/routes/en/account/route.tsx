import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { getCurrentUser } from "@/server/auth"

export const Route = createFileRoute("/en/account")({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({
        to: "/en/login",
        search: {
          next: `${location.pathname}${location.search}`,
        },
      })
    }
    return { user }
  },
  component: () => <Outlet />,
})
