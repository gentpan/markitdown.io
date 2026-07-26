import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { BookOpen, Copy, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  API_BASE_URL,
  API_PREFIX,
  DAILY_API_CALLS,
  quotaCopy,
} from "@/lib/quota"
import { createApiKey, listApiKeys, revokeApiKey } from "@/server/api-keys"

export const Route = createFileRoute("/account/api-keys")({
  component: ApiKeysPage,
  head: () => ({ meta: [{ title: "API Keys — MakeItDown" }] }),
})

const BASE = `${API_BASE_URL}${API_PREFIX}`

function ApiKeysPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("default")
  const [freshKey, setFreshKey] = useState<string | null>(null)

  const keysQuery = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => listApiKeys(),
  })

  const createMutation = useMutation({
    mutationFn: () => createApiKey({ data: { name: name.trim() || "default" } }),
    onSuccess: (data) => {
      setFreshKey(data.key)
      toast.success("Key 已创建，请立即复制保存")
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "创建失败")
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey({ data: { id } }),
    onSuccess: () => {
      toast.success("已吊销")
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "操作失败")
    },
  })

  const keys = keysQuery.data ?? []
  const sample = freshKey ?? "mk_live_xxxxxxxx"

  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[16px] text-[#0a0e19]">Account</p>
          <h1 className="mt-1 text-[28px] tracking-tight text-[#0a0e19]">
            API Keys
          </h1>
          <p className="mt-2 text-[15px] text-[#636363]">
            用于调用{" "}
            <code className="rounded-[4px] border border-[#e1e1e1] bg-[#f2f2f2] px-1 text-[13px]">
              {BASE}
            </code>
            。{quotaCopy.apiLimit}。
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[16px] border border-[#e1e1e1] bg-white p-4">
          <p className="text-[13px] text-[#818181]">今日 API 上限</p>
          <p className="mt-1 text-[22px] text-[#0a0e19]">
            {DAILY_API_CALLS} 次 / 天
          </p>
        </div>
        <div className="rounded-[16px] border border-[#e1e1e1] bg-white p-4">
          <p className="text-[13px] text-[#818181]">计费规则</p>
          <p className="mt-1 text-[15px] text-[#0a0e19]">
            1 次调用 = 1 积分
          </p>
          <p className="mt-1 text-[13px] text-[#636363]">与网页额度分开，均不累计</p>
        </div>
      </div>

      <div className="mt-6 rounded-[20px] border border-[#e1e1e1] bg-white p-5">
        <p className="text-[15px] text-[#0a0e19]">新建 Key</p>
        <p className="mt-1 text-[13px] text-[#818181]">
          明文只显示一次，请妥善保存。
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称，如 production"
            className="h-10 rounded-[8px] border-[#e1e1e1]"
          />
          <Button
            className="h-10 shrink-0 rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] font-normal text-white shadow-none hover:bg-[#05070f]"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Plus />
            {createMutation.isPending ? "创建中…" : "新建 Key"}
          </Button>
        </div>

        {freshKey ? (
          <div className="mt-4 rounded-[12px] border border-[#397554]/30 bg-[#397554]/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] text-[#397554]">新 Key（仅显示一次）</p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-[8px] border-[#e1e1e1] font-normal shadow-none"
                onClick={async () => {
                  await navigator.clipboard.writeText(freshKey)
                  toast.success("已复制")
                }}
              >
                <Copy className="size-3.5" />
                复制
              </Button>
            </div>
            <code className="mt-2 block break-all font-mono text-[13px] text-[#0a0e19]">
              {freshKey}
            </code>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-[15px] text-[#0a0e19]">我的 Keys</p>
        {keysQuery.isLoading ? (
          <p className="text-[14px] text-[#818181]">加载中…</p>
        ) : keys.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[#e1e1e1] px-4 py-8 text-center text-[14px] text-[#818181]">
            还没有 Key，创建后即可调用 API。
          </p>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#e1e1e1] bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[15px] text-[#0a0e19]">{key.name}</p>
                <p className="mt-0.5 font-mono text-[13px] text-[#636363]">
                  {key.prefix}…
                  {!key.isActive ? (
                    <span className="ml-2 text-[#c23b22]">已吊销</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[12px] text-[#818181]">
                  创建于 {new Date(key.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              {key.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[8px] border-[#e1e1e1] font-normal text-[#c23b22] shadow-none"
                  disabled={revokeMutation.isPending}
                  onClick={() => {
                    if (confirm(`确认吊销 ${key.name}？`)) {
                      revokeMutation.mutate(key.id)
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                  吊销
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 rounded-[20px] border border-[#e1e1e1] bg-[#f2f2f2] p-5">
        <p className="text-[15px] text-[#0a0e19]">快速调用</p>
        <pre className="mt-3 overflow-x-auto rounded-[12px] border border-[#e1e1e1] bg-[#0a0e19] p-4 font-mono text-[12px] leading-relaxed text-white/90">
{`curl -X POST "${BASE}/convert/to-markdown" \\
  -H "Authorization: Bearer ${sample}" \\
  -F "file=@./document.pdf"`}
        </pre>
        <Button
          asChild
          variant="outline"
          className="mt-4 h-10 rounded-[8px] border-[#0a0e19] bg-white font-normal text-[#0a0e19] shadow-none hover:bg-white"
        >
          <Link to="/developers">
            <BookOpen className="size-4" />
            查看完整 API 文档
          </Link>
        </Button>
      </div>
    </div>
  )
}
