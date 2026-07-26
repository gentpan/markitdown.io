import { Check } from "lucide-react"

import { LocaleLink } from "@/components/i18n/locale-link"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/context"
import {
  CREDITS_PER_CONVERSION,
  DAILY_API_CALLS,
  DAILY_WEB_CREDITS,
} from "@/lib/quota"
import { CONTENT_MAX, NARROW_MAX, PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

export function PricingPage() {
  const { t } = useLocale()

  const plans = [
    {
      name: "Free",
      price: "¥0",
      desc: t.pricing.freeDesc,
      features: [
        t.pricing.freeF1,
        t.pricing.freeF2,
        t.pricing.freeF3,
        t.pricing.freeF4,
        t.pricing.freeF5,
      ],
      cta: t.pricing.freeCta,
      to: "/register",
      highlight: false,
    },
    {
      name: "Pro",
      price: t.pricing.proPrice,
      desc: t.pricing.proDesc,
      features: [
        t.pricing.proF1,
        t.pricing.proF2,
        t.pricing.proF3,
        t.pricing.proF4,
      ],
      cta: t.pricing.proCta,
      to: "/developers",
      highlight: true,
    },
    {
      name: "Business",
      price: t.pricing.bizPrice,
      desc: t.pricing.bizDesc,
      features: [
        t.pricing.bizF1,
        t.pricing.bizF2,
        t.pricing.bizF3,
        t.pricing.bizF4,
      ],
      cta: t.pricing.bizCta,
      to: "/register",
      highlight: false,
    },
  ]

  return (
    <div className={cn("mx-auto py-14", SITE_MAX, PAGE_X)}>
      <div className={cn("mx-auto text-center", NARROW_MAX)}>
        <p className="font-display mb-3 text-[16px] text-[#0a0e19]">{t.brand}</p>
        <h1 className="font-display text-[36px] tracking-tight text-[#0a0e19] sm:text-[44px]">
          {t.pricing.h1}
        </h1>
        <p className="mt-3 text-[16px] text-[#636363]">{t.pricing.lead}</p>
      </div>

      <div
        className={cn(
          "mx-auto mt-8 flex flex-wrap justify-center gap-3 text-[13px] text-[#636363]",
          CONTENT_MAX,
        )}
      >
        <span className="rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] px-3 py-1.5">
          {t.pricing.badgeConvert.replace("1", String(CREDITS_PER_CONVERSION))}
        </span>
        <span className="rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] px-3 py-1.5">
          {t.pricing.badgeGuest}
        </span>
        <span className="rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] px-3 py-1.5">
          {`Web ${DAILY_WEB_CREDITS} / day`}
        </span>
        <span className="rounded-[8px] border border-[#e1e1e1] bg-[#f2f2f2] px-3 py-1.5">
          {t.pricing.badgeApi}
        </span>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.highlight
                ? "rounded-[20px] border border-[#0a0e19] bg-[#0a0e19] p-6 text-white"
                : "rounded-[20px] border border-[#e1e1e1] bg-white p-6 text-[#0a0e19]"
            }
          >
            <h2 className="text-[20px]">{plan.name}</h2>
            <p
              className={
                plan.highlight
                  ? "mt-1 text-[14px] text-white/70"
                  : "mt-1 text-[14px] text-[#636363]"
              }
            >
              {plan.desc}
            </p>
            <p className="mt-6 text-[28px] tracking-tight">{plan.price}</p>
            <ul className="mt-6 space-y-2 text-[14px]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    className={
                      plan.highlight
                        ? "mt-0.5 size-4 shrink-0 text-white"
                        : "mt-0.5 size-4 shrink-0 text-[#397554]"
                    }
                  />
                  <span
                    className={plan.highlight ? "text-white/90" : "text-[#636363]"}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              className={
                plan.highlight
                  ? "mt-8 h-10 w-full rounded-[8px] border border-white bg-white font-normal text-[#0a0e19] shadow-none hover:bg-white/90"
                  : "mt-8 h-10 w-full rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] font-normal text-white shadow-none hover:bg-[#05070f]"
              }
              asChild
            >
              <LocaleLink to={plan.to}>{plan.cta}</LocaleLink>
            </Button>
          </div>
        ))}
      </div>

      <p
        className={cn(
          "mx-auto mt-10 text-center text-[14px] text-[#818181]",
          NARROW_MAX,
        )}
      >
        API:{" "}
        <LocaleLink
          to="/developers"
          className="text-[#0a0e19] underline underline-offset-4"
        >
          api.markitdown.io
        </LocaleLink>
        {` · ${DAILY_API_CALLS}/day`}
      </p>
    </div>
  )
}
