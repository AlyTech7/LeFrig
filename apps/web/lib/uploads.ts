import { API_URL } from './api';

export type UploadResult = { key: string; url: string; size: number };

const UPLOAD_RETRIES = 2;

function parseUploadError(status: number, body: string): string {
  if (status === 401) return 'Sesión expirada. Vuelve a iniciar sesión.';
  if (status === 413) return 'La imagen supera 5 MB';
  if (status === 415) return 'Formato no permitido. Usa JPG, PNG o WebP';
  if (status === 0) return 'No hay conexión con el servidor. ¿Está la API activa?';

  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (typeof parsed.message === 'string') return parsed.message;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
  } catch {
    /* ignore */
  }
  return `Error al subir (${status})`;
}

export async function uploadListingImage(
  file: File,
  token: string | null,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  if (!token) {
    throw new Error('Inicia sesión para subir fotos');
  }

  let lastError = 'No se pudo subir la imagen';

  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      return await uploadOnce(file, token, onProgress);
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
      if (attempt < UPLOAD_RETRIES && !lastError.includes('Sesión')) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

/** Sube varias imágenes en una sola petición (más rápido en móvil). */
export async function uploadListingImagesBatch(
  files: File[],
  token: string | null,
): Promise<UploadResult[]> {
  if (!token) throw new Error('Inicia sesión para subir fotos');
  if (!files.length) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file, file.name);
  }

  const res = await fetch(`${API_URL}/uploads/images/batch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(parseUploadError(res.status, body));
  }

  return res.json() as Promise<UploadResult[]>;
}

function uploadOnce(
  file: File,
  token: string,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads/images`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120_000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult);
        } catch {
          reject(new Error('Respuesta inválida del servidor'));
        }
        return;
      }
      reject(new Error(parseUploadError(xhr.status, xhr.responseText)));
    };

    xhr.onerror = () => reject(new Error(parseUploadError(0, '')));
    xhr.ontimeout = () => reject(new Error('La subida tardó demasiado. Comprueba tu conexión.'));
    xhr.send(formData);
  });
}

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif';
export const GALLERY_ACCEPT = 'image/*';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 8;
export const UPLOAD_CONCURRENCY = 3;

export function validateImageFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const okType =
    type.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(name);

  if (!okType) return `"${file.name}" no es una imagen`;
  if (file.size === 0) return `"${file.name}" está vacío`;
  return null;
}

export async function runPool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency = UPLOAD_CONCURRENCY,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      await worker(item);
    }
  });
  await Promise.all(runners);
}
