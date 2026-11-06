/**
 * One-off / repeatable: generate optimized WebP siblings for every existing
 * png/jpg upload so server.js can serve them transparently.
 *
 *   node scripts/optimize-existing-uploads.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'uploads', 'images');

async function main() {
  if (!fs.existsSync(imagesDir)) {
    console.error('No images directory at', imagesDir);
    process.exit(1);
  }
  const files = fs.readdirSync(imagesDir).filter(f => /\.(png|jpe?g)$/i.test(f));
  let created = 0, skipped = 0, failed = 0;
  let beforeBytes = 0, afterBytes = 0;

  for (const f of files) {
    const src = path.join(imagesDir, f);
    const dest = src.replace(/\.(png|jpe?g)$/i, '.webp');
    beforeBytes += fs.statSync(src).size;
    try {
      if (fs.existsSync(dest)) { skipped++; continue; }
      await sharp(src)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(dest);
      afterBytes += fs.statSync(dest).size;
      created++;
    } catch (err) {
      failed++;
      console.error(`SKIP ${f}: ${err.message}`);
    }
  }

  const kb = n => `${(n / 1024).toFixed(0)} KB`;
  console.log(`Done. converted=${created} already-existed=${skipped} failed=${failed}`);
  console.log(`Serving cost for converted set: ${kb(afterBytes)} WebP vs ${kb(beforeBytes)} originals`);
}

main();
