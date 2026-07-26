import { ConverterWorkspace } from "@/components/convert/converter-workspace"
import { useLocale } from "@/i18n/context"
import { CONTENT_MAX, PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

export function ConvertPage() {
  const { t } = useLocale()

  return (
    <div className={cn("mx-auto py-12 sm:py-16", SITE_MAX, PAGE_X)}>
      <div className={cn("mx-auto mb-8", CONTENT_MAX)}>
        <p className="font-display mb-3 text-[18px] text-[#0a0e19]">{t.brand}</p>
        <h1 className="font-display text-4xl tracking-tight text-[#0a0e19]">
          {t.convert.h1}
        </h1>
        <p className="mt-3 text-[16px] text-[#636363]">{t.convert.lead}</p>
      </div>
      <ConverterWorkspace />
    </div>
  )
}
