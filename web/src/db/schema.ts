import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core"

export const users = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: text("display_name").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  plan: text("plan").notNull().default("free"),
  dailyQuota: integer("daily_quota").notNull().default(100),
  /** Registration IP (first signup). */
  registerIp: text("register_ip"),
  /** Reserved for Google OAuth. */
  googleId: text("google_id").unique(),
  /** Reserved for GitHub OAuth. */
  githubId: text("github_id").unique(),
  /** Registration time. */
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const sessions = pgTable(
  "app_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("app_sessions_user_idx").on(t.userId),
    index("app_sessions_expires_idx").on(t.expiresAt),
  ],
)

export const apiKeys = pgTable(
  "app_api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("default"),
    prefix: text("prefix").notNull(),
    hashedKey: text("hashed_key").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("app_api_keys_user_idx").on(t.userId)],
)

export const conversions = pgTable(
  "app_conversions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    clientIp: text("client_ip"),
    filename: text("filename").notNull(),
    sourceType: text("source_type").notNull().default("input"),
    status: text("status").notNull().default("succeeded"),
    downloadUrl: text("download_url"),
    fileSize: integer("file_size").notNull().default(0),
    title: text("title"),
    preview: text("preview"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("app_conversions_user_idx").on(t.userId),
    index("app_conversions_created_idx").on(t.createdAt),
  ],
)

export const usageEvents = pgTable(
  "app_usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    clientIp: text("client_ip"),
    action: text("action").notNull().default("convert"),
    units: integer("units").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("app_usage_created_idx").on(t.createdAt)],
)
