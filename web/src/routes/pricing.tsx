import { createFileRoute } from "@tanstack/react-router"

import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { PricingPage } from "@/pages/pricing-page"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/pricing",
      title: m.pricing.title,
      description: m.pricing.description,
    }),
})
