import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "管理后台 — MakeItDown" }] }),
})

function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="size-5 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">管理后台</h1>
      </div>
      <p className="text-muted-foreground">
        组件更新、每周版本检查与系统操作目前仍在 FastAPI `/admin`。前端管理台将逐步迁移到此。
      </p>
      <Button className="mt-8" asChild>
        <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer">
          打开现有管理后台
          <ExternalLink />
        </a>
      </Button>
    </div>
  )
}
