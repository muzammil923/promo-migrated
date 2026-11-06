/**
 * Optimize the images in apps/frontend/public for web performance.
 *
 * Converts the large mascot PNGs to appropriately-sized WebP files and
 * shrinks the oversized favicon. Originals are kept on disk (they just stop
 * being referenced). Re-run after replacing the source images:
 *
 *   node scripts/optimize-images.mjs
 */
import { readdirSync } from 'node:fs'
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// [source, target, maxWidth, format]
const jobs = [
  ['hero-mascot.png',  'hero-mascot.webp',  640,  'webp'],   // displayed ≤608px
  ['hero-mascot.png',  'hero-mascot-384.webp', 384, 'webp'], // mobile srcset variant
  ['mascot.png.png',   'mascot-b.webp',    240,  'webp'],     // bubble renders at ~110px
  ['mascotques.png',   'mascotques.webp',  256,  'webp'],
  ['mascot.png',       'mascot.webp',      1024, 'webp'],
  ['favicon2.png',     'favicon2.png',     320,  'png'],      // logo shown ≤160px wide (@2x)
  ['favicon.png',      'favicon.png',      64,   'png'],      // keep PNG for favicon support, shrink to 64px
]

for (const [src, dest, maxWidth, format] of jobs) {
  const input = path.join(publicDir, src)
  const output = path.join(publicDir, dest)
  try {
    const meta = await sharp(input).metadata()
    const width = Math.min(meta.width, maxWidth)
    const before = (await import('node:fs')).statSync(input).size
    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .toFormat(format, format === 'webp' ? { quality: 82 } : { quality: 90 })
      .toFile(output)
    const after = (await import('node:fs')).statSync(output).size
    console.log(
      `${src} -> ${dest}  ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (${meta.width}x${meta.height} -> ${width}px, ${format})`
    )
  } catch (err) {
    console.error(`SKIP ${src}: ${err.message}`)
  }
}
