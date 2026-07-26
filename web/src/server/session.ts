import { and, eq, gt } from "drizzle-orm"
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server"

import { db } from "@/db"
import { sessions, users } from "@/db/schema"
import { randomToken, sha256Hex } from "@/server/crypto"

export const SESSION_COOKIE = "mid_session"
const SESSION_DAYS = 30
const SESSION_DAYS_SHORT = 7

export type PublicUser = {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  plan: string
  dailyQuota: number
  createdAt: string
  registerIp: string | null
}

export function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    plan: row.plan,
    dailyQuota: row.dailyQuota,
    createdAt: row.createdAt.toISOString(),
    registerIp: row.registerIp,
  }
}

export function clientIp(): string | undefined {
  return getRequestIP({ xForwardedFor: true })
}

export function clientUserAgent(): string | undefined {
  return getRequestHeader("user-agent")
}

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production"
}

export async function createSession(
  userId: string,
  opts?: { remember?: boolean },
): Promise<void> {
  const token = randomToken(32)
  const days = opts?.remember === false ? SESSION_DAYS_SHORT : SESSION_DAYS
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  await db.insert(sessions).values({
    userId,
    tokenHash: sha256Hex(token),
    expiresAt,
    ip: clientIp(),
    userAgent: clientUserAgent()?.slice(0, 500),
  })

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: days * 24 * 60 * 60,
  })
}

export async function destroySession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE)
  if (token) {
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, sha256Hex(token)))
  }
  deleteCookie(SESSION_COOKIE, { path: "/" })
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const token = getCookie(SESSION_COOKIE)
  if (!token) return null

  const tokenHash = sha256Hex(token)
  const now = new Date()

  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1)

  return row ? toPublicUser(row.user) : null
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error("请先登录")
  }
  return user
}
