import { QueryClientProvider } from "@tanstack/react-query"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import { useState } from "react"

import { SiteShell } from "@/components/layout/site-shell"
import { Toaster } from "@/components/ui/sonner"
import { createQueryClient } from "@/lib/query-client"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "MakeItDown — 任意文件转 Markdown",
      },
      {
        name: "description",
        content:
          "把 PDF、Word、Excel、PPT、图片等一键转换为 Markdown，并支持回转到 PDF/DOCX。",
      },
      { name: "theme-color", content: "#0A0E19" },
      { name: "application-name", content: "MakeItDown" },
      { name: "apple-mobile-web-app-title", content: "MakeItDown" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MakeItDown" },
      { property: "og:title", content: "MakeItDown — 任意文件转 Markdown" },
      {
        property: "og:description",
        content:
          "把 PDF、Word、Excel、PPT、图片等一键转换为 Markdown，并支持回转到 PDF/DOCX。",
      },
      { property: "og:image", content: "/android-chrome-512x512.png" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:image", content: "/android-chrome-512x512.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      {
        rel: "icon",
        href: "/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        rel: "icon",
        href: "/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),

  notFoundComponent: NotFoundPage,
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
        <script
          defer
          src="https://tongji.giantaccel.com/script.js"
          data-website-id="b34834b6-de59-4dcf-ba83-8d20161e3d72"
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-[#636363]">
          Page not found / 页面不存在
        </p>
      </div>
    </SiteShell>
  )
}

function RootComponent() {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SiteShell>
        <Outlet />
      </SiteShell>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
