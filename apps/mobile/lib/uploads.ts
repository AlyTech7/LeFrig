import { API_URL } from './api';

export type UploadResult = { key: string; url: string; size: number };

function parseUploadError(status: number, body: string): string {
  if (status === 401) return 'Sesión expirada';
  if (status === 413) return 'Imagen demasiado grande (máx. 5 MB)';
  if (status === 415) return 'Formato no permitido';
  try {
    const parsed = JSON.parse(body) as { message?: string | string[] };
    if (typeof parsed.message === 'string') return parsed.message;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
  } catch {
    /* ignore */
  }
  return `Error al subir (${status})`;
}

export async function uploadListingImageFromUri(
  uri: string,
  token: string,
  filename = 'photo.jpg',
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/uploads/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(parseUploadError(res.status, body));
  }

  return res.json() as Promise<UploadResult>;
}
