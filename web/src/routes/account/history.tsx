import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listRecentConversions } from "@/server/conversions"

export const Route = createFileRoute("/account/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "转换历史 — MakeItDown" }] }),
})

function HistoryPage() {
  const historyQuery = useQuery({
    queryKey: ["conversions"],
    queryFn: () => listRecentConversions(),
  })

  const rows = historyQuery.data ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">转换历史</h1>
      <p className="mt-2 text-muted-foreground">数据来自 Drizzle `app_conversions`。</p>
      <div className="mt-8 overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文件</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  {historyQuery.isLoading ? "加载中…" : "暂无记录，先去转换一个文件吧。"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.filename}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.fileSize} B</TableCell>
                  <TableCell>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
