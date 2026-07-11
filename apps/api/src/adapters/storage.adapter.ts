import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

@Injectable()
export class StorageAdapter {
  private readonly logger = new Logger(StorageAdapter.name);
  private readonly uploadRoot: string;
  private readonly publicBaseUrl: string;
  private readonly s3Client: S3Client | null;
  private readonly s3Bucket: string | null;

  constructor(private config: ConfigService) {
    this.uploadRoot = this.config.get('UPLOAD_DIR', join(process.cwd(), 'uploads'));
    const apiBase = this.config.get('API_PUBLIC_URL', 'http://localhost:3001');
    const storagePublic = this.config.get('STORAGE_PUBLIC_URL');
    this.publicBaseUrl = (storagePublic ?? `${apiBase.replace(/\/$/, '')}/uploads`).replace(/\/$/, '');

    const endpoint = this.config.get<string>('STORAGE_ENDPOINT') ?? '';
    const accessKey = this.config.get<string>('STORAGE_ACCESS_KEY');
    const secretKey = this.config.get<string>('STORAGE_SECRET_KEY');
    this.s3Bucket = this.config.get<string>('STORAGE_BUCKET') ?? null;

    const useS3 =
      Boolean(endpoint && accessKey && secretKey && this.s3Bucket) &&
      !endpoint.includes('localhost') &&
      !endpoint.includes('127.0.0.1');

    if (useS3) {
      this.s3Client = new S3Client({
        endpoint,
        region: this.config.get('STORAGE_REGION', 'auto'),
        credentials: { accessKeyId: accessKey!, secretAccessKey: secretKey! },
        forcePathStyle: this.config.get('STORAGE_FORCE_PATH_STYLE', 'true') === 'true',
      });
      this.logger.log(`Storage: S3-compatible (${endpoint})`);
    } else {
      this.s3Client = null;
      this.logger.log(`Storage: local filesystem (${this.uploadRoot})`);
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const fullKey = key || `misc/${randomUUID()}`;

    if (this.s3Client && this.s3Bucket) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: fullKey,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const url = `${this.publicBaseUrl}/${fullKey.replace(/\\/g, '/')}`;
      this.logger.log(`Stored ${fullKey} in S3 (${contentType}, ${buffer.length} bytes)`);
      return { key: fullKey, url, size: buffer.length };
    }

    const filePath = join(this.uploadRoot, fullKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    const url = `${this.publicBaseUrl}/${fullKey.replace(/\\/g, '/')}`;
    this.logger.log(`Stored ${fullKey} locally (${contentType}, ${buffer.length} bytes)`);
    return { key: fullKey, url, size: buffer.length };
  }

  async delete(key: string): Promise<void> {
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

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.replace(/\\/g, '/')}`;
  }

  getUploadRoot(): string {
    return this.uploadRoot;
  }
}
