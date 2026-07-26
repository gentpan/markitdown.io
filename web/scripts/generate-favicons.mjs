/**
 * Regenerate PNG/ICO favicons from public/brand/*.svg
 * Usage: node scripts/generate-favicons.mjs
 * Requires: npm i -D sharp png-to-ico
 */
import sharp from "sharp"
import pngToIco from "png-to-ico"
import { writeFileSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const publicDir = join(root, "public")
const brandDir = join(publicDir, "brand")
const simple = readFileSync(join(brandDir, "mark-simple.svg"))
const full = readFileSync(join(brandDir, "mark.svg"))

async function render(svg, size, out) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out)
  console.log("wrote", out.slice(root.length + 1))
}

for (const [svg, size, name] of [
  [simple, 16, "favicon-16x16.png"],
  [simple, 32, "favicon-32x32.png"],
  [simple, 48, "favicon-48x48.png"],
  [full, 180, "apple-touch-icon.png"],
  [full, 192, "android-chrome-192x192.png"],
  [full, 512, "android-chrome-512x512.png"],
  [full, 192, "logo192.png"],
  [full, 512, "logo512.png"],
]) {
  await render(svg, size, join(publicDir, name))
}
await render(full, 512, join(brandDir, "mark-512.png"))

writeFileSync(
  join(publicDir, "favicon.ico"),
  await pngToIco([
    join(publicDir, "favicon-16x16.png"),
    join(publicDir, "favicon-32x32.png"),
    join(publicDir, "favicon-48x48.png"),
  ]),
)
console.log("wrote favicon.ico")
