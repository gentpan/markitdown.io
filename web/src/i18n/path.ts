import { defaultLocale, isLocale, type Locale } from "@/i18n/types"

/** Strip leading /en from pathname for locale-neutral path. */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3) || "/"
    return rest.startsWith("/") ? rest : `/${rest}`
  }
  return pathname || "/"
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en"
  return "zh"
}

/** Build a localized href. `path` should be locale-neutral (e.g. /pricing). */
export function localizedPath(locale: Locale, path: string): string {
  const clean =
    !path || path === "/"
      ? "/"
      : path.startsWith("/")
        ? path
        : `/${path}`

  if (locale === defaultLocale) return clean
  if (clean === "/") return "/en"
  return `/en${clean}`
}

/** Switch current path to another locale. */
export function switchLocalePath(pathname: string, next: Locale): string {
  const base = stripLocalePrefix(pathname)
  return localizedPath(next, base)
}

export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN"
}

export function ogLocale(locale: Locale): string {
  return locale === "en" ? "en_US" : "zh_CN"
}

export function parseLocaleParam(value: unknown): Locale {
  if (typeof value === "string" && isLocale(value)) return value
  return defaultLocale
}
