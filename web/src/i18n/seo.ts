import { getMessages } from "@/i18n/messages"
import { htmlLang, localizedPath, ogLocale } from "@/i18n/path"
import type { Locale } from "@/i18n/types"
import { SITE_URL } from "@/lib/layout"

type SeoInput = {
  locale: Locale
  title: string
  description: string
  /** Locale-neutral path, e.g. /pricing */
  path: string
  noindex?: boolean
}

export function buildSeoHead({
  locale,
  title,
  description,
  path,
  noindex,
}: SeoInput) {
  const canonical = `${SITE_URL}${localizedPath(locale, path)}`
  const alternateZh = `${SITE_URL}${localizedPath("zh", path)}`
  const alternateEn = `${SITE_URL}${localizedPath("en", path)}`
  const m = getMessages(locale)

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "application-name", content: m.seo.siteName },
      ...(noindex
        ? [{ name: "robots", content: "noindex, nofollow" }]
        : [{ name: "robots", content: "index, follow" }]),
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: m.seo.siteName },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: ogLocale(locale) },
      {
        property: "og:locale:alternate",
        content: locale === "en" ? "zh_CN" : "en_US",
      },
      { property: "og:image", content: `${SITE_URL}/android-chrome-512x512.png` },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${SITE_URL}/android-chrome-512x512.png` },
    ],
    links: [
      { rel: "canonical", href: canonical },
      { rel: "alternate", hrefLang: "zh-CN", href: alternateZh },
      { rel: "alternate", hrefLang: "en", href: alternateEn },
      { rel: "alternate", hrefLang: "x-default", href: alternateZh },
    ],
    scripts: [] as Array<Record<string, unknown>>,
  }
}

export function rootHtmlLang(locale: Locale) {
  return htmlLang(locale)
}
