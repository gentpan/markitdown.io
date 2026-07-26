import {
  CREDITS_PER_CONVERSION,
  DAILY_GUEST_CREDITS,
} from "@/lib/quota"

const STORAGE_KEY = "makeitdown.guestCredits.v1"
export const CREDITS_CHANGED_EVENT = "makeitdown:credits-changed"

type GuestCreditState = {
  day: string
  used: number
}

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function readState(): GuestCreditState {
  if (typeof window === "undefined") {
    return { day: todayKey(), used: 0 }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { day: todayKey(), used: 0 }
    const parsed = JSON.parse(raw) as GuestCreditState
    if (!parsed?.day || typeof parsed.used !== "number") {
      return { day: todayKey(), used: 0 }
    }
    if (parsed.day !== todayKey()) {
      return { day: todayKey(), used: 0 }
    }
    return { day: parsed.day, used: Math.max(0, parsed.used) }
  } catch {
    return { day: todayKey(), used: 0 }
  }
}

function writeState(state: GuestCreditState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT))
}

export function getGuestCredits() {
  const state = readState()
  const remaining = Math.max(0, DAILY_GUEST_CREDITS - state.used)
  return {
    plan: "guest" as const,
    dailyQuota: DAILY_GUEST_CREDITS,
    usedToday: state.used,
    remaining,
    exhausted: remaining <= 0,
  }
}

/** Consume credits after a successful conversion. Returns false if none left. */
export function consumeGuestCredits(units = CREDITS_PER_CONVERSION) {
  const state = readState()
  const remaining = Math.max(0, DAILY_GUEST_CREDITS - state.used)
  if (remaining < units) return false
  writeState({ day: todayKey(), used: state.used + units })
  return true
}

export function canGuestConvert(units = CREDITS_PER_CONVERSION) {
  return getGuestCredits().remaining >= units
}
