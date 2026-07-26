import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { OAuthButtons } from "@/components/auth/oauth-buttons"
import {
  AuthField,
  AuthShell,
  authInputClass,
} from "@/components/auth/auth-shell"
import { LocaleLink } from "@/components/i18n/locale-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocale } from "@/i18n/context"
import { cn } from "@/lib/utils"
import { loginUser } from "@/server/auth"

export function LoginPage({ next }: { next?: string }) {
  const { t, path } = useLocale()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title={t.auth.loginH1}
      description={t.auth.loginLead}
      footer={
        <p>
          {t.auth.noAccount}{" "}
          <LocaleLink
            to="/register"
            className="text-[#0a0e19] underline underline-offset-4 hover:text-[#636363]"
          >
            {t.auth.createAccount}
          </LocaleLink>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          setPending(true)
          try {
            const result = await loginUser({
              data: {
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
                remember: form.get("remember") === "on",
              },
            })
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            queryClient.setQueryData(["session-user"], result.user)
            toast.success(t.auth.loginBtn)
            if (next && next.startsWith("/") && !next.startsWith("//")) {
              window.location.assign(next)
              return
            }
            await navigate({ to: path("/account") })
          } catch (err) {
            toast.error(err instanceof Error ? err.message : t.auth.loginBtn)
          } finally {
            setPending(false)
          }
        }}
      >
        <AuthField id="email" label={t.auth.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={authInputClass}
          />
        </AuthField>

        <AuthField id="password" label={t.auth.password}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder={t.auth.password}
              className={cn(authInputClass, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#818181] hover:text-[#0a0e19]"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </AuthField>

        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-[13px] text-[#636363]">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="size-3.5 rounded border-[#e1e1e1] accent-[#0a0e19]"
            />
            {t.auth.remember}
          </label>
          <button
            type="button"
            className="text-[13px] text-[#0a0e19] underline-offset-4 hover:underline"
            onClick={() => toast.message(t.auth.forgot)}
          >
            {t.auth.forgot}
          </button>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-[42px] w-full rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] text-[16px] font-normal text-white shadow-none hover:bg-[#05070f]"
        >
          {pending ? t.auth.loggingIn : t.auth.loginBtn}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="mt-6">
        <OAuthButtons />
      </div>

      <Button
        asChild
        variant="outline"
        className="mt-3 h-[42px] w-full rounded-[8px] border-[#0a0e19] bg-transparent text-[15px] font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
      >
        <LocaleLink to="/convert">{t.auth.anonConvert}</LocaleLink>
      </Button>
    </AuthShell>
  )
}
