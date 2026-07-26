import { Link } from "@tanstack/react-router"

import { useLocale } from "@/i18n/context"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, switchTo, t } = useLocale()

  return (
    <div
      className={cn(
        "inline-flex h-9 items-center rounded-[10px] bg-[#f2f2f2] p-0.5 text-[13px]",
        className,
      )}
      aria-label={t.lang.label}
    >
      <Link
        to={switchTo("zh")}
        className={cn(
          "rounded-[8px] px-2.5 py-1.5 no-underline transition-colors",
          locale === "zh"
            ? "bg-white text-[#0a0e19] shadow-[0_1px_2px_rgba(10,14,25,0.06)]"
            : "text-[#636363] hover:text-[#0a0e19]",
        )}
      >
        {t.lang.zh}
      </Link>
      <Link
        to={switchTo("en")}
        className={cn(
          "rounded-[8px] px-2.5 py-1.5 no-underline transition-colors",
          locale === "en"
            ? "bg-white text-[#0a0e19] shadow-[0_1px_2px_rgba(10,14,25,0.06)]"
            : "text-[#636363] hover:text-[#0a0e19]",
        )}
      >
        EN
      </Link>
    </div>
  )
}
