import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/context"

export function OAuthButtons() {
  const { t } = useLocale()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-[#e1e1e1]" />
        <span className="text-[12px] text-[#818181]">{t.auth.oauthOr}</span>
        <div className="h-px flex-1 bg-[#e1e1e1]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-[42px] rounded-[8px] border-[#e1e1e1] bg-white text-[14px] font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
          onClick={() =>
            toast.message(t.auth.oauthGoogleSoon, {
              description: t.auth.oauthHint,
            })
          }
        >
          <GoogleIcon />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-[42px] rounded-[8px] border-[#e1e1e1] bg-white text-[14px] font-normal text-[#0a0e19] shadow-none hover:bg-[#f2f2f2]"
          onClick={() =>
            toast.message(t.auth.oauthGithubSoon, {
              description: t.auth.oauthHint,
            })
          }
        >
          <GitHubIcon />
          GitHub
        </Button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}
