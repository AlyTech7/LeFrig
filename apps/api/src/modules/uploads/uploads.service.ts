import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StorageAdapter } from '../../adapters/storage.adapter';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function resolveMime(file: Express.Multer.File): string {
  const raw = (file.mimetype ?? '').toLowerCase().split(';')[0]!.trim();
  if (raw && raw !== 'application/octet-stream' && ALLOWED_MIME.has(raw)) {
    return raw;
  }
  const ext = file.originalname?.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? raw;
}

@Injectable()
export class UploadsService {
  constructor(private storage: StorageAdapter) {}

  validateFile(file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (file.size > MAX_BYTES) {
      throw new PayloadTooLargeException('La imagen supera 5 MB');
    }
    const mime = resolveMime(file);
    if (!ALLOWED_MIME.has(mime)) {
      throw new UnsupportedMediaTypeException('Formato no permitido. Usa JPG, PNG o WebP');
    }
    file.mimetype = mime;
  }

  async saveListingImage(file: Express.Multer.File, userId: string) {
    this.validateFile(file);
    const mime = resolveMime(file);
    const ext = EXT[mime] ?? 'jpg';
    const key = `listings/${userId}/${randomUUID()}.${ext}`;
    return this.storage.upload(key, file.buffer, mime);
  }

  async saveListingImages(files: Express.Multer.File[], userId: string) {
    if (!files?.length) throw new BadRequestException('No se recibieron archivos');
    if (files.length > 8) throw new BadRequestException('Máximo 8 imágenes por envío');
    const results = [];
    for (const file of files) {
      results.push(await this.saveListingImage(file, userId));
    }
    return results;
  }
}
