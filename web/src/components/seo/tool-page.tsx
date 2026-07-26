import { ConverterWorkspace } from "@/components/convert/converter-workspace"
import { LocaleLink } from "@/components/i18n/locale-link"
import { Button } from "@/components/ui/button"
import { CONTENT_MAX, PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

type Props = {
  brand: string
  title: string
  description: string
  acceptHint?: string
  related?: Array<{ to: string; label: string }>
  defaultMode?: "to-md" | "from-md"
}

export function ToolPage({
  brand,
  title,
  description,
  acceptHint,
  related = [],
  defaultMode = "to-md",
}: Props) {
  return (
    <div className={cn("mx-auto py-12 sm:py-16", SITE_MAX, PAGE_X)}>
      <div className={cn("mx-auto mb-10", CONTENT_MAX)}>
        <p className="font-display mb-3 text-[18px] text-[#0a0e19]">{brand}</p>
        <h1 className="font-display text-4xl tracking-tight text-balance text-[#0a0e19] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[#636363]">
          {description}
        </p>
      </div>

      <ConverterWorkspace
        defaultAcceptHint={acceptHint}
        defaultMode={defaultMode}
      />

      {related.length > 0 ? (
        <div className="mt-12 flex flex-wrap gap-2">
          {related.map((item) => (
            <Button
              key={item.to}
              variant="outline"
              size="sm"
              asChild
              className="rounded-[8px] border-[#0a0e19] text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
            >
              <LocaleLink to={item.to}>{item.label}</LocaleLink>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
