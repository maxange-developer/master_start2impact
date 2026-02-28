/**
 * Image compression script — run once to shrink oversized images in-place.
 * Requires: sharp  (npm install --save-dev sharp)
 * Usage:    node frontend/scripts/compress-images.mjs
 *
 * What it does:
 *  - JPEG  → re-encode at quality 75, max 1920px wide  (in-place)
 *  - PNG   → re-encode at quality 80, max 1920px wide  (in-place)
 *  - WEBP  → re-encode at quality 80, max 1920px wide  (in-place)
 *  - AVIF  → skipped (already near-optimal)
 *  - Files already under MIN_SIZE_KB are skipped
 */

import sharp from "sharp";
import { readdir, stat, writeFile } from "fs/promises";
import { join, extname, basename } from "path";

const IMAGE_DIR = new URL("../public/images/blog", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1"); // fix Windows path on Node

const MIN_SIZE_KB = 200; // only process files larger than this
const MAX_WIDTH   = 1920;

const config = {
  ".jpg":  { format: "jpeg", options: { quality: 75, progressive: true } },
  ".jpeg": { format: "jpeg", options: { quality: 75, progressive: true } },
  ".png":  { format: "png",  options: { quality: 80, compressionLevel: 9 } },
  ".webp": { format: "webp", options: { quality: 80 } },
};

async function humanKB(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

async function processImage(filePath, ext) {
  const { format, options } = config[ext];

  try {
    const before = (await stat(filePath)).size;
    if (before / 1024 < MIN_SIZE_KB) return null;

    // Compress to buffer first, then write only if smaller (avoids locked-file rename issues on Windows)
    const buffer = await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      [format](options)
      .toBuffer();

    const after = buffer.length;

    if (after < before) {
      await writeFile(filePath, buffer);
      return { before, after, saved: before - after };
    }
    return null;
  } catch (err) {
    console.error(`  ✗ Error on ${basename(filePath)}: ${err.message}`);
    return null;
  }
}

async function main() {
  const files = await readdir(IMAGE_DIR);
  let totalSaved = 0;
  let processed  = 0;

  console.log(`\n🗜  Compressing images in: ${IMAGE_DIR}`);
  console.log(`   Min size: ${MIN_SIZE_KB} KB | Max width: ${MAX_WIDTH}px\n`);

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!config[ext]) continue;

    const filePath = join(IMAGE_DIR, file);
    const result   = await processImage(filePath, ext);

    if (result) {
      processed++;
      totalSaved += result.saved;
      console.log(
        `  ✓ ${file.padEnd(35)} ${await humanKB(result.before)} → ${await humanKB(result.after)}  (saved ${await humanKB(result.saved)})`
      );
    }
  }

  console.log(`\n✅ Done — ${processed} files compressed, ${(totalSaved / 1024 / 1024).toFixed(1)} MB saved total.\n`);
}

main().catch(console.error);
