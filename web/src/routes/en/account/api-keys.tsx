import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/en/account/api-keys")({
  beforeLoad: () => {
    throw redirect({ to: "/account/api-keys" })
  },
})
