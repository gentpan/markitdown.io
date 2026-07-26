import { createFileRoute } from "@tanstack/react-router"
import { Check, Copy } from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { LocaleLink } from "@/components/i18n/locale-link"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/context"
import { getMessages } from "@/i18n/messages"
import { buildSeoHead } from "@/i18n/seo"
import { PAGE_X, PROSE_MAX, SITE_MAX } from "@/lib/layout"
import {
  API_BASE_URL,
  API_PREFIX,
  CREDITS_PER_CONVERSION,
  DAILY_API_CALLS,
  DAILY_WEB_CREDITS,
  quotaCopy,
} from "@/lib/quota"
import { cn } from "@/lib/utils"

const locale = "zh" as const
const m = getMessages(locale)

export const Route = createFileRoute("/developers")({
  component: DevelopersPage,
  head: () =>
    buildSeoHead({
      locale,
      path: "/developers",
      title: m.developers.title,
      description: m.developers.description,
    }),
})

const BASE = `${API_BASE_URL}${API_PREFIX}`

export function DevelopersPage() {
  const { t, locale: currentLocale } = useLocale()
  const isEn = currentLocale === "en"

  return (
    <div className={cn("mx-auto py-12 sm:py-16", SITE_MAX, PAGE_X)}>
      <div className={cn("mx-auto", PROSE_MAX)}>
        <p className="font-display text-[16px] text-[#0a0e19]">Developers</p>
        <h1 className="font-display mt-2 text-[36px] leading-tight text-[#0a0e19] sm:text-[44px]">
          {t.developers.h1}
        </h1>
        <p className="mt-4 text-[16px] leading-[1.45] text-[#636363]">
          {t.developers.leadBefore}{" "}
          <code className="rounded-[4px] border border-[#e1e1e1] bg-[#f2f2f2] px-1.5 py-0.5 text-[13px] text-[#0a0e19]">
            api.markitdown.io
          </code>{" "}
          {t.developers.leadAfter}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            asChild
            className="h-10 rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] px-4 font-normal text-white shadow-none hover:bg-[#05070f]"
          >
            <LocaleLink to="/account/api-keys">
              {isEn ? "Manage API Keys" : "管理 API Keys"}
            </LocaleLink>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-[8px] border-[#0a0e19] font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
          >
            <LocaleLink to="/register">
              {isEn ? "Sign up for daily credits" : "注册领取每日积分"}
            </LocaleLink>
          </Button>
        </div>
      </div>

      {/* Quota */}
      <section
        className={cn("mx-auto mt-12 grid gap-3 sm:grid-cols-3", PROSE_MAX)}
      >
        {[
          {
            title: "转换计费",
            body: quotaCopy.conversionCost,
          },
          {
            title: "网页额度",
            body: `${quotaCopy.dailyGift}，${quotaCopy.noAccumulate}`,
          },
          {
            title: "API 额度",
            body: `${quotaCopy.apiLimit}，每次同样消耗 ${CREDITS_PER_CONVERSION} 积分`,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[16px] border border-[#e1e1e1] bg-white p-5"
          >
            <h2 className="text-[15px] text-[#0a0e19]">{item.title}</h2>
            <p className="mt-2 text-[14px] leading-[1.4] text-[#636363]">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <div className={cn("mx-auto mt-12 space-y-12", PROSE_MAX)}>
        <DocSection id="base" title="Base URL">
          <CodeBlock language="text" code={BASE} />
          <p className="mt-3 text-[14px] text-[#636363]">
            下文路径均相对于{" "}
            <code className="text-[#0a0e19]">{BASE}</code>。也可使用等价前缀{" "}
            <code className="text-[#0a0e19]">/api/convert/*</code>（无版本号）。
          </p>
        </DocSection>

        <DocSection id="auth" title="鉴权">
          <p className="text-[15px] leading-[1.45] text-[#636363]">
            在请求头携带 API Key（二选一）：
          </p>
          <CodeBlock
            language="http"
            code={`Authorization: Bearer mk_live_xxxxxxxx\n# 或\nX-API-Key: mk_live_xxxxxxxx`}
          />
          <ul className="mt-4 space-y-2 text-[14px] text-[#636363]">
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              Key 在{" "}
              <LocaleLink
                to="/account/api-keys"
                className="text-[#0a0e19] underline underline-offset-4"
              >
                Account → API Keys
              </LocaleLink>{" "}
              创建
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              API 每日上限 {DAILY_API_CALLS} 次；超出返回{" "}
              <code className="text-[#0a0e19]">429</code>
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              网页转换每日 {DAILY_WEB_CREDITS} 积分，与 API 次数分开计数，均不跨日累计
            </li>
          </ul>
        </DocSection>

        <DocSection id="to-markdown" title="文件 → Markdown">
          <p className="mb-3 text-[14px] text-[#818181]">
            <span className="rounded-[4px] bg-[#0a0e19] px-1.5 py-0.5 text-[12px] text-white">
              POST
            </span>{" "}
            <code className="text-[#0a0e19]">/convert/to-markdown</code>
            <span className="ml-2">消耗 {CREDITS_PER_CONVERSION} 积分</span>
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X POST "${BASE}/convert/to-markdown" \\
  -H "Authorization: Bearer mk_live_xxxxxxxx" \\
  -F "file=@./document.pdf"`}
          />
          <p className="mt-4 text-[14px] font-medium text-[#0a0e19]">响应示例</p>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "title": "document",
  "filename": "document.pdf",
  "markdown": "# Hello\\n\\n...",
  "download_url": "/api/download/xxxx.md",
  "file_size": 1234,
  "source_type": "input"
}`}
          />
        </DocSection>

        <DocSection id="from-markdown" title="Markdown → 文件">
          <p className="mb-3 text-[14px] text-[#818181]">
            <span className="rounded-[4px] bg-[#0a0e19] px-1.5 py-0.5 text-[12px] text-white">
              POST
            </span>{" "}
            <code className="text-[#0a0e19]">/convert/from-markdown</code>
            <span className="ml-2">消耗 {CREDITS_PER_CONVERSION} 积分</span>
          </p>
          <CodeBlock
            language="bash"
            code={`curl -X POST "${BASE}/convert/from-markdown" \\
  -H "Authorization: Bearer mk_live_xxxxxxxx" \\
  -F "markdown=# Hello MakeItDown" \\
  -F "output_format=pdf" \\
  -F "filename=hello"`}
          />
          <p className="mt-3 text-[14px] text-[#636363]">
            常用 <code className="text-[#0a0e19]">output_format</code>：
            <code className="mx-1 text-[#0a0e19]">pdf</code>
            <code className="mx-1 text-[#0a0e19]">docx</code>
            <code className="mx-1 text-[#0a0e19]">html</code>
            <code className="mx-1 text-[#0a0e19]">pptx</code>
            <code className="mx-1 text-[#0a0e19]">epub</code>
          </p>
          <CodeBlock
            language="json"
            code={`{
  "success": true,
  "filename": "hello_a1b2c3d4.pdf",
  "download_url": "/api/download/hello_a1b2c3d4.pdf",
  "file_size": 58081
}`}
          />
        </DocSection>

        <DocSection id="download" title="下载结果">
          <p className="mb-3 text-[14px] text-[#818181]">
            <span className="rounded-[4px] border border-[#0a0e19] px-1.5 py-0.5 text-[12px] text-[#0a0e19]">
              GET
            </span>{" "}
            <code className="text-[#0a0e19]">/download/{"{filename}"}</code>
          </p>
          <CodeBlock
            language="bash"
            code={`curl -L "${API_BASE_URL}/api/download/hello_a1b2c3d4.pdf" \\
  -H "Authorization: Bearer mk_live_xxxxxxxx" \\
  -o hello.pdf`}
          />
        </DocSection>

        <DocSection id="formats" title="支持格式">
          <p className="mb-3 text-[14px] text-[#818181]">
            <span className="rounded-[4px] border border-[#0a0e19] px-1.5 py-0.5 text-[12px] text-[#0a0e19]">
              GET
            </span>{" "}
            <code className="text-[#0a0e19]">/formats</code>
          </p>
          <CodeBlock
            language="bash"
            code={`curl "${API_BASE_URL}/api/formats"`}
          />
        </DocSection>

        <DocSection id="health" title="健康检查">
          <CodeBlock
            language="bash"
            code={`curl "${API_BASE_URL}/api/health"`}
          />
        </DocSection>

        <DocSection id="js" title="JavaScript 示例">
          <CodeBlock
            language="javascript"
            code={`const form = new FormData()
form.append("file", fileInput.files[0])

const res = await fetch("${BASE}/convert/to-markdown", {
  method: "POST",
  headers: {
    Authorization: "Bearer mk_live_xxxxxxxx",
  },
  body: form,
})

const data = await res.json()
if (!res.ok) throw new Error(data.detail || "转换失败")
console.log(data.markdown)`}
          />
        </DocSection>

        <DocSection id="python" title="Python 示例">
          <CodeBlock
            language="python"
            code={`import requests

url = "${BASE}/convert/to-markdown"
headers = {"Authorization": "Bearer mk_live_xxxxxxxx"}

with open("document.pdf", "rb") as f:
    r = requests.post(url, headers=headers, files={"file": f})

r.raise_for_status()
print(r.json()["markdown"])`}
          />
        </DocSection>

        <DocSection id="errors" title="错误码">
          <div className="overflow-hidden rounded-[12px] border border-[#e1e1e1]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#f2f2f2] text-[#636363]">
                <tr>
                  <th className="px-4 py-3 font-normal">状态码</th>
                  <th className="px-4 py-3 font-normal">含义</th>
                </tr>
              </thead>
              <tbody className="text-[#0a0e19]">
                {[
                  ["400", "不支持的格式或转换失败"],
                  ["401", "缺少或无效的 API Key"],
                  ["413", "文件超过大小限制"],
                  ["429", "今日 API 次数或积分已用尽"],
                  ["500", "服务内部错误"],
                ].map(([code, meaning]) => (
                  <tr key={code} className="border-t border-[#e1e1e1]">
                    <td className="px-4 py-3 font-mono text-[13px]">{code}</td>
                    <td className="px-4 py-3 text-[#636363]">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>

        <DocSection id="rules" title="积分与额度规则">
          <ul className="space-y-3 text-[15px] text-[#636363]">
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              注册用户每日获赠 {DAILY_WEB_CREDITS}{" "}
              积分，用于网页转换台；当日未用完清零，不可累计。
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              任意一次成功转换（网页或 API）消耗 {CREDITS_PER_CONVERSION} 积分。
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              API 额外限制：每个账号每日最多 {DAILY_API_CALLS}{" "}
              次调用（与网页 {DAILY_WEB_CREDITS} 次额度独立）。
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#397554]" />
              额度按 UTC+0 或服务器日界重置；具体以账户中心显示为准。
            </li>
          </ul>
        </DocSection>
      </div>
    </div>
  )
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-[22px] leading-tight text-[#0a0e19]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("已复制")
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#e1e1e1] bg-[#0a0e19]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[12px] text-white/50">{language}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[12px] text-white/70 hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 text-[13px] leading-relaxed text-white/90",
          "font-mono whitespace-pre",
        )}
      >
        {code}
      </pre>
    </div>
  )
}
