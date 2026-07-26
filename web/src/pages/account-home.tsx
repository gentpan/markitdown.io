import { useQuery } from "@tanstack/react-query"
import { BookOpen, History, KeyRound, Sparkles, WalletCards } from "lucide-react"

import { LocaleLink } from "@/components/i18n/locale-link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useLocale } from "@/i18n/context"
import { defaultGravatarUrl } from "@/lib/gravatar"
import { CONTENT_MAX, PAGE_X } from "@/lib/layout"
import {
  CREDITS_PER_CONVERSION,
  DAILY_API_CALLS,
  DAILY_WEB_CREDITS,
  quotaCopy,
} from "@/lib/quota"
import { cn } from "@/lib/utils"
import type { PublicUser } from "@/server/session"
import { getUsageSummary } from "@/server/conversions"

export function AccountHomePage({ user }: { user: PublicUser }) {
  const { t, locale } = useLocale()
  const usageQuery = useQuery({
    queryKey: ["usage"],
    queryFn: () => getUsageSummary(),
  })

  const used = usageQuery.data?.usedToday ?? 0
  const quota = usageQuery.data?.dailyQuota ?? DAILY_WEB_CREDITS
  const remaining = Math.max(0, quota - used)
  const pct = Math.min(100, Math.round((used / quota) * 100))
  const dateLocale = locale === "en" ? "en-US" : "zh-CN"

  const links = [
    {
      to: "/account/history",
      label: locale === "en" ? "History" : "转换历史",
      icon: History,
    },
    { to: "/account/api-keys", label: "API Keys", icon: KeyRound },
    {
      to: "/developers",
      label: locale === "en" ? "API docs" : "API 文档",
      icon: BookOpen,
    },
    {
      to: "/account/billing",
      label: locale === "en" ? "Billing" : "订阅账单",
      icon: WalletCards,
    },
  ]

  return (
    <div className={cn("mx-auto py-12", CONTENT_MAX, PAGE_X)}>
      <div className="flex flex-wrap items-start gap-4">
        <img
          src={user.avatarUrl || defaultGravatarUrl(80)}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-full border border-[#e1e1e1] bg-[#f2f2f2]"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <p className="font-display text-[16px] text-[#0a0e19]">Account</p>
          <h1 className="mt-1 text-[28px] tracking-tight text-[#0a0e19]">
            {user.displayName || (locale === "en" ? "Account" : "账户中心")}
          </h1>
          <p className="mt-1 text-[15px] text-[#636363]">{user.email}</p>
          <p className="mt-1 text-[13px] text-[#818181]">
            {locale === "en" ? "Joined" : "注册于"}{" "}
            {new Date(user.createdAt).toLocaleString(dateLocale)}
            {user.registerIp ? ` · IP ${user.registerIp}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[15px] text-[#636363]">
        {t.account.description}
      </p>

      <div className="mt-8 rounded-[20px] border border-[#e1e1e1] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-[#818181]">
              {locale === "en" ? "Web credits today" : "今日网页积分"}
            </p>
            <p className="mt-1 text-[24px] tracking-tight text-[#0a0e19]">
              {locale === "en" ? "Left" : "剩余"} {remaining} / {quota}
            </p>
            <p className="mt-1 text-[13px] text-[#636363]">
              {locale === "en" ? "Used" : "已用"} {used} ·{" "}
              {CREDITS_PER_CONVERSION}{" "}
              {locale === "en" ? "credit / conversion" : "积分 / 次"}
            </p>
          </div>
          <Sparkles className="size-5 text-[#397554]" />
        </div>
        <Progress value={pct} className="mt-4 h-2 bg-[#e1e1e1]" />
        <p className="mt-3 text-[12px] text-[#818181]">
          {quotaCopy.dailyGift}; {quotaCopy.noAccumulate}.
        </p>
      </div>

      <div className="mt-4 rounded-[20px] border border-[#e1e1e1] bg-[#f2f2f2] p-5">
        <p className="text-[13px] text-[#818181]">
          {locale === "en" ? "API quota today" : "今日 API 额度"}
        </p>
        <p className="mt-1 text-[18px] text-[#0a0e19]">
          {DAILY_API_CALLS} {locale === "en" ? "calls / day" : "次 / 天"}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {links.map((item) => (
          <Button
            key={item.to}
            variant="outline"
            className="h-auto justify-start gap-3 rounded-[12px] border-[#e1e1e1] p-4 font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
            asChild
          >
            <LocaleLink to={item.to}>
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </LocaleLink>
          </Button>
        ))}
      </div>
    </div>
  )
}
