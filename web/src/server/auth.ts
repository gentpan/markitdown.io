import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { DAILY_WEB_CREDITS } from "@/lib/quota"
import { loginSchema, registerSchema } from "@/lib/validations/auth"
import {
  gravatarUrlForEmail,
  hashPassword,
  verifyPassword,
} from "@/server/crypto"
import {
  clientIp,
  createSession,
  destroySession,
  getSessionUser,
  toPublicUser,
} from "@/server/session"

export type AuthResult =
  | { ok: true; user: ReturnType<typeof toPublicUser> }
  | { ok: false; error: string }

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => getSessionUser(),
)

export const registerUser = createServerFn({ method: "POST" })
  .validator(registerSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (existing) {
      return { ok: false, error: "该邮箱已注册，请直接登录" }
    }

    const ip = clientIp() ?? null
    const avatarUrl = gravatarUrlForEmail(data.email, 160)

    const [row] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: hashPassword(data.password),
        displayName: data.displayName,
        avatarUrl,
        plan: "free",
        dailyQuota: DAILY_WEB_CREDITS,
        registerIp: ip,
      })
      .returning()

    await createSession(row.id, { remember: true })
    return { ok: true, user: toPublicUser(row) }
  })

export const loginUser = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data }): Promise<AuthResult> => {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!row?.passwordHash) {
      return { ok: false, error: "邮箱或密码不正确" }
    }

    if (!verifyPassword(data.password, row.passwordHash)) {
      return { ok: false, error: "邮箱或密码不正确" }
    }

    await createSession(row.id, { remember: data.remember })
    return { ok: true, user: toPublicUser(row) }
  })

export const logoutUser = createServerFn({ method: "POST" }).handler(
  async () => {
    await destroySession()
    return { ok: true as const }
  },
)
