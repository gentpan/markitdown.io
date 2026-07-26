import { Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { LocaleLink } from "@/components/i18n/locale-link"
import { useLocale } from "@/i18n/context"
import {
  CREDITS_CHANGED_EVENT,
  getGuestCredits,
} from "@/lib/guest-credits"
import { DAILY_GUEST_CREDITS } from "@/lib/quota"
import { cn } from "@/lib/utils"

export function CreditsBadge({ className }: { className?: string }) {
  const { t } = useLocale()
  const [remaining, setRemaining] = useState(DAILY_GUEST_CREDITS)
  const [exhausted, setExhausted] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function sync() {
      const credits = getGuestCredits()
      setRemaining(credits.remaining)
      setExhausted(credits.exhausted)
    }
    sync()
    window.addEventListener(CREDITS_CHANGED_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CREDITS_CHANGED_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-[10px] border-0 px-3 text-[14px] transition-colors",
          exhausted
            ? "bg-[#c23b22]/8 text-[#c23b22]"
            : "bg-[#f2f2f2] text-[#0a0e19] hover:bg-[#e8e8e8]",
        )}
        aria-expanded={open}
        aria-label={t.credits.aria.replace("{n}", String(remaining))}
      >
        <Zap
          className={cn(
            "size-3.5",
            exhausted ? "fill-[#c23b22] text-[#c23b22]" : "text-[#397554]",
          )}
        />
        <span className="min-w-[1ch] font-medium tabular-nums">{remaining}</span>
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-56 rounded-[12px] border border-[#e1e1e1] bg-white p-3 shadow-[0_4px_12px_rgba(10,14,25,0.08)]">
          <p
            className={cn(
              "text-[14px]",
              exhausted ? "text-[#c23b22]" : "text-[#0a0e19]",
            )}
          >
            {exhausted
              ? t.credits.exhausted
              : t.credits.remaining.replace("{n}", String(remaining))}
          </p>
          <p className="mt-1 text-[12px] leading-[1.35] text-[#818181]">
            {t.credits.tip}
          </p>
          <LocaleLink
            to="/register"
            className="mt-3 inline-flex text-[13px] text-[#0a0e19] underline underline-offset-4 hover:text-[#636363]"
            onClick={() => setOpen(false)}
          >
            {t.credits.signin}
          </LocaleLink>
        </div>
      ) : null}
    </div>
  )
}
