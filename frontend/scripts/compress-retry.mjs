import sharp from 'sharp';
import { writeFile, stat } from 'fs/promises';
import { join } from 'path';

const dir = 'C:/Users/massi/source/repos/maxange-developer/master_start2impact/frontend/public/images/blog';
const files = ['carneval-3.webp','kidsactivity-4.jpg','playa-7.png','santacruz-3.png','teide-1.jpg','villa-1.webp'];
const cfg = {
  '.jpg':  ['jpeg', { quality: 75, progressive: true }],
  '.jpeg': ['jpeg', { quality: 75, progressive: true }],
  '.png':  ['png',  { quality: 80, compressionLevel: 9 }],
  '.webp': ['webp', { quality: 80 }],
};

for (const f of files) {
  const ext = f.slice(f.lastIndexOf('.')).toLowerCase();
  const [fmt, opts] = cfg[ext];
  const p = join(dir, f);
  try {
    const before = (await stat(p)).size;
    const buf = await sharp(p).resize({ width: 1920, withoutEnlargement: true })[fmt](opts).toBuffer();
    if (buf.length < before) {
      await writeFile(p, buf);
      console.log(`✓ ${f}: ${(before/1024).toFixed(0)} KB → ${(buf.length/1024).toFixed(0)} KB  (saved ${((before-buf.length)/1024).toFixed(0)} KB)`);
    } else {
      console.log(`  skip ${f} (already optimal)`);
    }
  } catch (err) {
    console.error(`  ✗ ${f}: ${err.message}`);
  }
}
