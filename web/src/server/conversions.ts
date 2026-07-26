import { createServerFn } from "@tanstack/react-start"
import { desc, gte, sql } from "drizzle-orm"

import { db } from "@/db"
import { conversions, usageEvents } from "@/db/schema"
import { DAILY_WEB_CREDITS } from "@/lib/quota"
import { recordConversionSchema } from "@/lib/validations/convert"

export const recordConversion = createServerFn({ method: "POST" })
  .validator(recordConversionSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(conversions)
      .values({
        filename: data.filename,
        sourceType: data.sourceType,
        status: data.status,
        downloadUrl: data.downloadUrl,
        fileSize: data.fileSize,
        title: data.title,
        preview: data.preview,
        clientIp: data.clientIp,
      })
      .returning()

    await db.insert(usageEvents).values({
      clientIp: data.clientIp,
      action: "convert",
      units: 1,
    })

    return row
  })

export const listRecentConversions = createServerFn({ method: "GET" }).handler(
  async () => {
    return db
      .select()
      .from(conversions)
      .orderBy(desc(conversions.createdAt))
      .limit(50)
  },
)

export const getUsageSummary = createServerFn({ method: "GET" }).handler(
  async () => {
    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)

    const [row] = await db
      .select({
        usedToday: sql<number>`coalesce(sum(${usageEvents.units}), 0)`,
      })
      .from(usageEvents)
      .where(gte(usageEvents.createdAt, dayStart))

    const dailyQuota = DAILY_WEB_CREDITS
    const usedToday = Number(row?.usedToday ?? 0)
    return {
      plan: "free",
      usedToday,
      dailyQuota,
      remaining: Math.max(dailyQuota - usedToday, 0),
    }
  },
)
