import { Link, createFileRoute } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/account/billing")({
  component: BillingPage,
  head: () => ({ meta: [{ title: "订阅 — MakeItDown" }] }),
})

function BillingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">付费订阅</h1>
      <p className="mt-2 text-muted-foreground">
        Stripe / 本地支付后续接入。当前可先浏览套餐。
      </p>
      <div className="mt-8 rounded-3xl border bg-background/70 p-6">
        <p className="text-sm text-muted-foreground">当前方案</p>
        <p className="mt-1 text-2xl font-semibold">Free</p>
        <Button className="mt-6" asChild>
          <Link to="/pricing">升级套餐</Link>
        </Button>
      </div>
    </div>
  )
}
