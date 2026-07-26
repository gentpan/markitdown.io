/** Gravatar via bluecdn mirror — URL helpers (hash computed on server at signup). */

export const GRAVATAR_HOST = "https://gravatar.bluecdn.com"

export function gravatarUrlFromHash(
  hash: string,
  size = 80,
  fallback: "mp" | "identicon" | "retro" = "mp",
): string {
  return `${GRAVATAR_HOST}/avatar/${hash}?s=${size}&d=${fallback}`
}

export function defaultGravatarUrl(size = 80): string {
  return gravatarUrlFromHash("0", size, "mp")
}
