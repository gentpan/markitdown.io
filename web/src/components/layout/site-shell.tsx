import { LocaleProvider } from "@/i18n/context"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <div className="ona-surface flex min-h-svh flex-col overflow-x-hidden">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </LocaleProvider>
  )
}
