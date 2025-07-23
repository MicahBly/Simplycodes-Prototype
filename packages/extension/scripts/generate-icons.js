import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sizes = [16, 32, 48, 128];
const svgBuffer = readFileSync(resolve(__dirname, '../public/icons/icon.svg'));

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(resolve(__dirname, `../public/icons/icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);