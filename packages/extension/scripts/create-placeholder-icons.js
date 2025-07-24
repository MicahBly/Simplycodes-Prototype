import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sizes = [16, 32, 48, 128];

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SC', size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

for (const size of sizes) {
  const buffer = createIcon(size);
  const path = resolve(__dirname, `../public/icons/icon-${size}.png`);
  writeFileSync(path, buffer);
  console.log(`Created icon-${size}.png`);
}