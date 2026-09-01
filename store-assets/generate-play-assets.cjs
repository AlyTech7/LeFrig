const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(__dirname, 'play');
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });

const logoSrc = path.join(root, 'apps/web/app/icon-1024.png');

async function makeIcon() {
  await sharp(logoSrc).resize(512, 512, { fit: 'cover' }).png().toFile(path.join(out, 'icon-512.png'));
  const meta = await sharp(path.join(out, 'icon-512.png')).metadata();
  console.log('✓ icon-512.png', meta.width, '×', meta.height);
}

async function makeFeatureGraphic() {
  const logoBuf = await sharp(logoSrc).resize(260, 260).png().toBuffer();
  const logoB64 = logoBuf.toString('base64');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0b10"/>
      <stop offset="50%" stop-color="#14131a"/>
      <stop offset="100%" stop-color="#1a1610"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8c56a"/>
      <stop offset="100%" stop-color="#c9a24d"/>
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="48%" r="42%">
      <stop offset="0%" stop-color="#c9a24d" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#c9a24d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <rect x="0" y="0" width="5" height="500" fill="url(#gold)"/>
  <image href="data:image/png;base64,${logoB64}" x="80" y="120" width="260" height="260"/>
  <text x="400" y="205" font-family="Georgia, Times New Roman, serif" font-size="70" font-weight="700" fill="#f4f1ea">LeFrig</text>
  <rect x="400" y="226" width="52" height="4" rx="2" fill="#c9a24d"/>
  <text x="400" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="32" fill="#c9a24d">Mercado saharaui</text>
  <text x="400" y="335" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#b0a99c">Compra, vende, servicios y transporte</text>
  <text x="400" y="368" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#7d776c">en tu campamento</text>
</svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(out, 'feature-graphic-1024x500.png'));
  const meta = await sharp(path.join(out, 'feature-graphic-1024x500.png')).metadata();
  console.log('✓ feature-graphic-1024x500.png', meta.width, '×', meta.height);
}

async function processScreenshot(src, destName) {
  if (!fs.existsSync(src)) {
    console.warn('skip missing', src);
    return false;
  }
  const targetW = 1080;
  const targetH = 1920;
  const bg = { r: 247, g: 242, b: 232, alpha: 1 };

  await sharp(src)
    .rotate()
    .resize(targetW, targetH, { fit: 'contain', background: bg })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(path.join(out, 'screenshots', destName));

  const meta = await sharp(path.join(out, 'screenshots', destName)).metadata();
  console.log('✓ screenshots/' + destName, meta.width, '×', meta.height);
  return true;
}

async function makeScreenshots() {
  const assetsRoot = path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-User-Desktop-LeFrig/assets',
  );

  const shots = [
    {
      name: '01-inicio.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_image-6a3dbf36-b654-47fe-95f3-980083afd4b8.png',
    },
    {
      name: '02-transporte.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_image-c131d176-d8b7-49cd-b0b7-027c30c733c7.png',
    },
    {
      name: '03-login.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_image-88232ed8-db4b-40f0-abe7-ffe75ecbec9b.png',
    },
    {
      name: '04-cuenta.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_image-cbf7d09b-bd6c-49eb-9c1b-98578914a41a.png',
    },
    {
      name: '05-publicar.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_1787998999679-866f1e5f-fbf1-4f86-a365-058db3946b47.png',
    },
    {
      name: '06-mercado.jpg',
      file: 'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_645e9fdd27080a4accdd62799a6e7583_images_image-50db59a8-4e0e-462e-b64e-8bc67de5a5d3.png',
    },
  ];

  let n = 0;
  for (const s of shots) {
    const ok = await processScreenshot(path.join(assetsRoot, s.file), s.name);
    if (ok) n += 1;
  }
  console.log('✓ ' + n + ' screenshots ready');
}

function writeCopy() {
  const md = `# Play Store assets — LeFrig

## Archivos listos para subir

| Archivo | Uso en Play Console |
|---------|---------------------|
| \`icon-512.png\` | Icono de la aplicación (512×512) |
| \`feature-graphic-1024x500.png\` | Gráfico de funciones (1024×500) |
| \`screenshots/*.jpg\` | Capturas de teléfono (1080×1920, 9:16) |

## Textos (copiar/pegar)

**Nombre:** LeFrig

**Descripción breve:**
\`\`\`
Mercado saharaui: compra, vende, servicios y transporte en tu campamento.
\`\`\`

**Descripción completa:**
\`\`\`
LeFrig es el mercado digital de los campamentos saharauis.

Compra y vende coches, móviles, muebles, comida y más. Encuentra servicios locales, tiendas y opciones de transporte seguro entre campamentos y ciudades.

¿Qué puedes hacer?
• Publicar anuncios en minutos
• Explorar el mercado por categorías
• Contactar vendedores y servicios
• Consultar transporte y rutas
• Gestionar tu cuenta de forma sencilla

LeFrig acerca el bazar a tu móvil: busca lo que necesitas, publica lo que vendes y conecta con tu comunidad.

Soporte: hola@lefrig.com
Web: https://www.lefrig.com
\`\`\`

## Orden recomendado de capturas

1. \`01-inicio.jpg\` — Inicio / salas del mercado
2. \`05-publicar.jpg\` — Publicar anuncio
3. \`02-transporte.jpg\` — Transporte
4. \`03-login.jpg\` — Acceso
5. \`04-cuenta.jpg\` — Cuenta
6. \`06-mercado.jpg\` — Mercado (placeholders; sustituir cuando haya fotos reales)

Mínimo obligatorio: **2 capturas**. Sube al menos **01, 05 y 02**.

## Regenerar

\`\`\`bash
node store-assets/generate-play-assets.cjs
\`\`\`
`;
  fs.writeFileSync(path.join(__dirname, 'README.md'), md, 'utf8');
  console.log('✓ README.md');
}

(async () => {
  await makeIcon();
  await makeFeatureGraphic();
  await makeScreenshots();
  writeCopy();
  console.log('\\nListo →', out);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
