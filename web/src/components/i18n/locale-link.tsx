import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { useLocale } from "@/i18n/context"
import { localizedPath } from "@/i18n/path"
import { cn } from "@/lib/utils"

type Props = {
  to: string
  className?: string
  children?: ReactNode
  activeProps?: { className?: string }
  onClick?: () => void
}

/** Link that prefixes /en when the current locale is English. */
export function LocaleLink({
  to,
  className,
  children,
  activeProps,
  onClick,
}: Props) {
  const { locale } = useLocale()
  const href = localizedPath(locale, to)

  return (
    <Link
      to={href}
      className={className}
      activeProps={activeProps}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

export function localeHref(locale: "zh" | "en", to: string) {
  return localizedPath(locale, to)
}

export function LocaleNavLink({
  to,
  label,
  className,
  activeClassName,
}: {
  to: string
  label: string
  className: string
  activeClassName: string
}) {
  return (
    <LocaleLink
      to={to}
      className={className}
      activeProps={{ className: cn(className, activeClassName) }}
    >
      {label}
    </LocaleLink>
  )
}
