/**
 * Descarga imágenes curadas para la home (Unsplash, licencia libre).
 * Ejecutar: node apps/web/scripts/fetch-home-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/images/home');

/** id Unsplash → ruta local relativa a /images/home */
const ASSETS = {
  'atlas/real-estate.jpg': 'photo-1600596542815-ffad4c1539a9',
  'atlas/vehicles.jpg': 'photo-1502877338535-766e1452684a',
  'atlas/services.jpg': 'photo-1504307651254-35680f356dfd',
  'atlas/family.jpg': 'photo-1445205170230-053b83016050',
  'atlas/jobs.jpg': 'photo-1600880292203-757bb62b4baf',
  'atlas/electronics.jpg': 'photo-1511707171634-5f897ff02aa9',
  'atlas/sport.jpg': 'photo-1517836357463-d25dfeac3438',
  'atlas/animals.jpg': 'photo-1719689831010-be9fe130e88b',
  'atlas/others.jpg': 'photo-1578662996442-48f60103fc96',
  'gate/publish.jpg': 'photo-1556742049-0cfed4f6a45d',
  'gate/transport.jpg': 'photo-1601584115197-04ecc0da31d7',
  'gate/services.jpg': 'photo-1581578731548-c64695cc6952',
  'gate/shops.jpg': 'photo-1441986300917-64674bd600d8',
  'curated/mobiles.jpg': 'photo-1511707171634-5f897ff02aa9',
  'curated/cars.jpg': 'photo-1492144534655-ae79c964c9d7',
  'curated/cosmetics.jpg': 'photo-1596462502278-27bfdc403348',
  'curated/henna.jpg': 'photo-1612817288484-6f916006741a',
  'curated/agua.jpg': 'photo-1523362628745-0c100150b504',
  'curated/solar.jpg': 'photo-1509391366360-2e959784a276',
  'curated/furniture.jpg': 'photo-1555041469-a586c61ea9bc',
  'curated/food.jpg': 'photo-1565299624946-b28f40a0ae38',
};

function url(id) {
  return `https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=85&fm=jpg`;
}

async function main() {
  let ok = 0;
  let fail = 0;
  for (const [rel, id] of Object.entries(ASSETS)) {
    const dest = path.join(OUT, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      const res = await fetch(url(id));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error('archivo demasiado pequeño');
      await writeFile(dest, buf);
      console.log('✓', rel, `(${Math.round(buf.length / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.error('✗', rel, e.message);
      fail++;
    }
  }
  console.log(`\nListo: ${ok} OK, ${fail} fallos`);
  if (fail) process.exit(1);
}

main();
