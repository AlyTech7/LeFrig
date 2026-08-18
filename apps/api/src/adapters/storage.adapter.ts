import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export type StorageMode = 's3' | 'local';

@Injectable()
export class StorageAdapter {
  private readonly logger = new Logger(StorageAdapter.name);
  private readonly uploadRoot: string;
  private readonly publicBaseUrl: string;
  private readonly publicBasePath: string;
  private readonly s3Client: S3Client | null;
  private readonly s3Bucket: string | null;
  private readonly mode: StorageMode;
  /** R2 (y otros S3 sin ACL) fallan si se envía ACL: public-read. */
  private readonly objectAclSupported: boolean;
  private readonly worker: { url: string; secret: string } | null;

  constructor(private config: ConfigService) {
    this.uploadRoot = this.config.get('UPLOAD_DIR', join(process.cwd(), 'uploads'));
    const apiBase = this.config.get('API_PUBLIC_URL', 'http://localhost:3001');
    const storagePublic = this.config.get('STORAGE_PUBLIC_URL');
    this.publicBaseUrl = (storagePublic ?? `${apiBase.replace(/\/$/, '')}/uploads`).replace(/\/$/, '');

    const parsedBase = new URL(this.publicBaseUrl);
    this.publicBasePath = parsedBase.pathname.replace(/\/$/, '');

    const endpoint = this.config.get<string>('STORAGE_ENDPOINT') ?? '';
    const accessKey = this.config.get<string>('STORAGE_ACCESS_KEY');
    const secretKey = this.config.get<string>('STORAGE_SECRET_KEY');
    this.s3Bucket = this.config.get<string>('STORAGE_BUCKET') ?? null;

    const useS3 =
      Boolean(endpoint && accessKey && secretKey && this.s3Bucket) &&
      !endpoint.includes('localhost') &&
      !endpoint.includes('127.0.0.1');

    const isR2 = /r2\.cloudflarestorage\.com/i.test(endpoint);
    this.objectAclSupported =
      !isR2 && this.config.get('STORAGE_SKIP_ACL', 'false') !== 'true';

    const workerUrl = (this.config.get<string>('STORAGE_WORKER_URL') ?? '').replace(/\/$/, '');
    const workerSecret = this.config.get<string>('STORAGE_WORKER_SECRET') ?? '';
    this.worker = workerUrl && workerSecret ? { url: workerUrl, secret: workerSecret } : null;

    if (useS3) {
      this.s3Client = new S3Client({
        endpoint,
        region: this.config.get('STORAGE_REGION', isR2 ? 'auto' : 'us-east-1'),
        credentials: { accessKeyId: accessKey!, secretAccessKey: secretKey! },
        forcePathStyle: this.config.get('STORAGE_FORCE_PATH_STYLE', 'true') === 'true',
        // AWS SDK v3 manda checksums que R2 rechaza (uploads 400).
        ...(isR2
          ? {
              requestChecksumCalculation: 'WHEN_REQUIRED' as const,
              responseChecksumValidation: 'WHEN_REQUIRED' as const,
            }
          : {}),
      });
      this.mode = 's3';
      this.logger.log(
        `Storage: S3-compatible (${endpoint}) → ${this.publicBaseUrl}${isR2 ? ' [R2, sin ACL]' : ''}`,
      );
    } else if (this.worker) {
      this.s3Client = null;
      this.mode = 's3';
      this.logger.log(`Storage: R2 via worker (${this.worker.url}) → ${this.publicBaseUrl}`);
    } else {
      this.s3Client = null;
      this.mode = 'local';
      this.logger.log(`Storage: local filesystem (${this.uploadRoot}) → ${this.publicBaseUrl}`);
      if (this.config.get('NODE_ENV') === 'production') {
        this.logger.warn(
          'STORAGE: disco local en producción — las imágenes se pierden al redeploy. Configura STORAGE_* (R2/S3/Spaces).',
        );
      }
    }
  }

  getMode(): StorageMode {
    return this.mode;
  }

  isCloudStorage(): boolean {
    return this.mode === 's3';
  }

  isPersistent(): boolean {
    return this.isCloudStorage();
  }

