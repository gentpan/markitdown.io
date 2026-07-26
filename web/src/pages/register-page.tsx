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
import { registerUser } from "@/server/auth"

export function RegisterPage() {
  const { t, path, locale } = useLocale()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <AuthShell
      title={t.auth.registerH1}
      description={t.auth.registerLead}
      footer={
        <p>
          {t.auth.hasAccount}{" "}
          <LocaleLink
            to="/login"
            className="text-[#0a0e19] underline underline-offset-4 hover:text-[#636363]"
          >
            {t.auth.goLogin}
          </LocaleLink>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          const password = String(form.get("password") ?? "")
          const confirm = String(form.get("confirm") ?? "")
          if (password !== confirm) {
            toast.error(
              locale === "en" ? "Passwords do not match" : "两次密码不一致",
            )
            return
          }

          setPending(true)
          try {
            const result = await registerUser({
              data: {
                displayName: String(form.get("name") ?? ""),
                email: String(form.get("email") ?? ""),
                password,
                confirm,
              },
            })
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            queryClient.setQueryData(["session-user"], result.user)
            toast.success(t.auth.registerBtn)
            await navigate({ to: path("/account") })
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : t.auth.registerBtn,
            )
          } finally {
            setPending(false)
          }
        }}
      >
        <AuthField id="name" label={t.auth.nickname}>
          <Input
            id="name"
            name="name"
            autoComplete="nickname"
            required
            className={authInputClass}
          />
        </AuthField>

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

        <AuthField id="password" label={t.auth.password} hint={t.auth.passwordHint}>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
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

        <AuthField id="confirm" label={t.auth.confirm}>
          <Input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className={authInputClass}
          />
        </AuthField>

        <label className="flex items-start gap-2 pt-1 text-[13px] leading-[1.35] text-[#636363]">
          <input
            type="checkbox"
            required
            className="mt-0.5 size-3.5 rounded border-[#e1e1e1] accent-[#0a0e19]"
          />
          <span>
            {t.auth.terms}{" "}
            <button
              type="button"
              className="text-[#0a0e19] underline underline-offset-4"
              onClick={() => toast.message(t.auth.termsLink)}
            >
              {t.auth.termsLink}
            </button>
          </span>
        </label>

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-[42px] w-full rounded-[8px] border border-[#0a0e19] bg-[#0a0e19] text-[16px] font-normal text-white shadow-none hover:bg-[#05070f]"
        >
          {pending ? t.auth.creating : t.auth.registerBtn}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="mt-6">
        <OAuthButtons />
      </div>
    </AuthShell>
  )
}
