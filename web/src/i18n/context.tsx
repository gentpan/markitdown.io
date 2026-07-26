import { useRouterState } from "@tanstack/react-router"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"

import { getMessages, type Messages } from "@/i18n/messages"
import {
  htmlLang,
  localeFromPathname,
  localizedPath,
  stripLocalePrefix,
  switchLocalePath,
} from "@/i18n/path"
import type { Locale } from "@/i18n/types"

type LocaleContextValue = {
  locale: Locale
  t: Messages
  path: (href: string) => string
  switchTo: (next: Locale) => string
  barePath: string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPathname(pathname)
  const barePath = stripLocalePrefix(pathname)
  const t = getMessages(locale)

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t,
      path: (href: string) => localizedPath(locale, href),
      switchTo: (next: Locale) => switchLocalePath(pathname, next),
      barePath,
    }),
    [locale, t, pathname, barePath],
  )

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale)
  }, [locale])

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}

/** Safe for components that may render outside provider during SSR edge cases. */
export function useLocaleOptional(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/"
  const locale = localeFromPathname(pathname)
  if (ctx) return ctx
  return {
    locale,
    t: getMessages(locale),
    path: (href) => localizedPath(locale, href),
    switchTo: (next) => switchLocalePath(pathname, next),
    barePath: stripLocalePrefix(pathname),
  }
}
