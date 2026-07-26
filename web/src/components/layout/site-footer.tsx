import { LocaleLink } from "@/components/i18n/locale-link"
import { useLocale } from "@/i18n/context"
import { PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

export function SiteFooter() {
  const { t } = useLocale()

  return (
    <footer className="border-t border-[#e1e1e1] bg-white">
      <div
        className={cn(
          "mx-auto flex flex-col gap-6 py-12 text-sm text-[#636363] sm:flex-row sm:items-center sm:justify-between",
          SITE_MAX,
          PAGE_X,
        )}
      >
        <p>{t.footer.tagline}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <LocaleLink
            to="/tools/pdf-to-markdown"
            className="text-[#0a0e19] hover:text-[#636363]"
          >
            {t.footer.pdfMd}
          </LocaleLink>
          <LocaleLink
            to="/tools/markdown-to-pdf"
            className="text-[#0a0e19] hover:text-[#636363]"
          >
            {t.footer.mdPdf}
          </LocaleLink>
          <LocaleLink
            to="/developers"
            className="text-[#0a0e19] hover:text-[#636363]"
          >
            {t.footer.apiDocs}
          </LocaleLink>
          <LocaleLink
            to="/account/api-keys"
            className="text-[#0a0e19] hover:text-[#636363]"
          >
            {t.footer.apiKeys}
          </LocaleLink>
        </div>
      </div>
    </footer>
  )
}
