import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ChevronDown, LogOut, Menu } from "lucide-react"
import { toast } from "sonner"

import { BrandLogo } from "@/components/brand/logo"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { LocaleLink, LocaleNavLink } from "@/components/i18n/locale-link"
import { FileFormatIcon } from "@/components/icons/file-format-icon"
import { CreditsBadge } from "@/components/layout/credits-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useLocale } from "@/i18n/context"
import { defaultGravatarUrl } from "@/lib/gravatar"
import { PAGE_X, SITE_MAX } from "@/lib/layout"
import { cn } from "@/lib/utils"
import { getCurrentUser, logoutUser } from "@/server/auth"

const pillItem =
  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[14px] text-[#0a0e19] no-underline outline-none transition-colors hover:bg-white/70"
const pillItemActive =
  "bg-white text-[#0a0e19] shadow-[0_1px_2px_rgba(10,14,25,0.06)]"

export function SiteHeader() {
  const { t, path } = useLocale()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userQuery = useQuery({
    queryKey: ["session-user"],
    queryFn: () => getCurrentUser(),
    staleTime: 30_000,
  })
  const user = userQuery.data

  // Product nav only — account lives in the avatar (signed-in) or login/register.
  const primaryNav = [
    { to: "/convert", label: t.nav.convert },
    { to: "/pricing", label: t.nav.pricing },
    { to: "/developers", label: t.nav.api },
  ]

  const toolLinks = [
    {
      to: "/tools/pdf-to-markdown",
      label: t.tools.pdfMd,
      desc: t.tools.pdfMdDesc,
      format: "pdf",
    },
    {
      to: "/tools/markdown-to-pdf",
      label: t.tools.mdPdf,
      desc: t.tools.mdPdfDesc,
      format: "md",
    },
    {
      to: "/tools/docx-to-markdown",
      label: t.tools.docxMd,
      desc: t.tools.docxMdDesc,
      format: "docx",
    },
  ] as const

  async function handleLogout() {
    await logoutUser()
    queryClient.setQueryData(["session-user"], null)
    toast.success(t.nav.logout)
    await navigate({ to: path("/") })
  }

  return (
    <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-16 items-center justify-between gap-3 sm:h-[4.25rem]",
          SITE_MAX,
          PAGE_X,
        )}
      >
        <BrandLogo className="shrink-0" />

        <nav className="hidden items-center rounded-full bg-[#f2f2f2] p-1 lg:flex">
          <LocaleNavLink
            to="/convert"
            label={t.nav.convert}
            className={pillItem}
            activeClassName={pillItemActive}
          />

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              className={cn(
                pillItem,
                "data-[state=open]:bg-white data-[state=open]:shadow-[0_1px_2px_rgba(10,14,25,0.06)]",
              )}
            >
              {t.nav.tools}
              <ChevronDown className="size-3.5 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="bottom"
              sideOffset={10}
              avoidCollisions={false}
              className="w-[280px] rounded-[14px] border border-[#e1e1e1] bg-white p-1.5 text-[#0a0e19] shadow-[0_8px_24px_rgba(10,14,25,0.08)] ring-0"
            >
              {toolLinks.map((item) => (
                <DropdownMenuItem
                  key={item.to}
                  asChild
                  className="cursor-pointer rounded-[10px] p-0 focus:bg-[#f2f2f2] focus:text-[#0a0e19]"
                >
                  <LocaleLink
                    to={item.to}
                    className="flex w-full items-start gap-3 px-3 py-2.5 no-underline"
                  >
                    <FileFormatIcon
                      format={item.format}
                      className="mt-0.5 size-7 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] leading-snug text-[#0a0e19]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-[#818181]">
                        {item.desc}
                      </span>
                    </span>
                  </LocaleLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryNav
            .filter((item) => item.to !== "/convert")
            .map((item) => (
              <LocaleNavLink
                key={item.to}
                to={item.to}
                label={item.label}
                className={pillItem}
                activeClassName={pillItemActive}
              />
            ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          {!user ? <CreditsBadge /> : null}

          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-9 max-w-[12rem] items-center gap-2 rounded-[10px] bg-[#f2f2f2] px-2.5 text-[14px] text-[#0a0e19] outline-none transition-colors hover:bg-[#e8e8e8]",
                  "data-[state=open]:bg-[#e8e8e8]",
                )}
              >
                <img
                  src={user.avatarUrl || defaultGravatarUrl(64)}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
                <span className="min-w-0 truncate">
                  {user.displayName || user.email}
                </span>
                <ChevronDown className="size-3.5 shrink-0 opacity-50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-48 rounded-[12px] border border-[#e1e1e1] bg-white p-1 text-[#0a0e19] shadow-[0_8px_24px_rgba(10,14,25,0.08)] ring-0"
              >
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-[8px] focus:bg-[#f2f2f2] focus:text-[#0a0e19]"
                >
                  <LocaleLink to="/account" className="no-underline">
                    {t.nav.account}
                  </LocaleLink>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer rounded-[8px] focus:bg-[#f2f2f2] focus:text-[#0a0e19]"
                  onSelect={() => void handleLogout()}
                >
                  <LogOut className="size-3.5" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="h-9 rounded-[10px] px-3 text-[14px] font-normal text-[#636363] shadow-none hover:bg-transparent hover:text-[#0a0e19]"
              >
                <LocaleLink to="/login">{t.nav.login}</LocaleLink>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-9 rounded-[10px] bg-[#f2f2f2] px-3.5 text-[14px] font-normal text-[#0a0e19] shadow-none hover:bg-[#e8e8e8]"
              >
                <LocaleLink to="/register">{t.nav.register}</LocaleLink>
              </Button>
            </>
          )}

          <Button
            asChild
            className="h-9 rounded-[10px] border-0 bg-[#0a0e19] px-4 text-[14px] font-normal text-white shadow-none hover:bg-[#05070f]"
          >
            <LocaleLink to="/convert">{t.nav.start}</LocaleLink>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          {!user ? <CreditsBadge /> : null}
          {user ? (
            <LocaleLink to="/account" className="shrink-0">
              <img
                src={user.avatarUrl || defaultGravatarUrl(64)}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full border border-[#e1e1e1]"
                referrerPolicy="no-referrer"
              />
            </LocaleLink>
          ) : null}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-[10px] bg-[#f2f2f2] text-[#0a0e19] hover:bg-[#e8e8e8]"
              >
                <Menu className="size-5" />
                <span className="sr-only">{t.nav.menu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100%,20rem)] border-[#e1e1e1] bg-white text-[#0a0e19]"
            >
              <SheetHeader className="border-b border-[#e1e1e1] pb-4 text-left">
                <SheetTitle className="font-display text-[#0a0e19]">
                  {t.nav.menu}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-5 flex flex-col gap-6">
                {user ? (
                  <LocaleLink
                    to="/account"
                    className="flex items-center gap-3 rounded-[10px] px-1 py-1 no-underline hover:bg-[#f2f2f2]"
                  >
                    <img
                      src={user.avatarUrl || defaultGravatarUrl(64)}
                      alt=""
                      className="size-10 rounded-full border border-[#e1e1e1]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-[#0a0e19]">
                        {user.displayName || t.nav.account}
                      </p>
                      <p className="truncate text-[12px] text-[#818181]">
                        {user.email}
                      </p>
                    </div>
                  </LocaleLink>
                ) : null}

                <div>
                  <p className="mb-2 px-1 text-[12px] tracking-wide text-[#818181] uppercase">
                    {t.nav.product}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {primaryNav.map((item) => (
                      <LocaleLink
                        key={item.to}
                        to={item.to}
                        className="rounded-[10px] px-3 py-2.5 text-[15px] text-[#0a0e19] no-underline hover:bg-[#f2f2f2]"
                      >
                        {item.label}
                      </LocaleLink>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 px-1 text-[12px] tracking-wide text-[#818181] uppercase">
                    {t.nav.toolsSection}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {toolLinks.map((item) => (
                      <LocaleLink
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 no-underline hover:bg-[#f2f2f2]"
                      >
                        <FileFormatIcon format={item.format} className="size-6" />
                        <span className="text-[15px] text-[#0a0e19]">
                          {item.label}
                        </span>
                      </LocaleLink>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-[#e1e1e1] pt-5">
                  <Button
                    asChild
                    className="h-10 rounded-[10px] bg-[#0a0e19] font-normal text-white shadow-none hover:bg-[#05070f]"
                  >
                    <LocaleLink to="/convert">{t.nav.start}</LocaleLink>
                  </Button>
                  {user ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-[10px] bg-[#f2f2f2] font-normal text-[#0a0e19] shadow-none hover:bg-[#e8e8e8]"
                      onClick={() => void handleLogout()}
                    >
                      {t.nav.logout}
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        className="h-10 rounded-[10px] bg-[#f2f2f2] font-normal text-[#0a0e19] shadow-none hover:bg-[#e8e8e8]"
                      >
                        <LocaleLink to="/login">{t.nav.login}</LocaleLink>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="h-10 rounded-[10px] bg-[#f2f2f2] font-normal text-[#0a0e19] shadow-none hover:bg-[#e8e8e8]"
                      >
                        <LocaleLink to="/register">{t.nav.register}</LocaleLink>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
