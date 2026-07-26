import { LocaleLink } from "@/components/i18n/locale-link"
import { cn } from "@/lib/utils"

/** Inline brand mark — matches /public/brand/mark.svg */
export function BrandMark({
  className,
  variant = "solid",
}: {
  className?: string
  variant?: "solid" | "light"
}) {
  if (variant === "light") {
    return (
      <svg
        viewBox="0 0 32 32"
        className={cn("size-7", className)}
        aria-hidden
      >
        <rect
          x="0.75"
          y="0.75"
          width="30.5"
          height="30.5"
          rx="7.25"
          fill="#F2F2F2"
          stroke="#E1E1E1"
          strokeWidth="1.5"
        />
        <path d="M9.2 8h8.8L22.5 12.5V23.8H9.2V8Z" fill="#0A0E19" />
        <path d="M18 8v4.5h4.5" fill="#636363" />
        <path
          d="M12 15.8h7.2"
          stroke="#397554"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M12 18.6h5"
          stroke="#397554"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M15.8 20.8v2M14.5 21.9L16 23.2l1.3-1.3"
          stroke="#F7F7F7"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0A0E19" />
      <path d="M9 7.5h9.2L23 12.3V24.5H9V7.5Z" fill="#F7F7F7" />
      <path d="M18.2 7.5V12.3H23" fill="#D9D9D9" />
      <path
        d="M12 16.2h8"
        stroke="#397554"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 19.2h5.5"
        stroke="#397554"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 21.6v2.2M14.6 22.8L16 24.2l1.4-1.4"
        stroke="#0A0E19"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BrandLogo({
  className,
  showWordmark = true,
  markVariant = "solid",
}: {
  className?: string
  showWordmark?: boolean
  markVariant?: "solid" | "light"
}) {
  return (
    <LocaleLink
      to="/"
      className={cn(
        "font-display flex items-center gap-2.5 text-[18px] leading-none tracking-tight text-[#0a0e19] no-underline",
        className,
      )}
    >
      <BrandMark variant={markVariant} />
      {showWordmark ? <span>MakeItDown</span> : null}
    </LocaleLink>
  )
}
