import type { ReactNode } from "react"

import { BrandLogo } from "@/components/brand/logo"
import { LocaleLink } from "@/components/i18n/locale-link"
import {
  ArrowSwapIcon,
  FileFormatIcon,
} from "@/components/icons/file-format-icon"
import { useLocale } from "@/i18n/context"
import { PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"

type Props = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: Props) {
  const { t } = useLocale()
  const sideTitle = t.auth.sideTitle.split("\n")

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[calc(100svh-8rem)] items-center py-10 sm:py-14",
        SITE_MAX,
        PAGE_X,
      )}
    >
      <div
        className={cn(
          "mx-auto grid w-full max-w-[920px] overflow-hidden rounded-[20px] border border-[#e1e1e1] bg-white lg:grid-cols-[1.05fr_1fr]",
          className,
        )}
      >
        <aside className="border-b border-[#e1e1e1] bg-[#f2f2f2] px-6 py-8 sm:px-8 lg:border-r lg:border-b-0 lg:py-10">
          <BrandLogo />
          <h2 className="font-display mt-8 text-[28px] leading-[1.15] text-[#0a0e19] sm:text-[32px]">
            {sideTitle[0]}
            <br />
            {sideTitle[1]}
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-[1.4] text-[#636363]">
            {t.auth.sideLead}
          </p>

          <div className="mt-8 flex items-center gap-2 text-[#0a0e19]">
            <FileFormatIcon format="pdf" className="size-8" />
            <ArrowSwapIcon className="size-4 text-[#818181]" />
            <FileFormatIcon format="md" className="size-8" />
            <ArrowSwapIcon className="size-4 text-[#818181]" />
            <FileFormatIcon format="docx" className="size-8" />
          </div>

          <ul className="mt-8 space-y-3 text-[14px] text-[#636363]">
            {[t.auth.side1, t.auth.side2, t.auth.side3].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#397554]" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-[13px] text-[#818181]">
            {t.auth.sideAnon}{" "}
            <LocaleLink
              to="/convert"
              className="text-[#0a0e19] underline underline-offset-4 hover:text-[#636363]"
            >
              {t.auth.sideAnonLink}
            </LocaleLink>
          </p>
        </aside>

        <div className="px-6 py-8 sm:px-8 lg:py-10">
          <p className="font-display text-[16px] text-[#0a0e19]">{t.brand}</p>
          <h1 className="mt-2 text-[26px] leading-tight font-normal tracking-tight text-[#0a0e19] sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.4] text-[#636363]">
            {description}
          </p>

          <div className="mt-8">{children}</div>

          {footer ? (
            <div className="mt-6 text-[14px] text-[#636363]">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AuthField({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] text-[#0a0e19]">
          {label}
        </label>
        {hint ? (
          <span className="text-[12px] text-[#818181]">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export const authInputClass =
  "h-[42px] w-full rounded-[6px] border border-[#e1e1e1] bg-white px-4 text-[14px] text-[#0a0e19] outline-none placeholder:text-[#cecece] focus:border-[#0a0e19] focus:ring-[3px] focus:ring-[rgba(10,14,25,0.1)]"
