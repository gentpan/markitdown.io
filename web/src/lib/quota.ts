/** Product quota rules — single source for UI copy. */

export const CREDITS_PER_CONVERSION = 1

/** Daily free credits for guests (not logged in). Resets daily; no rollover. */
export const DAILY_GUEST_CREDITS = 5

/** Daily gift for registered users (web convert). Resets daily; no rollover. */
export const DAILY_WEB_CREDITS = 100

/** Max API calls per day for a registered API key. */
export const DAILY_API_CALLS = 10

export const API_BASE_URL = "https://api.markitdown.io"
export const API_PREFIX = "/api/v1"

export const quotaCopy = {
  conversionCost: `每次转换消耗 ${CREDITS_PER_CONVERSION} 积分`,
  guestDaily: `游客每日 ${DAILY_GUEST_CREDITS} 积分`,
  dailyGift: `注册用户每日赠送 ${DAILY_WEB_CREDITS} 积分`,
  noAccumulate: "积分当日有效，不可累计到次日",
  apiLimit: `API 每日最多调用 ${DAILY_API_CALLS} 次`,
} as const
