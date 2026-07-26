import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/en/account/history")({
  beforeLoad: () => {
    throw redirect({ to: "/account/history" })
  },
})
