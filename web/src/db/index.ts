import "dotenv/config"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://makeitdown:makeitdown@127.0.0.1:5433/makeitdown"

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>
}

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client
}

export const db = drizzle(client, { schema })
export { schema }
