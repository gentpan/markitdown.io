import { ArrowRight } from "lucide-react"

import { ConverterWorkspace } from "@/components/convert/converter-workspace"
import { LocaleLink } from "@/components/i18n/locale-link"
import {
  ArrowSwapIcon,
  FileFormatIcon,
} from "@/components/icons/file-format-icon"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/context"
import { NARROW_MAX, PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

export function HomePage() {
  const { t } = useLocale()

  return (
    <div>
      <section
        className={cn(
          "mx-auto flex min-h-[calc(100svh-4rem)] flex-col justify-center py-14 sm:py-16 lg:py-20",
          SITE_MAX,
          PAGE_X,
        )}
      >
        <div className={cn("mx-auto w-full text-center", NARROW_MAX)}>
          <p className="font-display mb-5 text-[18px] leading-[18.9px] text-[#0a0e19]">
            {t.brand}
          </p>
          <h1 className="font-display text-[36px] leading-[1.08] text-balance text-[#0a0e19] sm:text-[44px] lg:text-[52px]">
            {t.home.h1a}
            <br />
            {t.home.h1b}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-[1.4] text-[#636363]">
            {t.home.lead}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-[#0a0e19]">
            <FileFormatIcon format="pdf" className="size-7" />
            <ArrowSwapIcon className="size-4 text-[#818181]" />
            <FileFormatIcon format="md" className="size-7" />
            <ArrowSwapIcon className="size-4 text-[#818181]" />
            <FileFormatIcon format="docx" className="size-7" />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="h-10 rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] px-6 text-[16px] font-normal text-white shadow-none hover:bg-[#05070f]"
            >
              <a href="#convert">
                {t.home.ctaStart}
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-[8px] border border-[#0a0e19] bg-transparent px-6 text-base font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
            >
              <LocaleLink to="/pricing">{t.home.ctaPricing}</LocaleLink>
            </Button>
          </div>
        </div>

        <div id="convert" className="mx-auto mt-10 w-full scroll-mt-24 sm:mt-12">
          <ConverterWorkspace compact />
        </div>
      </section>

      <section className="border-t border-[#e1e1e1] bg-[#f2f2f2] py-12 sm:py-16">
        <div
          className={cn(
            "mx-auto grid gap-4 sm:grid-cols-3 sm:gap-5",
            SITE_MAX,
            PAGE_X,
          )}
        >
          {[
            {
              icon: <FileFormatIcon format="pdf" className="size-8" />,
              title: t.home.f1Title,
              body: t.home.f1Body,
            },
            {
              icon: <ArrowSwapIcon className="size-6" />,
              title: t.home.f2Title,
              body: t.home.f2Body,
            },
            {
              icon: <FileFormatIcon format="md" className="size-8" />,
              title: t.home.f3Title,
              body: t.home.f3Body,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[20px] border border-[#e1e1e1] bg-white p-6"
            >
              <div className="mb-4 text-[#0a0e19]">{item.icon}</div>
              <h2 className="text-[18px] leading-[22px] font-normal text-[#0a0e19]">
                {item.title}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.35] text-[#636363]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
