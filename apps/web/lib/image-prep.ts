import { MAX_IMAGE_BYTES } from './uploads';

const HEIC_RE = /\.(heic|heif)$/i;
const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

export function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  return HEIC_TYPES.has(type) || HEIC_RE.test(file.name);
}

export function isRasterImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  const blob = Array.isArray(result) ? result[0]! : result;
  const base = file.name.replace(HEIC_RE, '') || 'foto';
  return new File([blob], `${base.replace(/\.$/, '')}.jpg`, { type: 'image/jpeg' });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

async function canvasToJpegFile(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number,
  name: string,
): Promise<File> {
  const { width, height } = img;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('No se pudo comprimir la imagen');

  const safeName = name.replace(/\.\w+$/i, '.jpg');
  return new File([blob], safeName, { type: 'image/jpeg', lastModified: Date.now() });
}

/** Convierte HEIC, redimensiona y comprime para subida fiable en móvil */
export async function prepareListingImage(file: File): Promise<File> {
  if (!isRasterImage(file)) {
    throw new Error('Solo se permiten imágenes (JPG, PNG, WebP, HEIC…)');
  }

  let working = file;
  if (isHeicFile(file)) {
    working = await heicToJpeg(file);
  }

  if (working.type === 'image/gif') {
    if (working.size <= MAX_IMAGE_BYTES) return working;
    throw new Error('El GIF supera 5 MB. Usa JPG o PNG.');
  }

  const needsCompress =
    working.size > MAX_IMAGE_BYTES ||
    working.size > 1.2 * 1024 * 1024 ||
    !['image/jpeg', 'image/webp'].includes(working.type);

  if (!needsCompress && working.size <= MAX_IMAGE_BYTES) {
    return working;
  }

  const img = await loadImage(working);
  let quality = 0.9;
  let maxEdge = 2048;
  let output = await canvasToJpegFile(img, maxEdge, quality, working.name);

  while (output.size > MAX_IMAGE_BYTES && quality > 0.5) {
    quality -= 0.08;
    output = await canvasToJpegFile(img, maxEdge, quality, working.name);
  }

  while (output.size > MAX_IMAGE_BYTES && maxEdge > 960) {
    maxEdge -= 256;
    output = await canvasToJpegFile(img, maxEdge, quality, working.name);
  }

  if (output.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen sigue siendo muy pesada. Prueba otra foto más pequeña.');
  }

  return output;
}

export type PrepareResult =
  | { ok: true; file: File }
  | { ok: false; name: string; error: string };

export async function prepareListingImages(files: File[]): Promise<PrepareResult[]> {
  const results: PrepareResult[] = [];
  for (const file of files) {
    try {
      results.push({ ok: true, file: await prepareListingImage(file) });
    } catch (err) {
      results.push({
        ok: false,
        name: file.name,
        error: err instanceof Error ? err.message : 'No se pudo procesar',
      });
    }
  }
  return results;
}
