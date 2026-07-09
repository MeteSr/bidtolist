import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const PUBLIC = new URL('../public', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const MB = 1024 * 1024;
const THRESHOLD_MB = 1.5;

const files = readdirSync(PUBLIC).filter(f => f.endsWith('.png'));
let compressed = 0;

for (const file of files) {
  const src = join(PUBLIC, file);
  const sizeMB = statSync(src).size / MB;
  if (sizeMB < THRESHOLD_MB) continue;

  const tmp = src + '.tmp';
  await sharp(src)
    .png({ compressionLevel: 9, quality: 80 })
    .toFile(tmp);

  const newSize = statSync(tmp).size / MB;
  if (newSize < sizeMB) {
    const { renameSync } = await import('fs');
    renameSync(tmp, src);
    console.log(`  ${file}: ${sizeMB.toFixed(1)}MB → ${newSize.toFixed(1)}MB`);
    compressed++;
  } else {
    const { unlinkSync } = await import('fs');
    unlinkSync(tmp);
    console.log(`  ${file}: already optimal (${sizeMB.toFixed(1)}MB)`);
  }
}

console.log(`\nDone — ${compressed} file(s) compressed.`);
