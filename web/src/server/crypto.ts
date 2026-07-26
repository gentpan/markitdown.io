import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

import { gravatarUrlFromHash } from "@/lib/gravatar"

export function md5Hex(input: string): string {
  return createHash("md5").update(input).digest("hex")
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export function gravatarUrlForEmail(email: string, size = 160): string {
  return gravatarUrlFromHash(md5Hex(email.trim().toLowerCase()), size, "mp")
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$")
  if (algo !== "scrypt" || !salt || !hash) return false
  const next = scryptSync(password, salt, 64)
  const prev = Buffer.from(hash, "hex")
  if (prev.length !== next.length) return false
  return timingSafeEqual(prev, next)
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url")
}

export function generateApiKey(): { raw: string; prefix: string; hashedKey: string } {
  const secret = randomBytes(24).toString("base64url")
  const raw = `mk_live_${secret}`
  const prefix = raw.slice(0, 16)
  return { raw, prefix, hashedKey: sha256Hex(raw) }
}
