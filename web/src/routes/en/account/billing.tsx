import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/en/account/billing")({
  beforeLoad: () => {
    throw redirect({ to: "/account/billing" })
  },
})
