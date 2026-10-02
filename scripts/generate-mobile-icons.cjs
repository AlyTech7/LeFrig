/**
 * Regenera iconos nativos de Expo desde el logo Lefrig (apps/web/app/icon-1024.png).
 * Uso: node scripts/generate-mobile-icons.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'apps/web/app/icon-1024.png');
const out = path.join(root, 'apps/mobile/assets');

async function main() {
  if (!fs.existsSync(src)) {
    throw new Error(`Logo no encontrado: ${src}`);
  }
  fs.mkdirSync(out, { recursive: true });

  await sharp(src).resize(1024, 1024, { fit: 'cover' }).png().toFile(path.join(out, 'icon.png'));

  const fgSize = 736;
  const resized = await sharp(src).resize(fgSize, fgSize, { fit: 'contain' }).png().toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toFile(path.join(out, 'adaptive-icon.png'));

  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(out, 'splash-icon.png'));

  await sharp(src).resize(48, 48, { fit: 'cover' }).png().toFile(path.join(out, 'favicon.png'));

  console.log('Iconos Lefrig escritos en apps/mobile/assets/');
  console.log('Siguiente: eas build --platform android --profile production && eas submit');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