  getPublicBaseUrl(): string {
    return this.publicBaseUrl;
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const fullKey = key || `misc/${randomUUID()}`;

    if (this.worker) {
      await this.uploadViaWorker(fullKey, buffer, contentType);
      const url = this.buildPublicUrl(fullKey);
      this.logger.log(`Stored ${fullKey} via R2 worker (${contentType}, ${buffer.length} bytes)`);
      return { key: fullKey, url, size: buffer.length };
    }

    if (this.s3Client && this.s3Bucket) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: fullKey,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
          // Spaces/S3: sin ACL las URLs públicas del bucket responden 403.
          // R2 no soporta ACL de objeto: la lectura pública va por r2.dev / dominio custom.
          ...(this.objectAclSupported ? { ACL: 'public-read' as const } : {}),
        }),
      );
      const url = this.buildPublicUrl(fullKey);
      this.logger.log(`Stored ${fullKey} in S3 (${contentType}, ${buffer.length} bytes)`);
      return { key: fullKey, url, size: buffer.length };
    }

    const filePath = join(this.uploadRoot, fullKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    const url = this.buildPublicUrl(fullKey);
    this.logger.log(`Stored ${fullKey} locally (${contentType}, ${buffer.length} bytes)`);
    return { key: fullKey, url, size: buffer.length };
  }

  async delete(key: string): Promise<void> {
    if (this.worker) {
      try {
        await this.deleteViaWorker(key);
        this.logger.log(`Deleted ${key} via R2 worker`);
      } catch {
        this.logger.warn(`Could not delete ${key} via R2 worker`);
      }
      return;
    }

    if (this.s3Client && this.s3Bucket) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.s3Bucket,
            Key: key,
          }),
        );
        this.logger.log(`Deleted ${key} from S3`);
      } catch {
        this.logger.warn(`Could not delete ${key} from S3`);
      }
      return;
    }

    const filePath = join(this.uploadRoot, key);
    try {
      await unlink(filePath);
      this.logger.log(`Deleted ${key}`);
    } catch {
      this.logger.warn(`Could not delete ${key}`);
    }
  }

  keyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const base = new URL(this.publicBaseUrl);
      if (parsed.origin !== base.origin) return null;

      let path = parsed.pathname.replace(/^\//, '');
      if (this.publicBasePath && path.startsWith(`${this.publicBasePath.replace(/^\//, '')}/`)) {
        path = path.slice(this.publicBasePath.replace(/^\//, '').length + 1);
      }
      return path || null;
    } catch {
      return null;
    }
  }

  isAllowedImageUrl(url: string, userId?: string): boolean {
    const key = this.keyFromUrl(url);
    if (!key) return false;
    if (!key.startsWith('listings/')) return false;
    if (userId && !key.startsWith(`listings/${userId}/`)) return false;
    return /\.(jpe?g|png|webp|gif)$/i.test(key);
  }

  assertOwnedImageUrls(urls: string[], userId: string): void {
    if (!urls.length) return;
    for (const url of urls) {
      if (!this.isAllowedImageUrl(url, userId)) {
        throw new BadRequestException('URL de imagen no válida. Sube la foto desde LeFrig.');
      }
    }
  }

  assertOwnedImageUrl(url: string | undefined, userId: string): void {
    if (!url) return;
    this.assertOwnedImageUrls([url], userId);
  }

  async purgeUrls(urls: string[]): Promise<void> {
    for (const url of urls) {
      const key = this.keyFromUrl(url);
      if (key) await this.delete(key);
    }
  }

  /** Marca un objeto como público (necesario en Spaces tras uploads sin ACL). */
  async makeObjectPublic(key: string): Promise<void> {
    if (!this.s3Client || !this.s3Bucket || !this.objectAclSupported) return;
    await this.s3Client.send(
      new PutObjectAclCommand({
        Bucket: this.s3Bucket,
        Key: key,
        ACL: 'public-read',
      }),
    );
  }

  /** Idempotente: publica todos los objetos bajo un prefijo (p.ej. listings/). */
  async makePrefixPublic(prefix = 'listings/'): Promise<number> {
    if (!this.s3Client || !this.s3Bucket) return 0;
    let token: string | undefined;
    let count = 0;
    do {
      const page = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.s3Bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const obj of page.Contents ?? []) {
        if (!obj.Key) continue;
        await this.makeObjectPublic(obj.Key);
        count += 1;
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    this.logger.log(`Made ${count} objects public under ${prefix}`);
    return count;
  }

  buildPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.replace(/\\/g, '/')}`;
  }

  getPublicUrl(key: string): string {
    return this.buildPublicUrl(key);
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }

  private workerObjectUrl(key: string): string {
    return `${this.worker!.url}/${key.replace(/\\/g, '/').replace(/^\/+/, '')}`;
  }

  private async uploadViaWorker(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const res = await fetch(this.workerObjectUrl(key), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.worker!.secret}`,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`R2 worker upload ${res.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    }
  }

  private async deleteViaWorker(key: string): Promise<void> {
    const res = await fetch(this.workerObjectUrl(key), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.worker!.secret}` },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`R2 worker delete ${res.status}`);
    }
  }
}
