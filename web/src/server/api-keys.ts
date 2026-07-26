import { createServerFn } from "@tanstack/react-start"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { apiKeys } from "@/db/schema"
import {
  createApiKeySchema,
  revokeApiKeySchema,
} from "@/lib/validations/auth"
import { generateApiKey } from "@/server/crypto"
import { requireUser } from "@/server/session"

export type ApiKeyListItem = {
  id: string
  name: string
  prefix: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
}

export const listApiKeys = createServerFn({ method: "GET" }).handler(
  async (): Promise<ApiKeyListItem[]> => {
    const user = await requireUser()
    const rows = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.id))
      .orderBy(desc(apiKeys.createdAt))

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    }))
  },
)

export const createApiKey = createServerFn({ method: "POST" })
  .validator(createApiKeySchema)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const { raw, prefix, hashedKey } = generateApiKey()

    const [row] = await db
      .insert(apiKeys)
      .values({
        userId: user.id,
        name: data.name,
        prefix,
        hashedKey,
        isActive: true,
      })
      .returning()

    return {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: row.createdAt.toISOString(),
      /** Shown once — store securely. */
      key: raw,
    }
  })

export const revokeApiKey = createServerFn({ method: "POST" })
  .validator(revokeApiKeySchema)
  .handler(async ({ data }) => {
    const user = await requireUser()
    const [row] = await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, data.id), eq(apiKeys.userId, user.id)))
      .returning()

    if (!row) throw new Error("Key 不存在")
    return { ok: true as const }
  })
